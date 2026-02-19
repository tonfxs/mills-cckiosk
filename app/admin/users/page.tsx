"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useRole } from "../../hooks/useRole";
import { useAuth } from "../../context/AuthContext";
import { getAllUsers, updateUserRole, createUserProfile } from "../../services/userService";
import { deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase/config";
import { UserProfile, UserRole } from "../../types/user";

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLES: { value: UserRole; label: string; classes: string }[] = [
    { value: "superadmin", label: "Super Admin", classes: "bg-purple-100 text-purple-700" },
    { value: "admin",      label: "Admin",       classes: "bg-blue-100 text-blue-700"    },
    { value: "staff",      label: "Staff",       classes: "bg-green-100 text-green-700"  },
    { value: "viewer",     label: "Viewer",      classes: "bg-gray-100 text-gray-600"    },
];

function RoleBadge({ role }: { role: UserRole }) {
    const cfg = ROLES.find((r) => r.value === role);
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>
            <ShieldCheck className="w-3 h-3" />
            {cfg.label}
        </span>
    );
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
            // ── Secondary app instance prevents replacing the current user session ──
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
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Smith"
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@mills.com"
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Min. 6 characters"
                            required
                            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="relative">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as UserRole)}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                {allowedRoles.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
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
}: {
    user: UserProfile;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Remove User</h2>
                <p className="text-sm text-gray-500 mb-6">
                    Are you sure you want to remove{" "}
                    <span className="font-medium text-gray-700">{user.displayName}</span>? This will
                    delete their profile from Firestore. Their Firebase Auth account will remain.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UsersPage() {
    const { role: currentRole, isAdmin, loading: roleLoading } = useRole();
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
    const [showInvite, setShowInvite] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    // Wait for role to finish loading before redirecting
    useEffect(() => {
        if (!roleLoading && currentRole && !isAdmin) {
            router.replace("/admin/dashboard");
        }
    }, [currentRole, isAdmin, roleLoading, router]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getAllUsers();
            setUsers(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (uid: string, newRole: UserRole) => {
        if (!uid || !newRole) return;
        setUpdatingUid(uid);
        try {
            await updateUserRole(uid, newRole);
            setUsers((prev) =>
                prev.map((u) => (u.uid === uid ? { ...u, role: newRole } : u))
            );
        } finally {
            setUpdatingUid(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        await deleteDoc(doc(db, "users", deleteTarget.uid));
        setUsers((prev) => prev.filter((u) => u.uid !== deleteTarget.uid));
        setDeleteTarget(null);
    };

    // Safe filter — guard against missing fields
    const filtered = users
        .filter((u) => u && u.uid)
        .filter((u) => {
            const matchesSearch =
                u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
                u.email?.toLowerCase().includes(search.toLowerCase());
            const matchesRole = filterRole === "all" || u.role === filterRole;
            return matchesSearch && matchesRole;
        });

    const assignableRoles = ROLES.filter((r) =>
        currentRole === "superadmin" ? true : r.value !== "superadmin"
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Page header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {users.length} account{users.length !== 1 ? "s" : ""} total
                    </p>
                </div>
                <button
                    onClick={() => setShowInvite(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    <UserPlus className="w-4 h-4" />
                    Invite User
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="relative">
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value as UserRole | "all")}
                        className="pl-3 pr-8 py-2.5 border border-gray-300 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="all">All Roles</option>
                        {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Loading users...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Users className="w-10 h-10 mb-3 opacity-40" />
                        <p className="text-sm">No users found</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="text-left px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Last Login</th>
                                <th className="px-6 py-3.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((u) => {
                                const isCurrentUser = u.uid === currentUser?.uid;
                                const isSuperAdminUser = u.role === "superadmin";
                                const canEdit = (currentRole === "superadmin" || !isSuperAdminUser) && !isCurrentUser;
                                const canDelete = (currentRole === "superadmin" || currentRole === "admin") && !isCurrentUser;

                                return (
                                    <tr key={u.uid ?? u.email} className="hover:bg-gray-50 transition-colors">
                                        {/* User info */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                    {u.displayName?.[0]?.toUpperCase() ?? "?"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {u.displayName ?? "—"}
                                                        {isCurrentUser && (
                                                            <span className="ml-2 text-xs text-gray-400 font-normal">(you)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Role — editable dropdown or read-only badge */}
                                        <td className="px-6 py-4">
                                            {canEdit ? (
                                                <div className="relative inline-block">
                                                    {updatingUid === u.uid ? (
                                                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                                    ) : (
                                                        <>
                                                            <select
                                                                value={u.role ?? "staff"}
                                                                onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                                                                className="pl-2 pr-7 py-1.5 border border-gray-200 rounded-lg text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                                                            >
                                                                {assignableRoles.map((r) => (
                                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <RoleBadge role={u.role ?? "staff"} />
                                            )}
                                        </td>

                                        {/* Last login */}
                                        <td className="px-6 py-4 hidden sm:table-cell">
                                            <span className="text-xs text-gray-500">
                                                {u.lastLogin
                                                    ? new Date((u.lastLogin as any)?.seconds * 1000).toLocaleDateString("en-AU", {
                                                        day: "numeric",
                                                        month: "short",
                                                        year: "numeric",
                                                    })
                                                    : "—"}
                                            </span>
                                        </td>

                                        {/* Delete */}
                                        <td className="px-6 py-4 text-right">
                                            {canDelete && (
                                                <button
                                                    onClick={() => setDeleteTarget(u)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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

            {/* Modals */}
            {showInvite && (
                <InviteModal
                    onClose={() => setShowInvite(false)}
                    onSuccess={fetchUsers}
                    currentUserRole={currentRole}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    user={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}