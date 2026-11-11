/**
 * Minimal server-side JSON persistence.
 *
 * The audit found `server.ts` explicitly skipped server-side storage
 * ("I will generate the wisdom and *just return it*, without server-side
 * persistence for now"). This module provides a small, dependency-free
 * write-through JSON store so generator output (daily wisdom, generated care
 * plans, ...) survives restarts and does not have to be regenerated - which
 * also cuts Gemini spend.
 *
 * Storage location is `<cwd>/.data/<name>.json`. The directory is created on
 * demand and the file is written atomically (tmp file + rename) so a crash
 * mid-write cannot corrupt it.
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");

export interface StoreOptions {
  /** Debounce between two flush passes, in milliseconds. */
  flushDelayMs?: number;
}

export class JsonStore<T> {
  private readonly filePath: string;
  private cache: T | null = null;
  private loading: Promise<T> | null = null;
  private dirty = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly fallback: T;
  private readonly flushDelayMs: number;

  constructor(name: string, fallback: T, options: StoreOptions = {}) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.fallback = fallback;
    this.flushDelayMs = options.flushDelayMs ?? 250;
  }

  async read(): Promise<T> {
    if (this.cache !== null) return this.cache;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      try {
        const raw = await readFile(this.filePath, "utf8");
        this.cache = JSON.parse(raw) as T;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
          console.warn(`[store] Unable to read ${this.filePath}:`, error);
        }
        this.cache = this.fallback;
      } finally {
        this.loading = null;
      }
      return this.cache as T;
    })();

    return this.loading;
  }

  async write(value: T): Promise<void> {
    this.cache = value;
    this.dirty = true;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.flushDelayMs);
    if (typeof this.timer.unref === "function") this.timer.unref();
  }

  async flush(): Promise<void> {
    if (!this.dirty || this.cache === null) return;
    this.dirty = false;
    const tmpPath = `${this.filePath}.tmp`;
    try {
      await mkdir(DATA_DIR, { recursive: true });
      await writeFile(tmpPath, JSON.stringify(this.cache, null, 2), "utf8");
      await rename(tmpPath, this.filePath);
    } catch (error) {
      console.error(`[store] Failed to persist ${this.filePath}:`, error);
      this.dirty = true;
    }
  }
}

export interface DailyWisdomEntry {
  /** ISO date, e.g. "2026-11-11". */
  date: string;
  tip: string;
  /** How the entry was produced: model name or "fallback". */
  source: string;
  createdAt: string;
}

export interface DailyWisdomRecord {
  entries: Record<string, DailyWisdomEntry>;
}

export const dailyWisdomStore = new JsonStore<DailyWisdomRecord>(
  "daily-wisdom",
  { entries: {} },
);

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
