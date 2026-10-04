import { computed, Injectable, signal } from '@angular/core';

interface StoredSession {
  accessToken: string;
  expiresAt: string;
  // Typed by the user at sign-in; the contract has no user name.
  email?: string;
}

const STORAGE_KEY = 'safeplant.session';

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly current = signal<StoredSession | null>(readStored());

  readonly accessToken = computed(() => this.current()?.accessToken ?? null);
  readonly expiresAt = computed(() => this.current()?.expiresAt ?? null);
  readonly email = computed(() => this.current()?.email ?? null);

  start(session: StoredSession): void {
    this.current.set(session);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch {
      // storage unavailable: keep the session in memory only
    }
  }

  clear(): void {
    this.current.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  }
}

function readStored(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}
