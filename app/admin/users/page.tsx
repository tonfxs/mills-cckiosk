"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    UserPlus,
    ShieldCheck,
    Trash2,
    X,
    Loader2,
    Search,
    ChevronDown,
    Check,
    Wifi,
    WifiOff,
    RefreshCw,
    AlertCircle,
} from "lucide-react";
import { useRole } from "../../hooks/useRole";
import { useAuth } from "../../context/AuthContext";
import { getAllUsers, updateUserRole, createUserProfile } from "../../services/userService";
import { collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../lib/firebase/config";
import { UserProfile, UserRole } from "../../types/user";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLES: { value: UserRole; label: string; classes: string; dotColor: string }[] = [
    { value: "superadmin", label: "Super Admin", classes: "bg-purple-100 text-purple-700 border border-purple-200", dotColor: "bg-purple-500" },
    { value: "admin", label: "Admin", classes: "bg-blue-100 text-blue-700 border border-blue-200", dotColor: "bg-blue-500" },
    { value: "staff", label: "Staff", classes: "bg-emerald-100 text-emerald-700 border border-emerald-200", dotColor: "bg-emerald-500" },
];

function RoleBadge({ role }: { role: UserRole }) {
    const cfg = ROLES.find((r) => r.value === role);
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
            {cfg.label}
        </span>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
    "from-blue-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-sky-500 to-cyan-600",
];

function Avatar({ name, uid }: { name?: string; uid: string }) {
    const color = AVATAR_COLORS[uid.charCodeAt(0) % AVATAR_COLORS.length];
    return (
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
            {name?.[0]?.toUpperCase() ?? "?"}
        </div>
    );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: "success" | "error" }

function ToastContainer({ toasts, remove }: { toasts: Toast[]; remove: (id: number) => void }) {
    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all duration-300 ${
                        t.type === "success"
                            ? "bg-gray-900 text-white"
                            : "bg-red-600 text-white"
                    }`}
                    style={{ animation: "slideInRight 0.25s ease" }}
                >
                    {t.type === "success" ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {t.message}
                    <button onClick={() => remove(t.id)} className="ml-1 opacity-60 hover:opacity-100">
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ))}
        </div>
    );
}

function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counter = useRef(0);

    const add = useCallback((message: string, type: Toast["type"] = "success") => {
        const id = ++counter.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    }, []);

    const remove = useCallback((id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, add, remove };
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({
    onClose,
    onSuccess,
    currentUserRole,
}: {
    onClose: () => void;
    onSuccess: () => void;
    currentUserRole: UserRole | null;
}) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("staff");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const allowedRoles = ROLES.filter((r) =>
        currentUserRole === "superadmin" ? true : r.value !== "superadmin"
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { initializeApp, getApps, deleteApp } = await import("firebase/app");
            const { getAuth, createUserWithEmailAndPassword } = await import("firebase/auth");

            const existingSecondary = getApps().find((a) => a.name === "Secondary");
            if (existingSecondary) await deleteApp(existingSecondary);

            const secondaryApp = initializeApp(auth.app.options, "Secondary");
            const secondaryAuth = getAuth(secondaryApp);

            const result = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            await createUserProfile(result.user.uid, email, name, role);

            await deleteApp(secondaryApp);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(
                err.code === "auth/email-already-in-use"
                    ? "An account with this email already exists."
                    : err.code === "auth/weak-password"
                        ? "Password must be at least 6 characters."
                        : "Failed to create account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} style={{ animation: "fadeIn 0.15s ease" }} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" style={{ animation: "slideUp 0.2s ease" }}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Invite New User</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Create an account and assign a role</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { label: "Full Name", type: "text", value: name, set: setName, placeholder: "John Smith" },
                        { label: "Email", type: "email", value: email, set: setEmail, placeholder: "john@company.com" },
                        { label: "Temporary Password", type: "password", value: password, set: setPassword, placeholder: "Min. 6 characters" },
                    ].map(({ label, type, value, set, placeholder }) => (
                        <div key={label}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <input
                                type={type}
                                value={value}
                                onChange={(e) => set(e.target.value)}
                                placeholder={placeholder}
                                required
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-gray-400"
                            />
                        </div>
                    ))}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            >
                                {allowedRoles.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                            {loading ? "Creating..." : "Create User"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({
    user,
    onClose,
    onConfirm,
    loading,
}: {
    user: UserProfile;
    onClose: () => void;
    onConfirm: () => void;
    loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={!loading ? onClose : undefined} style={{ animation: "fadeIn 0.15s ease" }} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ animation: "slideUp 0.2s ease" }}>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Remove User</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to remove{" "}
                    <span className="font-semibold text-gray-800">{user.displayName}</span>?
                    Their Firestore profile will be deleted. Firebase Auth account remains.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {loading ? "Removing..." : "Remove"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Role Select Cell ─────────────────────────────────────────────────────────
function RoleSelectCell({
    user,
    currentRole,
    updatingUid,
    assignableRoles,
    onRoleChange,
    justUpdated,
}: {
    user: UserProfile;
    currentRole: UserRole | null;
    updatingUid: string | null;
    assignableRoles: typeof ROLES;
    onRoleChange: (uid: string, role: UserRole) => void;
    justUpdated: boolean;
}) {
    const isSuperAdminUser = user.role === "superadmin";
    const canEdit = (currentRole === "superadmin" || !isSuperAdminUser);

    if (!canEdit) return <RoleBadge role={user.role ?? "staff"} />;

    if (updatingUid === user.uid) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                Updating…
            </div>
        );
    }

    return (
        <div className="relative inline-flex items-center gap-1.5">
            <div className="relative">
                <select
                    value={user.role ?? "staff"}
                    onChange={(e) => onRoleChange(user.uid, e.target.value as UserRole)}
                    className="pl-2.5 pr-7 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium hover:border-gray-300 transition-colors cursor-pointer"
                >
                    {assignableRoles.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
            {justUpdated && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium" style={{ animation: "fadeIn 0.2s ease" }}>
                    <Check className="w-3 h-3" /> Saved
                </span>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const { role: currentRole, isAdmin, loading: roleLoading } = useRole();
    const { user: currentUser } = useAuth();
    const router = useRouter();
    const { toasts, add: addToast, remove: removeToast } = useToasts();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
    const [showInvite, setShowInvite] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);
    const [justUpdatedUids, setJustUpdatedUids] = useState<Set<string>>(new Set());
    const [newlyAddedUids, setNewlyAddedUids] = useState<Set<string>>(new Set());
    const prevUidsRef = useRef<Set<string>>(new Set());
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (!roleLoading && currentRole && !isAdmin) {
            router.replace("/admin/dashboard");
        }
    }, [currentRole, isAdmin, roleLoading, router]);

    // Real-time listener with change detection
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "users"),
            (snapshot) => {
                const data = snapshot.docs.map((d) => d.data() as UserProfile);
                const newUids = new Set(data.map((u) => u.uid));

                if (!isFirstLoad.current) {
                    // Detect newly added users
                    const added = data.filter((u) => !prevUidsRef.current.has(u.uid));
                    if (added.length > 0) {
                        const addedUids = new Set(added.map((u) => u.uid));
                        setNewlyAddedUids(addedUids);
                        setTimeout(() => setNewlyAddedUids(new Set()), 2500);
                        added.forEach((u) => addToast(`${u.displayName} was added`, "success"));
                    }
                }

                prevUidsRef.current = newUids;
                isFirstLoad.current = false;
                setUsers(data);
                setLoading(false);
                setConnected(true);
            },
            (_err) => {
                setConnected(false);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleRoleChange = async (uid: string, newRole: UserRole) => {
        if (!uid || !newRole) return;
        const prev = users.find((u) => u.uid === uid)?.role;
        setUpdatingUid(uid);

        // Optimistic update
        setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u)));

        try {
            await updateUserRole(uid, newRole);
            setJustUpdatedUids((s) => new Set(s).add(uid));
            setTimeout(() => setJustUpdatedUids((s) => { const n = new Set(s); n.delete(uid); return n; }), 2000);
            addToast("Role updated successfully", "success");
        } catch {
            // Rollback
            setUsers((users) => users.map((u) => (u.uid === uid ? { ...u, role: prev! } : u)));
            addToast("Failed to update role", "error");
        } finally {
            setUpdatingUid(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            await deleteDoc(doc(db, "users", deleteTarget.uid));
            addToast(`${deleteTarget.displayName} was removed`, "success");
            setDeleteTarget(null);
        } catch {
            addToast("Failed to remove user", "error");
        } finally {
            setDeleteLoading(false);
        }
    };

    const filtered = users
        .filter((u) => u?.uid)
        .filter((u) => {
            const q = search.toLowerCase();
            const matchesSearch = !q || u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
            const matchesRole = filterRole === "all" || u.role === filterRole;
            return matchesSearch && matchesRole;
        });

    const assignableRoles = ROLES.filter((r) =>
        currentRole === "superadmin" ? true : r.value !== "superadmin"
    );

    const roleCounts = ROLES.map((r) => ({
        ...r,
        count: users.filter((u) => u.role === r.value).length,
    }));

    return (
        <>
            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
                @keyframes slideInRight { from { opacity: 0; transform: translateX(16px) } to { opacity: 1; transform: translateX(0) } }
                @keyframes highlightRow { 0% { background-color: #eff6ff } 100% { background-color: transparent } }
                .new-row { animation: highlightRow 2s ease forwards; }
            `}</style>

            <div className="p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2.5 mb-1">
                            <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
                            {/* Live indicator */}
                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${connected ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                                {connected
                                    ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live</>
                                    : <><WifiOff className="w-3 h-3" /> Offline</>
                                }
                            </div>
                        </div>
                        <p className="text-sm text-gray-500">
                            {users.length} account{users.length !== 1 ? "s" : ""} · synced in real-time
                        </p>
                    </div>
                    <button
                        onClick={() => setShowInvite(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-200"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite User
                    </button>
                </div>

                {/* Role stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {roleCounts.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setFilterRole(filterRole === r.value ? "all" : r.value)}
                            className={`text-left p-4 rounded-xl border transition-all ${
                                filterRole === r.value
                                    ? "border-blue-200 bg-blue-50 shadow-sm"
                                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                            }`}
                        >
                            <div className="text-2xl font-bold text-gray-900 tabular-nums">{r.count}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{r.label}{r.count !== 1 ? "s" : ""}</div>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
                            className="pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="all">All Roles</option>
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Result count */}
                {search || filterRole !== "all" ? (
                    <p className="text-xs text-gray-500 mb-3">
                        Showing {filtered.length} of {users.length} users
                        {filterRole !== "all" && ` · filtered by ${ROLES.find(r => r.value === filterRole)?.label}`}
                    </p>
                ) : null}

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <p className="text-sm">Loading users…</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                                <Users className="w-7 h-7 opacity-50" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-gray-700">No users found</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {search ? "Try a different search term" : "Invite your first user to get started"}
                                </p>
                            </div>
                            {search && (
                                <button onClick={() => { setSearch(""); setFilterRole("all"); }} className="text-xs text-blue-600 hover:underline">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/80">
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Last Login</th>
                                    <th className="px-6 py-3.5 w-12" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((u) => {
                                    const isCurrentUser = u.uid === currentUser?.uid;
                                    const isSuperAdminUser = u.role === "superadmin";
                                    const canEdit = (currentRole === "superadmin" || !isSuperAdminUser) && !isCurrentUser;
                                    const canDelete = (currentRole === "superadmin" || currentRole === "admin") && !isCurrentUser;
                                    const isNew = newlyAddedUids.has(u.uid);

                                    return (
                                        <tr
                                            key={u.uid ?? u.email}
                                            className={`hover:bg-gray-50/70 transition-colors ${isNew ? "new-row" : ""}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar name={u.displayName} uid={u.uid} />
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{u.displayName ?? "—"}</p>
                                                            {isCurrentUser && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 font-medium shrink-0">you</span>
                                                            )}
                                                            {isNew && (
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-600 font-medium shrink-0">new</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {canEdit ? (
                                                    <RoleSelectCell
                                                        user={u}
                                                        currentRole={currentRole}
                                                        updatingUid={updatingUid}
                                                        assignableRoles={assignableRoles}
                                                        onRoleChange={handleRoleChange}
                                                        justUpdated={justUpdatedUids.has(u.uid)}
                                                    />
                                                ) : (
                                                    <RoleBadge role={u.role ?? "staff"} />
                                                )}
                                            </td>

                                            <td className="px-6 py-4 hidden sm:table-cell">
                                                <span className="text-xs text-gray-500">
                                                    {u.lastLogin
                                                        ? new Date((u.lastLogin as any)?.seconds * 1000).toLocaleDateString("en-AU", {
                                                            day: "numeric",
                                                            month: "short",
                                                            year: "numeric",
                                                        })
                                                        : <span className="text-gray-300">—</span>}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                {canDelete && (
                                                    <button
                                                        onClick={() => setDeleteTarget(u)}
                                                        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                        title="Remove user"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                {!loading && filtered.length > 0 && (
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        {filtered.length} user{filtered.length !== 1 ? "s" : ""} · updates in real-time
                    </p>
                )}
            </div>

            {showInvite && (
                <InviteModal
                    onClose={() => setShowInvite(false)}
                    onSuccess={() => {}} // onSnapshot handles the update
                    currentUserRole={currentRole}
                />
            )}

            {deleteTarget && (
                <DeleteModal
                    user={deleteTarget}
                    onClose={() => !deleteLoading && setDeleteTarget(null)}
                    onConfirm={handleDelete}
                    loading={deleteLoading}
                />
            )}

            <ToastContainer toasts={toasts} remove={removeToast} />
        </>
    );
}