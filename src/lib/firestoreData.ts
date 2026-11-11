/**
 * Firestore-backed repositories with graceful offline fallback.
 *
 * The audit found the app was **write-only**: `addDoc` existed but nothing ever
 * read the data back, so the UI rendered `MOCK_PETS` / `MOCK_POSTS` from
 * `localStorage`. This module closes that loop:
 *
 *   - `usePets()` / `usePosts()` subscribe with `onSnapshot` for live updates.
 *   - Documents written by anyone (including this browser) appear immediately.
 *   - If Firestore is unreachable / rules reject the read, the hook falls back
 *     to cached localStorage content and then to the bundled seed data, so the
 *     UI never blanks out.
 *
 * Every write stamps `ownerId` + `createdAt` so `firestore.rules` can enforce
 * owner-only mutation and `firestore.indexes.json` can serve ordered queries.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  limit as limitTo,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { MOCK_PETS } from "../data/pets";
import { MOCK_POSTS } from "../data/posts";
import type { Pet, Post } from "../types";

export type DataSource = "firestore" | "cache" | "seed";

export interface CollectionState<T> {
  items: T[];
  loading: boolean;
  source: DataSource;
}

// --------------------------------------------------------------------------
// localStorage cache helpers
// --------------------------------------------------------------------------

function readCache<T>(key: string): T[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch (error) {
    console.error(`[data] Unable to read cache "${key}":`, error);
    return null;
  }
}

function writeCache<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    // Quota exceeded is expected with many base64 images - non-fatal.
    console.warn(`[data] Unable to cache "${key}" (storage may be full):`, error);
  }
}

// --------------------------------------------------------------------------
// Generic live collection hook
// --------------------------------------------------------------------------

interface LiveCollectionOptions<T> {
  /** Firestore collection name. */
  collectionName: string;
  /** localStorage key used for the offline cache. */
  cacheKey: string;
  /** Bundled seed data shown before anything else exists. */
  seed: T[];
  /** Field to order by (must be indexed together with the filters used). */
  orderByField: string;
  /** Hard cap so a huge collection cannot stall the UI. */
  maxDocuments?: number;
  /** Maps a Firestore document to the app model. */
  toModel: (id: string, data: DocumentData) => T;
  /** Identifier used for de-duplication / merging with the seed. */
  getId: (item: T) => string;
}

function useLiveCollection<T>(options: LiveCollectionOptions<T>): CollectionState<T> {
  const {
    collectionName,
    cacheKey,
    seed,
    orderByField,
    maxDocuments = 200,
    toModel,
    getId,
  } = options;

  const [remote, setRemote] = useState<T[] | null>(null);
  const [source, setSource] = useState<DataSource>("seed");
  const initialCache = useMemo(() => readCache<T>(cacheKey), [cacheKey]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    // Show the cache instantly while Firestore connects.
    if (initialCache && initialCache.length > 0) {
      setRemote(initialCache);
      setSource("cache");
    }

    try {
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, "desc"),
        limitTo(maxDocuments),
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot<DocumentData>) => {
          if (cancelled) return;
          const items = snapshot.docs.map((doc) => toModel(doc.id, doc.data()));
          setRemote(items);
          setSource("firestore");
          writeCache(cacheKey, items);
        },
        (error) => {
          // Permission-denied is normal for signed-out visitors on private
          // collections; fall back to cache/seed instead of breaking the page.
          console.warn(`[data] Live subscription to "${collectionName}" failed:`, error.message);
          if (cancelled) return;
          setSource((current) => (current === "firestore" ? "cache" : current));
        },
      );
    } catch (error) {
      console.error(`[data] Unable to subscribe to "${collectionName}":`, error);
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
    // `initialCache` is memoised on cacheKey, which is stable per hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, orderByField, maxDocuments]);

  const items = useMemo(() => {
    if (!remote || remote.length === 0) return seed;
    // Seed entries use small numeric ids ("1", "p1"); real documents use
    // generated ids, so there is no overlap to worry about.
    return remote;
  }, [remote, seed]);

  return { items, loading: remote === null, source };
}

// --------------------------------------------------------------------------
// Pets
// --------------------------------------------------------------------------

