"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Bell,
  BarChart3,
  Menu,
  Bolt,
  UserCog,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: any;
  href: string;
  /**
   * If true, highlight when pathname starts with href
   * (useful for sections like /admin/pickups/123)
   */
  match?: "exact" | "startsWith";
};

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();

  // ✅ Define routes here
  const menuItems: MenuItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard", match: "startsWith" },
    { id: "pickups", icon: ShoppingCart, label: "Pick Up Orders", href: "/admin/pickup", match: "startsWith" },
    { id: "returns", icon: Package, label: "Return Products", href: "/admin/returns", match: "startsWith" },
    // { id: "parts", icon: Bolt, label: "Parts Assistance", href: "/admin/parts", match: "startsWith" },
    // { id: "users", icon: Users, label: "Users", href: "/admin/users", match: "startsWith" },
    // { id: "alerts", icon: Bell, label: "Alerts", href: "/admin/alerts", match: "startsWith" },
    // { id: "settings", icon: Settings, label: "Settings", href: "/admin/settings", match: "startsWith" },
    // { id: "neto", icon: BarChart3, label: "Neto", href: "/admin/neto-lookup", match: "startsWith" },
    { id: "user-guide", icon: UserCog, label: "User Guide", href: "/admin/user-guide", match: "startsWith" },
  ];

  const isItemActive = (item: MenuItem) => {
    if (!pathname) return false;
    if (item.match === "exact") return pathname === item.href;
    // default startsWith
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label={isCollapsed ? "Open sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Open" : "Collapse"}
          >
            <Menu className="w-6 h-6" />
          </button>

          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                Shopfront Kiosk
              </div>
              <div className="text-xs text-gray-500 truncate">
                Mills Brands
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pb-6">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item);

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`group w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "text-blue-700" : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  />

                  {!isCollapsed && (
                    <span className={`font-medium ${active ? "text-blue-700" : "text-gray-700"}`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
