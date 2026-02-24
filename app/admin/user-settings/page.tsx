"use client";

import { useState, useEffect } from "react";
import { Send, Loader2, Save, User } from "lucide-react";
import { auth, db } from "../../lib/firebase/config";
import { onAuthStateChanged, updateProfile, User as FirebaseUser } from "firebase/auth";
import { doc, updateDoc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function UserSettings() {

  const [user, setUser]               = useState<FirebaseUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail]             = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError]     = useState("");

  const [reason, setReason]   = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError]     = useState("");

  // ── Fetch current user on mount ──
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || "");

        // Pull displayName from Firestore (source of truth)
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        if (snap.exists()) {
          setDisplayName(snap.data().displayName || currentUser.displayName || "");
        } else {
          setDisplayName(currentUser.displayName || "");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ── Save display name only ──
  async function saveProfile() {
    if (!user) return;
    setProfileLoading(true);
    setProfileMessage("");
    setProfileError("");

    try {
      await updateProfile(user, { displayName });
      await updateDoc(doc(db, "users", user.uid), { displayName });
      setProfileMessage("Profile updated successfully!");
    } catch (err) {
      const e = err as Error;
      setProfileError(e.message || "Failed to update profile.");
    }

    setProfileLoading(false);
  }

  // ── Password change request ──
  async function submitRequest() {
    if (!user) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      await addDoc(collection(db, "passwordChangeRequests"), {
        uid: user.uid,
        email: user.email,
        displayName,
        reason,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      setMessage("Request sent to admin.");
      setReason("");
    } catch (err) {
      const e = err as Error;
      setError(e.message || "Failed to send request.");
    }

    setLoading(false);
  }

  return (
    <div className="px-8 py-6">
      <div className="max-w-2xl">

        <h1 className="text-2xl font-semibold mb-6 text-slate-900 ">
          User Settings
        </h1>

        {/* ── Profile Card ── */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">

          <div className="flex items-center gap-2 mb-1">
            <User size={18} className="text-slate-500 " />
            <h2 className="font-medium text-slate-600 ">
              Profile Information
            </h2>
          </div>

          <p className="text-sm text-slate-500  mb-5">
            Update your display name below. Email cannot be changed here.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

            <div>
              <label className="block text-xs font-medium text-slate-500  mb-1">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Juan dela Cruz"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-100  border border-slate-200 rounded px-3 py-2 text-slate-700 placeholder:text-slate-400  text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full bg-slate-200  border border-slate-200  rounded px-3 py-2 text-slate-400  text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1">
                Email cannot be changed.
              </p>
            </div>

          </div>

          <button
            onClick={saveProfile}
            disabled={profileLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          >
            {profileLoading
              ? <Loader2 className="animate-spin" size={16} />
              : <Save size={16} />
            }
            Save Changes
          </button>

          {profileMessage && <p className="text-green-500 mt-4 text-sm">{profileMessage}</p>}
          {profileError   && <p className="text-red-500 mt-4 text-sm">{profileError}</p>}

        </div>

        {/* ── Password Request Card ── */}
        <div className="bg-white  p-6 rounded-lg shadow">

          <h2 className="font-medium mb-2 text-slate-600 ">
            Request Password Change
          </h2>

          <p className="text-sm text-slate-500  mb-4">
            Send a request to admin to change your password.
          </p>

          <textarea
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-100  border border-slate-200 rounded px-3 py-2 mb-4 text-slate-600 placeholder:text-slate-400 text-sm"
          />

          <button
            onClick={submitRequest}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
          >
            {loading
              ? <Loader2 className="animate-spin" size={16} />
              : <Send size={16} />
            }
            Send Request
          </button>

          {message && <p className="text-green-500 mt-4 text-sm">{message}</p>}
          {error   && <p className="text-red-500 mt-4 text-sm">{error}</p>}

        </div>

      </div>
    </div>
  );
}