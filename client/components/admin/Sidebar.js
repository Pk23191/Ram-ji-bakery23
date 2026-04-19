import Link from "next/link";
import { Home, Box, ShoppingCart, Users, Settings, LogOut, ImageIcon, TicketPercent } from "lucide-react";

export default function Sidebar({ onLogout, activeSection }) {
  const makeItem = (key, Icon, label, href) => {
    const baseCls = "flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/80";
    const activeCls = activeSection === key ? "bg-white/90 font-semibold" : "";
    return (
      <Link href={href} className={`${baseCls} ${activeCls}`}>
        <Icon size={18} /> <span>{label}</span>
      </Link>
    );
  };

  const makeSectionHref = (key) => (key === "dashboard" ? "/admin" : `/admin?section=${key}`);

  return (
    <nav className="hidden md:flex flex-col gap-4 p-4">
      <div className="mb-4 px-2">
        <h3 className="text-sm font-semibold uppercase text-mocha/60">Admin</h3>
      </div>

      <ul className="flex flex-col gap-2">
        <li>{makeItem("dashboard", Home, "Dashboard", makeSectionHref("dashboard"))}</li>
        <li>{makeItem("products", Box, "Products", makeSectionHref("products"))}</li>
        <li>{makeItem("orders", ShoppingCart, "Orders", makeSectionHref("orders"))}</li>
        <li>{makeItem("banner", ImageIcon, "Banner", makeSectionHref("banner"))}</li>
        <li>{makeItem("images", ImageIcon, "Images", "/admin/images")}</li>
        <li>{makeItem("coupons", TicketPercent, "Coupons", makeSectionHref("coupons"))}</li>
        <li>{makeItem("users", Users, "Users", makeSectionHref("users"))}</li>
        <li>{makeItem("settings", Settings, "Settings", makeSectionHref("settings"))}</li>
      </ul>

      <div className="mt-auto px-2">
        <button onClick={onLogout} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/80 w-full">
          <LogOut size={16} /> <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}