function petFromDoc(id: string, data: DocumentData): Pet {
  return {
    id,
    name: String(data.name ?? "Unnamed Companion"),
    species: (data.species ?? "Dog") as Pet["species"],
    age: (data.age ?? "Adult") as Pet["age"],
    location: String(data.location ?? ""),
    imageUrl: String(data.imageUrl ?? ""),
    description: String(data.description ?? ""),
    medicalStatus: String(data.medicalStatus ?? ""),
    history: String(data.history ?? ""),
    shelterName: String(data.shelterName ?? ""),
    shelterPhone: String(data.shelterPhone ?? ""),
    birthDate: data.birthDate ? String(data.birthDate) : undefined,
    breed: data.breed ? String(data.breed) : undefined,
    personalityTraits: data.personalityTraits,
    ownerId: data.ownerId ? String(data.ownerId) : undefined,
    createdAt: toMillis(data.createdAt),
  };
}

/** Normalises a Firestore Timestamp / number / ISO string into epoch millis. */
function toMillis(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return undefined;
}

export function usePets(): CollectionState<Pet> {
  return useLiveCollection<Pet>({
    collectionName: "pets",
    cacheKey: "pet_community_pets",
    seed: MOCK_PETS,
    orderByField: "createdAt",
    toModel: petFromDoc,
    getId: (pet) => pet.id,
  });
}

/** Persists a new pet listing with an owner stamp for the security rules. */
export async function createPet(
  input: Omit<Pet, "id"> & { imageUrl: string },
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("[data] createPet skipped: no signed-in user");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, "pets"), {
      ...input,
      ownerId: user.uid,
      ownerEmail: user.email ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("[data] createPet failed:", error);
    return null;
  }
}

// --------------------------------------------------------------------------
// Community posts
// --------------------------------------------------------------------------

function postFromDoc(id: string, data: DocumentData): Post {
  const createdAt = data.createdAt;
  let timestamp = "Just now";
  if (createdAt && typeof createdAt.toDate === "function") {
    timestamp = createdAt.toDate().toLocaleString();
  } else if (typeof createdAt === "number") {
    timestamp = new Date(createdAt).toLocaleString();
  }
  return {
    id,
    author: String(data.author ?? "Proud Pet Parent"),
    avatarUrl: data.avatarUrl ? String(data.avatarUrl) : undefined,
    content: String(data.content ?? ""),
    imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
    likes: Number(data.likes ?? 0),
    comments: Number(data.comments ?? 0),
    shares: Number(data.shares ?? 0),
    saves: Number(data.saves ?? 0),
    timestamp,
    commentsList: Array.isArray(data.commentsList) ? data.commentsList : undefined,
  };
}

export function usePosts(): CollectionState<Post> {
  return useLiveCollection<Post>({
    collectionName: "posts",
    cacheKey: "pet_community_posts",
    seed: MOCK_POSTS,
    orderByField: "createdAt",
    toModel: postFromDoc,
    getId: (post) => post.id,
  });
}

/** Persists a community post with an owner stamp. */
export async function createPost(input: {
  author: string;
  content: string;
  imageUrl?: string;
  avatarUrl?: string;
}): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("[data] createPost skipped: no signed-in user");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, "posts"), {
      ...input,
      imageUrl: input.imageUrl ?? null,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("[data] createPost failed:", error);
    return null;
  }
}

// --------------------------------------------------------------------------
// Playdates
// --------------------------------------------------------------------------

export async function createPlaydate(input: {
  petId: string;
  petName?: string;
  date: string;
  location: string;
  notes?: string;
}): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("[data] createPlaydate skipped: no signed-in user");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, "playdates"), {
      ...input,
      status: "pending",
      requesterId: user.uid,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("[data] createPlaydate failed:", error);
    return null;
  }
}

// --------------------------------------------------------------------------
// Urgent expert requests
// --------------------------------------------------------------------------

export async function createUrgentRequest(input: {
  petId: string;
  petName?: string;
  symptoms: string;
  urgency?: "low" | "medium" | "high";
}): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("[data] createUrgentRequest skipped: no signed-in user");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, "urgentRequests"), {
      petId: input.petId,
      petName: input.petName ?? null,
      symptoms: input.symptoms,
      urgency: input.urgency ?? "high",
      userId: user.uid,
      ownerId: user.uid,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("[data] createUrgentRequest failed:", error);
    return null;
  }
}
