import type { ReactNode } from "react";
import SidebarNav from "@/components/ui/SidebarNav";
import { requirePageUser } from "@/lib/auth";
import { signOutAction } from "@/app/login/actions";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePageUser();

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-r border-stone-200 bg-white">
          <SidebarNav />
        </aside>

        <main className="min-w-0">
          <div className="border-b border-stone-200 bg-white px-6 py-4 md:px-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Sturgeon Spirits
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
                  Distillery Flat Operations
                </h1>
              </div>

              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>

          <div className="px-6 py-6 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}