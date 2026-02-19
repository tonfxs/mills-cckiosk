import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase/config";
import { UserProfile, UserRole } from "../types/user";

// ─── Create user doc on first register ───────────────────────────────────────
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  role: UserRole = "staff"   // default role for new users
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    uid,
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  });
}

// ─── Fetch user profile + role ────────────────────────────────────────────────
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

// ─── Update last login timestamp ──────────────────────────────────────────────
export async function updateLastLogin(uid: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    lastLogin: serverTimestamp(),
  });
}

// ─── Update a user's role (admin only) ───────────────────────────────────────
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db, "users", uid), { role });
}

// ─── Get all users (admin only) ───────────────────────────────────────────────
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