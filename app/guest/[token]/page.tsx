import { notFound } from "next/navigation";
import GuestPortalHelpForm from "@/components/guest/GuestPortalHelpForm";
import { formatDate } from "@/lib/format";
import { getGuestPortalPageData } from "@/services/guest-portal";

type GuestPortalPageProps = {
  params: Promise<{ token: string }>;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderBody(body: string) {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={index} className="leading-7 text-stone-700">
        {paragraph}
      </p>
    ));
}

export default async function GuestPortalPage({
  params,
}: GuestPortalPageProps) {
  const { token } = await params;
  const portal = await getGuestPortalPageData(token);

  if (!portal) {
    notFound();
  }

  const { reservation, sections, lockCodes } = portal;

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <header className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Guest Portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
            Welcome to your distillery-flat stay
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            This page is tied to your reservation and includes stay details,
            arrival information, guest guidance, and a simple way to request
            help.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">
              Reservation details
            </h2>

            <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-stone-900">Guest</dt>
                <dd className="mt-1 text-stone-600">{reservation.guest_name}</dd>
              </div>

              <div>
                <dt className="font-medium text-stone-900">Status</dt>
                <dd className="mt-1 capitalize text-stone-600">
                  {reservation.status.replace("_", " ")}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-stone-900">Check-in</dt>
                <dd className="mt-1 text-stone-600">
                  {formatDate(reservation.check_in)}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-stone-900">Check-out</dt>
                <dd className="mt-1 text-stone-600">
                  {formatDate(reservation.check_out)}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-stone-900">Guests</dt>
                <dd className="mt-1 text-stone-600">
                  {reservation.guest_count}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-stone-900">Booking channel</dt>
                <dd className="mt-1 text-stone-600">{reservation.channel}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-stone-900">Access</h2>

            {lockCodes.length > 0 ? (
              <div className="mt-4 space-y-4">
                {lockCodes.map((lockCode) => (
                  <div
                    key={lockCode.id}
                    className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      {lockCode.smart_lock_name || "Door code"}
                    </p>
                    <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.2em] text-stone-900">
                      {lockCode.code}
                    </p>
                    <p className="mt-3 text-sm text-stone-600">
                      Valid from {formatDateTime(lockCode.starts_at)} through{" "}
                      {formatDateTime(lockCode.ends_at)}.
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-600">
                Access instructions and codes will appear here once they are
                ready for your stay.
              </p>
            )}
          </section>
        </div>

        {sections.map((section) => (
          <section
            key={section.id}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-stone-900">
              {section.title}
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              {renderBody(section.body)}
            </div>
          </section>
        ))}

        <GuestPortalHelpForm
          token={token}
          guestNameDefault={reservation.guest_name}
        />
      </div>
    </main>
  );
}
