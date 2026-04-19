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
    <div className="flex h-full flex-col">
      <div className="border-b border-stone-200 px-5 py-5">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Property
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-900">
            Distillery Flat
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Stay at Sturgeon Spirits
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4">
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

      <div className="border-t border-stone-200 px-5 py-4">
        <div className="rounded-2xl bg-stone-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Phase 1
          </p>
          <p className="mt-1 text-sm text-stone-700">
            Dashboard, reservations, calendar, pricing, reports, operations, and
            settings.
          </p>
        </div>
      </div>
    </div>
  );
}