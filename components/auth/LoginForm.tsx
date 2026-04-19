"use client";

import { useActionState } from "react";
import { signInAction, type SignInState } from "@/app/login/actions";

const initialState: SignInState = {
  error: null,
};

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next || "/dashboard"} />

      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-stone-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-stone-300 px-3 py-2 outline-none ring-0 focus:border-stone-500"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-stone-700"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-stone-300 px-3 py-2 outline-none ring-0 focus:border-stone-500"
        />
      </div>

      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-stone-900 px-4 py-2 font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}