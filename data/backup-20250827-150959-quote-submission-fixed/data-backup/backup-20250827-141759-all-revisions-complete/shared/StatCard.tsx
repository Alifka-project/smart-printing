import { Card, CardContent } from "../ui/card";

export default function StatCard({
  title,
  value,
  icon,
  tint,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  tint: "blue" | "green" | "amber" | "rose";
}) {
  const tints: Record<typeof tint, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <Card className="rounded-xl shadow-sm">
      <CardContent className="px-5 flex items-center gap-4">
        <div className={`p-3 rounded-full ${tints[tint]}`}>{icon}</div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-semibold tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}