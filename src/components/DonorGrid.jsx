import DonorCard from "./DonorCard";
import { EmptyState } from "./Feedback";

export default function DonorGrid({ donors }) {
  if (!donors.length) return <EmptyState />;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {donors.map((d) => (
        <DonorCard key={d.donorId} donor={d} />
      ))}
    </div>
  );
}
