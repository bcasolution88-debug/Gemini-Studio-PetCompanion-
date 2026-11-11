import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// The applet ships a NAMED Firestore database, not "(default)". Passing the
// database id explicitly is required - calling `getFirestore(app)` would target
// the default database and every read/write would fail with NOT_FOUND.
const databaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;

export const db = databaseId
  ? initializeFirestore(app, { ignoreUndefinedProperties: true }, databaseId)
  : initializeFirestore(app, { ignoreUndefinedProperties: true });

export const auth = getAuth(app);
export const storage = getStorage(app);
