import Card from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/format";
import { getBookedNights, getReservationRevenue } from "@/services/reservations";
import type { Reservation } from "@/types/reservation";

type ReservationTableProps = {
  reservations: Reservation[];
};

function getStatusClasses(status: Reservation["status"]): string {
  const base = "inline-flex rounded-full px-2.5 py-1 text-xs font-medium";

  switch (status) {
    case "confirmed":
      return `${base} bg-emerald-100 text-emerald-800`;
    case "inquiry":
      return `${base} bg-amber-100 text-amber-800`;
    case "checked_in":
      return `${base} bg-blue-100 text-blue-800`;
    case "checked_out":
      return `${base} bg-stone-200 text-stone-700`;
    case "cancelled":
      return `${base} bg-rose-100 text-rose-800`;
    default:
      return `${base} bg-stone-100 text-stone-700`;
  }
}

export default function ReservationTable({
  reservations,
}: ReservationTableProps) {
  return (
    <Card
      title="Reservations"
      description="Unified booking list for Airbnb, Vrbo, and manual entries"
    >
      <div className="overflow-hidden rounded-xl border border-stone-200">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Guest
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Channel
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Stay
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Nights
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Revenue
              </th>
              <th className="px-4 py-3 text-left font-medium text-stone-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 bg-white">
            {reservations.map((reservation) => (
              <tr key={reservation.id}>
                <td className="px-4 py-4 font-medium text-stone-900">
                  {reservation.guest_name}
                  <div className="mt-1 text-xs font-normal text-stone-500">
                    {reservation.guest_count} guests
                  </div>
                </td>
                <td className="px-4 py-4 text-stone-700">
                  {reservation.channel}
                </td>
                <td className="px-4 py-4 text-stone-700">
                  {formatDate(reservation.check_in)} –{" "}
                  {formatDate(reservation.check_out)}
                </td>
                <td className="px-4 py-4 text-stone-700">
                  {getBookedNights(reservation)}
                </td>
                <td className="px-4 py-4 text-stone-700">
                  {formatCurrency(getReservationRevenue(reservation))}
                </td>
                <td className="px-4 py-4">
                  <span className={getStatusClasses(reservation.status)}>
                    {reservation.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}