type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export default function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
        {value}
      </p>
      {helper ? <p className="mt-2 text-sm text-stone-500">{helper}</p> : null}
    </div>
  );
}