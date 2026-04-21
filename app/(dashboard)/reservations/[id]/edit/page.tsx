import EditReservationForm from "@/components/dashboard/EditReservationForm";
import { getPricingSnapshot } from "@/services/pricing";
import { getReservationById } from "@/services/reservations";

type ReservationEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ReservationEditPage({
  params,
}: ReservationEditPageProps) {
  const { id } = await params;
  const [reservation, pricing] = await Promise.all([
    getReservationById(id),
    getPricingSnapshot(),
  ]);

  return (
    <EditReservationForm
      reservation={reservation}
      defaultCleaningFee={pricing.cleaningFee}
    />
  );
}