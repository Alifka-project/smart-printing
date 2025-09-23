import { QuoteStatus } from "@/types";
import { Badge } from "../ui/badge";

const StatusBadge = ({ value }: { value: QuoteStatus | string }) => {
  const map: Record<string, string> = {
    Approved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
    Pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    Rejected: "bg-rose-100 text-rose-700 hover:bg-rose-100",
    Draft: "bg-slate-100 text-slate-700 hover:bg-slate-100",
    Completed: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  };
  
  const status = value || 'Pending';
  const className = map[status] || map['Pending'];
  
  return <Badge className={`${className} rounded-full px-3`}>{status}</Badge>;
};

export default StatusBadge