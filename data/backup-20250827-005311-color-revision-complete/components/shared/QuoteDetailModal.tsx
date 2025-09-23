"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { QuoteDetail, QuoteStatus } from "@/types";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function StatusPill({ status }: { status: QuoteStatus }) {
  const cls =
    status === "Approved"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Pending"
      ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";
  return <span className={`text-xs px-2 py-1 rounded ${cls}`}>{status}</span>;
}

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: QuoteDetail | null;
};

const QuoteDetailModal: React.FC<Props> = ({ open, onOpenChange, data }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>
            {data ? `Quote ${data.id}` : "Quote Details"}
          </DialogTitle>
        </DialogHeader>

        {data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Client</div>
                <div className="font-semibold">{data.clientName}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Date</div>
                <div className="font-semibold">{data.date}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Product</div>
                <div className="font-semibold">{data.product}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Quantity</div>
                <div className="font-semibold">{data.quantity}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Sides</div>
                <div className="font-semibold">
                  {data.sides === "1" ? "1 Side" : "2 Sides"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Printing</div>
                <div className="font-semibold">{data.printing}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Papers</div>
              <div className="flex flex-wrap gap-2">
                {data.papers.map((p, i) => (
                  <Badge key={`${p.name}-${i}`} variant="secondary">
                    {p.name} {p.gsm}gsm
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Finishing</div>
              <div className="flex flex-wrap gap-2">
                {data.finishing.length ? (
                  data.finishing.map((f, i) => (
                    <Badge
                      key={`${f}-${i}`}
                      className="bg-blue-50 text-blue-700 hover:bg-blue-50"
                    >
                      {f}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>

            <div className="rounded-lg border p-4 grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base</span>
                <span className="font-semibold">
                  {currency.format(data.amounts.base)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span className="font-semibold">
                  {currency.format(data.amounts.vat)}
                </span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">
                  {currency.format(data.amounts.total)}
                </span>
              </div>
              <div className="col-span-2">
                <span className="inline-flex items-center gap-2">
                  <StatusPill status={data.amounts.status} />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No data.</div>
        )}

        <DialogFooter>
          <Button
            className="bg-white border-[#2563EB] border text-gray-700 hover:bg-gray-200"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuoteDetailModal;