"use client";

import { FC, useMemo, useState } from "react";
import { Eye, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { PreviousQuote, QuoteDetail } from "@/types";
import { QUOTE_DETAILS } from "@/lib/dummy-data";

interface Step1Props {
  quoteMode: "new" | "existing";
  setQuoteMode: (mode: "new" | "existing") => void;
  onSelectQuote: (q: PreviousQuote) => void;
  onStartNew?: () => void;
}

const dataRecentQuote: PreviousQuote[] = [
  { id: "QT-2025-0718", clientName: "Eagan Inc.",      date: "2025-07-18" },
];


const currency = new Intl.NumberFormat("en-AE", { 
  style: "currency", 
  currency: "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const Step1JobSelection: FC<Step1Props> = ({ quoteMode, setQuoteMode, onSelectQuote, onStartNew }) => {
  const [search, setSearch] = useState("");
  const [openView, setOpenView] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return dataRecentQuote;
    return dataRecentQuote.filter(
      (r) => r.id.toLowerCase().includes(s) || r.clientName.toLowerCase().includes(s)
    );
  }, [search]);

  const viewData = viewId ? QUOTE_DETAILS[viewId] ?? null : null;

  const statusBadge = (status: QuoteDetail["amounts"]["status"]) => {
    const color =
      status === "Approved" ? "bg-emerald-100 text-emerald-700"
      : status === "Pending" ? "bg-amber-100 text-amber-700"
      : "bg-rose-100 text-rose-700";
    return <span className={`text-xs px-2 py-1 rounded ${color}`}>{status}</span>;
  };

  return (
    <>
      <div className="w-full space-y-6">
        <h3 className="font-bold text-2xl">Create A Quote</h3>

        <Tabs value={quoteMode} onValueChange={(v) => setQuoteMode(v as "new" | "existing")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 h-auto">
            <TabsTrigger value="new" className="py-2">Start New</TabsTrigger>
            <TabsTrigger value="existing" className="py-2">Based on a Previous Quote</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <div className="rounded-xl border p-6 bg-white flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Start a fresh quotation.</p>
              <Button className="bg-[#2563EB]" onClick={onStartNew}>Start New</Button>
            </div>
          </TabsContent>
          <TabsContent value="existing" className="mt-6">
            <div className="w-full space-y-5">
              <Input
                placeholder="Search by Quote ID or Client"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-[16rem] w-full px-4 py-5 bg-gray-50 border border-gray-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors pr-12"
              />
              <div className=" bg-white">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>Quote ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-semibold">{item.id}</TableCell>
                        <TableCell>{item.clientName}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setViewId(item.id); setOpenView(true); }}
                            title="View details"
                          >
                            <Eye className="h-5 w-5 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSelectQuote(item)}
                            title="Select this quote"
                          >
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{viewData ? `Quote ${viewData.id}` : "Quote Details"}</DialogTitle>
          </DialogHeader>

          {viewData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-muted-foreground">Client</div><div className="font-semibold">{viewData.clientName}</div></div>
                <div><div className="text-muted-foreground">Date</div><div className="font-semibold">{viewData.date}</div></div>
                <div><div className="text-muted-foreground">Product</div><div className="font-semibold">{viewData.product}</div></div>
                <div><div className="text-muted-foreground">Quantity</div><div className="font-semibold">{viewData.quantity}</div></div>
                <div><div className="text-muted-foreground">Sides</div><div className="font-semibold">{viewData.sides === "1" ? "1 Side" : "2 Sides"}</div></div>
                <div><div className="text-muted-foreground">Printing</div><div className="font-semibold">{viewData.printing}</div></div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Papers</div>
                <div className="flex flex-wrap gap-2">
                  {viewData.papers.map((p, i) => (
                    <Badge key={`${p.name}-${i}`} variant="secondary">
                      {p.name} {p.gsm}gsm
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Finishing</div>
                <div className="flex flex-wrap gap-2">
                  {viewData.finishing.length ? viewData.finishing.map((f, i) => (
                    <Badge key={`${f}-${i}`} className="bg-blue-50 text-blue-700 hover:bg-blue-50">{f}</Badge>
                  )) : <span className="text-sm text-muted-foreground">—</span>}
                </div>
              </div>

              <div className="rounded-lg border p-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Base</span><span className="font-semibold">{currency.format(viewData.amounts.base)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span className="font-semibold">{currency.format(viewData.amounts.vat)}</span></div>
                <div className="flex justify-between col-span-2"><span className="text-muted-foreground">Total</span><span className="font-bold">{currency.format(viewData.amounts.total)}</span></div>
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-2">
                    {statusBadge(viewData.amounts.status)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data.</div>
          )}

          <DialogFooter>
            <Button className="bg-white border-[#2563EB] border-1 text-gray-700 hover:bg-gray-200" onClick={() => setOpenView(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Step1JobSelection;
