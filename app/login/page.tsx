import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const next = params.next || "/dashboard";

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Sturgeon Spirits
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Distillery Flat Operations
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Sign in to access the operations dashboard.
          </p>

          <div className="mt-6">
            <LoginForm next={next} />
          </div>
        </div>
      </div>
    </div>
  );
}