import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { LeaderboardEntry, ScoreSubmission } from '../types/LeaderboardTypes';
import { DB_MAX_WRITES_PER_MINUTE, DB_WRITE_RESET_INTERVAL_MS } from '../core/GameConfig';

// Public Web SDK config — injected at build time via .env, safe to commit values.
// Get from: Firebase Console → Project Settings → Your apps → Web app → Config
// DO NOT put the Admin SDK service account JSON here — that is server-only.
const FIREBASE_CONFIG = {
  apiKey: import.meta.env['VITE_FIREBASE_API_KEY'] as string,
  authDomain: import.meta.env['VITE_FIREBASE_AUTH_DOMAIN'] as string,
  projectId: import.meta.env['VITE_FIREBASE_PROJECT_ID'] as string,
  storageBucket: import.meta.env['VITE_FIREBASE_STORAGE_BUCKET'] as string,
  messagingSenderId: import.meta.env['VITE_FIREBASE_MESSAGING_SENDER_ID'] as string,
  appId: import.meta.env['VITE_FIREBASE_APP_ID'] as string,
};

export class FirebaseService {
  private readonly db: Firestore;
  private writeCount = 0;
  private resetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    const app = initializeApp(FIREBASE_CONFIG);
    this.db = getFirestore(app);
    this.scheduleWriteReset();
  }

  private scheduleWriteReset(): void {
    this.resetTimer = setTimeout(() => {
      this.writeCount = 0;
      this.scheduleWriteReset();
    }, DB_WRITE_RESET_INTERVAL_MS);
  }

  async submitScore(submission: ScoreSubmission): Promise<void> {
    if (this.writeCount >= DB_MAX_WRITES_PER_MINUTE) {
      console.warn('FirebaseService: write limit reached, skipping submission');
      return;
    }

    this.writeCount++;

    try {
      await addDoc(collection(this.db, 'users'), {
        name: submission.name,
        points: submission.points,
      });
    } catch (err) {
      console.error('FirebaseService: failed to submit score', err);
    }
  }

  subscribeLeaderboard(onUpdate: (entries: LeaderboardEntry[]) => void): () => void {
    return onSnapshot(
      collection(this.db, 'users'),
      (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((docSnap) => {
          entries.push(docSnap.data() as LeaderboardEntry);
        });
        entries.sort((a, b) => a.points - b.points);
        onUpdate(entries);
      },
      (err) => {
        console.error('FirebaseService: leaderboard subscription error', err);
      },
    );
  }

  destroy(): void {
    if (this.resetTimer !== null) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }
}
