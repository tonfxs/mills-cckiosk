// ─── Permission keys ─────────────────────────────────────────────────────────
// Add new permission keys here as the app grows.
export const ALL_PERMISSIONS = [
    // Users
    { key: "users.view",   label: "View users",         group: "Users" },
    { key: "users.invite", label: "Invite users",        group: "Users" },
    { key: "users.edit",   label: "Edit user roles",     group: "Users" },
    { key: "users.delete", label: "Delete users",        group: "Users" },
    // Roles
    { key: "roles.view",   label: "View roles",          group: "Roles" },
    { key: "roles.manage", label: "Manage roles",        group: "Roles" },
    // Content
    { key: "content.view",    label: "View content",     group: "Content" },
    { key: "content.create",  label: "Create content",   group: "Content" },
    { key: "content.edit",    label: "Edit content",     group: "Content" },
    { key: "content.delete",  label: "Delete content",   group: "Content" },
    // Settings
    { key: "settings.view",   label: "View settings",    group: "Settings" },
    { key: "settings.manage", label: "Manage settings",  group: "Settings" },
    // Reports
    { key: "reports.view",    label: "View reports",     group: "Reports" },
    { key: "reports.export",  label: "Export reports",   group: "Reports" },
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number]["key"];

export const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map((p) => p.group))];

// ─── Role document stored in Firestore ────────────────────────────────────────
export interface RoleDefinition {
    id: string;                        // Firestore doc id, also used as the role value
    label: string;                     // Display name, e.g. "Senior Editor"
    color: string;                     // Tailwind color key: "blue" | "purple" | etc.
    permissions: Record<PermissionKey, boolean>;
    isSystem: boolean;                 // true → cannot be deleted (superadmin, admin, staff)
    createdAt?: any;
    updatedAt?: any;
}

// Kept for backward compat — UserProfile.role is now just a string (the role id)
export type UserRole = string;

// ─── Available badge colours ──────────────────────────────────────────────────
export const ROLE_COLORS = [
    { key: "blue",   bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500",   border: "border-blue-200" },
    { key: "purple", bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", border: "border-purple-200" },
    { key: "emerald",bg: "bg-emerald-100",text: "text-emerald-700",dot: "bg-emerald-500",border: "border-emerald-200" },
    { key: "rose",   bg: "bg-rose-100",   text: "text-rose-700",   dot: "bg-rose-500",   border: "border-rose-200" },
    { key: "amber",  bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500",  border: "border-amber-200" },
    { key: "sky",    bg: "bg-sky-100",    text: "text-sky-700",    dot: "bg-sky-500",    border: "border-sky-200" },
    { key: "indigo", bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500", border: "border-indigo-200" },
    { key: "teal",   bg: "bg-teal-100",   text: "text-teal-700",   dot: "bg-teal-500",   border: "border-teal-200" },
    { key: "orange", bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", border: "border-orange-200" },
    { key: "pink",   bg: "bg-pink-100",   text: "text-pink-700",   dot: "bg-pink-500",   border: "border-pink-200" },
] as const;

export type RoleColorKey = typeof ROLE_COLORS[number]["key"];

export function getRoleColor(key: string) {
    return ROLE_COLORS.find((c) => c.key === key) ?? ROLE_COLORS[0];
}