import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { UserProfile, UserRole } from "../types/user";

// ─── Create user doc on first register ───────────────────────────────────────
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole = "staff"
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    isOnline: false,
  });
}

// ─── Fetch user profile + role ────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// ─── Update last login + append to loginHistory subcollection ─────────────────
export async function updateLastLogin(uid: string): Promise<void> {
  const now = serverTimestamp();
  await updateDoc(doc(db, "users", uid), { lastLogin: now });
  await addDoc(collection(db, "users", uid, "loginHistory"), {
    uid,
    loginAt: now,
  });
}

// ─── Presence: mark online ────────────────────────────────────────────────────
export async function setUserOnline(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    isOnline: true,
    lastSeen: serverTimestamp(),
  });
}

// ─── Presence: mark offline ───────────────────────────────────────────────────
export async function setUserOffline(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    isOnline: false,
    lastSeen: serverTimestamp(),
  });
}

// ─── Update a user's role ─────────────────────────────────────────────────────
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

// ─── Get all users ────────────────────────────────────────────────────────────
export async function getAllUsers(): Promise<UserProfile[]> {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as UserProfile);
}

// ─── Get users by role ────────────────────────────────────────────────────────
export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const q = query(collection(db, "users"), where("role", "==", role));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
}

// ─── Login history types ──────────────────────────────────────────────────────
export interface LoginRecord {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  loginAt: Timestamp;
}

// ─── One-time fetch ───────────────────────────────────────────────────────────
export async function getAllLoginHistory(maxPerUser = 50): Promise<LoginRecord[]> {
  const users = await getAllUsers();
  const records: LoginRecord[] = [];
  await Promise.all(
    users.map(async (user) => {
      const q = query(
        collection(db, "users", user.uid, "loginHistory"),
        orderBy("loginAt", "desc"),
        limit(maxPerUser)
      );
      const snap = await getDocs(q);
      snap.docs.forEach((d) => {
        records.push({
          uid: user.uid,
          displayName: user.displayName ?? "Unknown",
          email: user.email ?? "",
          role: user.role,
          loginAt: d.data().loginAt as Timestamp,
        });
      });
    })
  );
  return records.sort((a, b) => (b.loginAt?.seconds ?? 0) - (a.loginAt?.seconds ?? 0));
}

// ─── Real-time login history subscription ─────────────────────────────────────
export function subscribeToLoginHistory(
  cb: (records: LoginRecord[]) => void,
  maxPerUser = 100
): () => void {
  const recordsByUser = new Map<string, LoginRecord[]>();
  const historyUnsubs = new Map<string, () => void>();

  function flush() {
    const all: LoginRecord[] = [];
    recordsByUser.forEach((recs) => all.push(...recs));
    all.sort((a, b) => (b.loginAt?.seconds ?? 0) - (a.loginAt?.seconds ?? 0));
    cb(all);
  }

  const userUnsub = onSnapshot(collection(db, "users"), (userSnap) => {
    const users = userSnap.docs.map((d) => d.data() as UserProfile);
    const currentUids = new Set(users.map((u) => u.uid).filter(Boolean));

    historyUnsubs.forEach((unsub, uid) => {
      if (!currentUids.has(uid)) {
        unsub(); historyUnsubs.delete(uid); recordsByUser.delete(uid);
      }
    });

    users.forEach((user) => {
      if (!user?.uid) return;
      if (historyUnsubs.has(user.uid)) {
        recordsByUser.set(user.uid,
          (recordsByUser.get(user.uid) ?? []).map((r) => ({
            ...r,
            displayName: user.displayName ?? r.displayName,
            email: user.email ?? r.email,
            role: user.role ?? r.role,
          }))
        );
        return;
      }
      recordsByUser.set(user.uid, []);
      const q = query(
        collection(db, "users", user.uid, "loginHistory"),
        orderBy("loginAt", "desc"),
        limit(maxPerUser)
      );
      const unsub = onSnapshot(q, (snap) => {
        recordsByUser.set(user.uid, snap.docs.map((d) => ({
          uid: user.uid,
          displayName: user.displayName ?? "Unknown",
          email: user.email ?? "",
          role: user.role,
          loginAt: d.data().loginAt as Timestamp,
        })));
        flush();
      });
      historyUnsubs.set(user.uid, unsub);
    });

    flush();
  });

  return () => {
    userUnsub();
    historyUnsubs.forEach((unsub) => unsub());
  };
}

// ─── Real-time online users subscription ─────────────────────────────────────
export function subscribeToOnlineUsers(
  cb: (onlineUids: Set<string>) => void
): () => void {
  return onSnapshot(collection(db, "users"), (snap) => {
    const online = new Set<string>();
    snap.docs.forEach((d) => {
      const data = d.data() as UserProfile & { isOnline?: boolean };
      if (data.isOnline && data.uid) online.add(data.uid);
    });
    cb(online);
  });
}