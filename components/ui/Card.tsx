import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export default function Card({ title, description, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-sm">
      {(title || description) && (
        <div className="border-b border-stone-200 px-5 py-4">
          {title ? (
            <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-stone-600">{description}</p>
          ) : null}
        </div>
      )}

      <div className="px-5 py-4">{children}</div>
    </section>
  );
}