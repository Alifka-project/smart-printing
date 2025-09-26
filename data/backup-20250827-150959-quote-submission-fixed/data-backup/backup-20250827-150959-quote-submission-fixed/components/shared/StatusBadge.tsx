import { QuoteStatus } from "@/types";
import { Badge } from "../ui/badge";

const StatusBadge = ({ value }: { value: QuoteStatus }) => {
  const map: Record<QuoteStatus, string> = {
    Approved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    Pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    Rejected: "bg-rose-100 text-rose-700 hover:bg-rose-100",
  };
  return <Badge className={`${map[value]} rounded-full px-3`}>{value}</Badge>;
};

export default StatusBadge