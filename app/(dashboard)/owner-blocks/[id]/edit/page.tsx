import EditOwnerBlockForm from "@/components/dashboard/EditOwnerBlockForm";
import { getOwnerBlockById } from "@/services/owner-blocks";

type OwnerBlockEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OwnerBlockEditPage({
  params,
}: OwnerBlockEditPageProps) {
  const { id } = await params;
  const ownerBlock = await getOwnerBlockById(id);

  return (
    <div className="space-y-6">
      <EditOwnerBlockForm ownerBlock={ownerBlock} />
    </div>
  );
}