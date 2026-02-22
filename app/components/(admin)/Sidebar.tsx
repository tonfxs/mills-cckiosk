"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Menu,
  UserCog,
  ListPlus,
  ListCheck,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  LogOut,
  Users,
  ShieldCheck,
  Settings,
  TextSearch,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useRole } from "../../hooks/useRole";
import { UserRole } from "../../types/user";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: any;
  href?: string;
  match?: "exact" | "startsWith";
  allowedRoles?: UserRole[]; // undefined = visible to all roles
  children?: MenuItem[];
};

// Role badge styles
const ROLE_BADGE: Record<UserRole, { label: string; classes: string }> = {
  superadmin: { label: "Super Admin", classes: "bg-purple-100 text-purple-700" },
  admin: { label: "Admin", classes: "bg-blue-100 text-blue-700" },
  staff: { label: "Staff", classes: "bg-green-100 text-green-700" },
  viewer: { label: "Viewer", classes: "bg-gray-100 text-gray-600" },
};

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logOut } = useAuth();
  const { role, isSuperAdmin, isAdmin } = useRole();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>("adc");


  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logOut();
    document.cookie = "session=; path=/; max-age=0";
    document.cookie = "userRole=; path=/; max-age=0";
    router.push("/login");
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const email = user?.email || "";
  const avatarInitial = displayName[0].toUpperCase();
  const badge = role ? ROLE_BADGE[role] : null;

  // ─── Define menu items + role restrictions ─────────────────────────────────
  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/admin/dashboard",
      match: "startsWith",
      // no allowedRoles = visible to everyone
    },
    {
      id: "pickups",
      icon: ShoppingCart,
      label: "Pick Up Orders",
      href: "/admin/pickup",
      match: "startsWith",
    },
    {
      id: "returns",
      icon: Package,
      label: "Return Products",
      href: "/admin/returns",
      match: "startsWith",
    },

    // ADC GROUP
    {
      id: "adc",
      icon: BarChart3,
      label: "ADC",
      children: [
        {
          id: "adc-list",
          icon: ListCheck,
          label: "ADC Completed List",
          href: "/admin/adc-list",
          allowedRoles: ["superadmin", "admin"],
          match: "startsWith",
        },

        {
          id: "adc-current",
          icon: ListPlus,
          label: "ADC Current Orders",
          href: "/admin/adc-current-orders",
          allowedRoles: ["superadmin", "admin"],
          match: "startsWith",
        },

        {
          id: "adc-lookup",
          icon: TextSearch,
          label: "ADC Lookup",
          href: "/admin/neto-lookup",
          allowedRoles: ["superadmin", "admin"],
          match: "startsWith",
        },
      ],
    },
    {
      id: "user-guide",
      icon: UserCog,
      label: "User Guide",
      href: "/admin/user-guide",
      match: "startsWith",
    },
    {
      id: "users",
      icon: Users,
      label: "User Management",
      href: "/admin/users",
      match: "startsWith",
      allowedRoles: ["superadmin", "admin"], // staff cannot see this
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      href: "/admin/settings",
      match: "startsWith",
      allowedRoles: ["superadmin", "admin"],
    },
  ];

  // Only show items the current role is allowed to see
  const visibleItems = menuItems.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!role) return false;
    return item.allowedRoles.includes(role);
  });

  const isItemActive = (item: MenuItem) => {
    if (!pathname || !item.href) return false;

    if (item.match === "exact") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const isDropdownActive = (item: MenuItem) => {
    if (!item.children) return false;
    return item.children.some(isItemActive);
  };

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${isCollapsed ? "w-20" : "w-64"
        }`}
    >
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="h-10 w-10 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Menu className="w-6 h-6" />
          </button>

          {!isCollapsed && (
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Shopfront Kiosk
              </div>
              <div className="text-xs text-gray-500 truncate">Mills Brands</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-6 overflow-y-auto">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            // ✅ Dropdown item
            if (item.children) {

              const active = isDropdownActive(item);
              const open = openDropdown === item.id;

              return (
                <li key={item.id}>

                  {/* Parent */}
                  <button
                    onClick={() => toggleDropdown(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  >

                    <Icon className="w-5 h-5" />

                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left font-medium">
                          {item.label}
                        </span>

                        {open
                          ? <ChevronDown size={18} />
                          : <ChevronRight size={18} />
                        }
                      </>
                    )}
                  </button>


                  {/* Children */}
                  {!isCollapsed && open && (

                    <ul className="ml-9 mt-1 space-y-1">

                      {item.children.map((child) => {

                        const ChildIcon = child.icon;
                        const active = isItemActive(child);

                        return (
                          <li key={child.id}>

                            <Link
                              href={child.href!}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                                active
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-600 hover:bg-gray-50"
                              }`}
                            >

                              <ChildIcon className="w-4 h-4" />

                              {child.label}

                            </Link>

                          </li>
                        );
                      })}
                    </ul>

                  )}

                </li>
              );
            }

            // ✅ Normal item
            const active = isItemActive(item);

            return (
              <li key={item.id}>
                <Link
                  href={item.href!}
                  className={`group w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${active
                      ? "text-blue-700"
                      : "text-gray-500 group-hover:text-gray-700"
                      }`}
                  />
                  {!isCollapsed && (
                    <span
                      className={`font-medium truncate ${active ? "text-blue-700" : "text-gray-700"
                        }`}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );

          })}

        </ul>
      </nav>

      {/* User Section */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3" ref={dropdownRef}>

        {/* Dropdown */}
        {dropdownOpen && (
          <div
            className={`mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden ${isCollapsed ? "absolute left-20 bottom-4 w-56" : "w-full"
              }`}
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{email}</p>
              {badge && (
                <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                  <ShieldCheck className="w-3 h-3" />
                  {badge.label}
                </span>
              )}
            </div>

            <Link href="/admin/user-settings">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  User Settings
                </button>

            </Link>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Trigger button */}
        <button
          onClick={() => setDropdownOpen((prev) => !prev)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors ${isCollapsed ? "justify-center" : ""
            }`}
          title={isCollapsed ? `${displayName} — ${badge?.label}` : undefined}
        >
          {/* Avatar */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              avatarInitial
            )}
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                {badge && (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${badge.classes}`}>
                    <ShieldCheck className="w-2.5 h-2.5" />
                    {badge.label}
                  </span>
                )}
              </div>
              <ChevronUp
                className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </>
          )}
        </button>
      </div>
    </aside>
  );
};