"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/reservations", label: "Reservations" },
  { href: "/calendar", label: "Calendar" },
  { href: "/pricing", label: "Pricing" },
  { href: "/reports", label: "Reports" },
  { href: "/operations", label: "Operations" },
  { href: "/guest-portal", label: "Guest Portal" },
  { href: "/settings", label: "Settings" },
];

function navItemClasses(isActive: boolean): string {
  return [
    "block rounded-xl px-3 py-2 text-sm font-medium transition",
    isActive
      ? "bg-stone-900 text-white shadow-sm"
      : "text-stone-700 hover:bg-stone-100 hover:text-stone-900",
  ].join(" ");
}

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="space-y-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Property
        </p>
        <h2 className="mt-1 text-lg font-semibold text-stone-900">
          Distillery Flat
        </h2>
        <p className="mt-1 text-sm text-stone-600">Stay at Sturgeon Spirits</p>
      </div>

      <nav>
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(pathname, item.href);

            return (
              <li key={item.href}>
                <Link href={item.href} className={navItemClasses(active)}>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="rounded-xl bg-stone-50 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
          Phase 2
        </p>
        <p className="mt-1 text-sm text-stone-600">
          Guest portal, reservation-linked communications, and future OTA-ready
          workflow hooks.
        </p>
      </div>
    </aside>
  );
}
