import EditReservationForm from "@/components/dashboard/EditReservationForm";
import { getReservationById } from "@/services/reservations";

type ReservationEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ReservationEditPage({
  params,
}: ReservationEditPageProps) {
  const { id } = await params;
  const reservation = await getReservationById(id);

  return (
    <div className="space-y-6">
      <EditReservationForm reservation={reservation} />
    </div>
  );
}