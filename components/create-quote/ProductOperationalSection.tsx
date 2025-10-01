import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calculator, Settings, BarChart3, Edit3, AlertTriangle, Palette, Info, Clock, DollarSign, ChevronDown, ChevronUp } from "lucide-react";

type Paper = {
  inputWidth: number; 
  inputHeight: number;
  outputWidth: number; 
  outputHeight: number;
  gsm?: number; 
  brand?: string; 
  material?: string; 
  substrate?: string;
  pricePerSheet?: number; 
  pricePerPack?: number; 
  packSize?: number; 
  sheetsPerKg?: number;
  selectedColors?: number;
};

type AdditionalCosts = Record<string, number | undefined>;

export type ProductOperationalSlice = {
  id: string;
  name: string;
  quantity: number;
  colors: number;
  paper: Paper;
  additionalCosts: AdditionalCosts;
  outputDimensions?: { width: number; height: number };
};

type Props = {
  data: ProductOperationalSlice;
  productIndex: number;
  // Updaters scoped to THIS product only:
  onChangePaper: (patch: Partial<Paper>) => void;
  onChangeAdditional: (patch: Partial<AdditionalCosts>) => void;
  onChangeOutputDims: (w: number, h: number) => void;
};

const ProductOperationalSection: React.FC<Props> = ({
  data, productIndex, onChangePaper, onChangeAdditional, onChangeOutputDims
}) => {
  // Per-product UI state — no cross-product collisions:
  const [showPaperPrice, setShowPaperPrice] = React.useState(false);
  const [collapseSheetAnalysis, setCollapseSheetAnalysis] = React.useState(true);
  const [collapseProductionIntel, setCollapseProductionIntel] = React.useState(true);
  const [collapseOpsDash, setCollapseOpsDash] = React.useState(true);

  // Dedicated canvas per product
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Example: draw when inputs change
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const { inputWidth, inputHeight, outputWidth, outputHeight } = data.paper;

    // Clear
    ctx.clearRect(0, 0, c.width, c.height);

    // Simple scaled layout preview (placeholder)
    const pad = 12;
    const scale = Math.min(
      (c.width - pad * 2) / Math.max(inputWidth, 1),
      (c.height - pad * 2) / Math.max(inputHeight, 1)
    );

    // Parent sheet box
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.strokeRect(
      pad, pad,
      Math.max(inputWidth * scale, 1),
      Math.max(inputHeight * scale, 1)
    );

    // Simple grid: how many outputs fit (illustrative)
    const cols = Math.max(Math.floor(inputWidth / Math.max(outputWidth, 1)), 1);
    const rows = Math.max(Math.floor(inputHeight / Math.max(outputHeight, 1)), 1);

    ctx.strokeStyle = "#0ea5e9";
    for (let r = 0; r < rows; r++) {
      for (let cidx = 0; cidx < cols; cidx++) {
        const x = pad + cidx * (outputWidth * scale);
        const y = pad + r * (outputHeight * scale);
        ctx.strokeRect(x, y, outputWidth * scale, outputHeight * scale);
      }
    }
  }, [data.paper.inputWidth, data.paper.inputHeight, data.paper.outputWidth, data.paper.outputHeight]);

  // Example computed values (replace with your real services)
  const itemsPerSheet = React.useMemo(() => {
    const iw = data.paper.inputWidth || 0;
    const ih = data.paper.inputHeight || 0;
    const ow = data.paper.outputWidth || 0;
    const oh = data.paper.outputHeight || 0;
    const cols = ow > 0 ? Math.floor(iw / ow) : 0;
    const rows = oh > 0 ? Math.floor(ih / oh) : 0;
    return Math.max(cols * rows, 0);
  }, [data.paper]);

  const sheetsNeeded = itemsPerSheet > 0 ? Math.ceil(data.quantity / itemsPerSheet) : 0;

  return (
    <div key={productIndex} className="space-y-6 md:space-y-8">
      {/* Product Header */}
      <div className="bg-[#27aae1]/10 rounded-xl border border-[#27aae1]/30 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h4 className="text-lg md:text-xl font-bold text-[#27aae1] flex items-center">
              <Package className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
              Product {productIndex + 1}: {data.name}
            </h4>
            <div className="mt-2 text-[#27aae1] text-sm md:text-base">
              Quantity: {data.quantity} | Colors: {data.colors}
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#ea078b]/20 border border-[#ea078b]/50 rounded-full self-start sm:self-auto">
            <Palette className="w-4 h-4 text-[#ea078b]" />
            <span className="text-sm font-semibold text-[#ea078b]">
              {data.colors} color{data.colors !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Paper Details */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
            <Edit3 className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-[#27aae1]" />
            Paper Details & Specifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`inputWidth-${productIndex}`}>Input Width (cm)</Label>
              <Input
                id={`inputWidth-${productIndex}`}
                type="number"
                step="0.1"
                value={data.paper.inputWidth || ""}
                onChange={(e) => onChangePaper({ inputWidth: Number(e.target.value) })}
                placeholder="Enter width"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`inputHeight-${productIndex}`}>Input Height (cm)</Label>
              <Input
                id={`inputHeight-${productIndex}`}
                type="number"
                step="0.1"
                value={data.paper.inputHeight || ""}
                onChange={(e) => onChangePaper({ inputHeight: Number(e.target.value) })}
                placeholder="Enter height"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`outputWidth-${productIndex}`}>Output Width (cm)</Label>
              <Input
                id={`outputWidth-${productIndex}`}
                type="number"
                step="0.1"
                value={data.paper.outputWidth || ""}
                onChange={(e) => onChangePaper({ outputWidth: Number(e.target.value) })}
                placeholder="Enter width"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`outputHeight-${productIndex}`}>Output Height (cm)</Label>
              <Input
                id={`outputHeight-${productIndex}`}
                type="number"
                step="0.1"
                value={data.paper.outputHeight || ""}
                onChange={(e) => onChangePaper({ outputHeight: Number(e.target.value) })}
                placeholder="Enter height"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paper Pricing */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-[#27aae1]" />
              Paper Pricing
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPaperPrice(!showPaperPrice)}
            >
              {showPaperPrice ? "Hide Details" : "Show Details"}
            </Button>
          </div>
        </CardHeader>
        {showPaperPrice && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`pricePerSheet-${productIndex}`}>Price per Sheet</Label>
                <Input
                  id={`pricePerSheet-${productIndex}`}
                  type="number"
                  step="0.01"
                  value={data.paper.pricePerSheet || ""}
                  onChange={(e) => onChangePaper({ pricePerSheet: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`pricePerPack-${productIndex}`}>Price per Pack</Label>
                <Input
                  id={`pricePerPack-${productIndex}`}
                  type="number"
                  step="0.01"
                  value={data.paper.pricePerPack || ""}
                  onChange={(e) => onChangePaper({ pricePerPack: Number(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`packSize-${productIndex}`}>Pack Size (sheets)</Label>
                <Input
                  id={`packSize-${productIndex}`}
                  type="number"
                  value={data.paper.packSize || ""}
                  onChange={(e) => onChangePaper({ packSize: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`sheetsPerKg-${productIndex}`}>Sheets per kg</Label>
                <Input
                  id={`sheetsPerKg-${productIndex}`}
                  type="number"
                  value={data.paper.sheetsPerKg || ""}
                  onChange={(e) => onChangePaper({ sheetsPerKg: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Additional Costs */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
            <Calculator className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-[#27aae1]" />
            Additional Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`finishing-${productIndex}`}>Finishing Cost</Label>
              <Input
                id={`finishing-${productIndex}`}
                type="number"
                step="0.01"
                value={data.additionalCosts.finishing || ""}
                onChange={(e) => onChangeAdditional({ finishing: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`plates-${productIndex}`}>Plates Cost</Label>
              <Input
                id={`plates-${productIndex}`}
                type="number"
                step="0.01"
                value={data.additionalCosts.plates || ""}
                onChange={(e) => onChangeAdditional({ plates: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`units-${productIndex}`}>Units Cost</Label>
              <Input
                id={`units-${productIndex}`}
                type="number"
                step="0.01"
                value={data.additionalCosts.units || ""}
                onChange={(e) => onChangeAdditional({ units: Number(e.target.value) })}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sheet Layout Visualization */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
            <BarChart3 className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 text-[#27aae1]" />
            Sheet Layout Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-1 shadow-lg overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={640} 
              height={360} 
              className="w-full h-full bg-white rounded-lg shadow-inner" 
            />
          </div>
          <div className="text-center text-sm text-slate-500">
            Items per Sheet: <span className="font-semibold">{itemsPerSheet || "–"}</span> • 
            Sheets Needed: <span className="font-semibold">{sheetsNeeded || "–"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdvancedCard
          title="Advanced Sheet Analysis"
          collapsed={collapseSheetAnalysis}
          setCollapsed={setCollapseSheetAnalysis}
          icon={<Package className="w-4 h-4" />}
        >
          <ul className="text-sm text-slate-600 space-y-2">
            <li className="flex justify-between">
              <span>Items per sheet:</span>
              <span className="font-semibold">{itemsPerSheet || "–"}</span>
            </li>
            <li className="flex justify-between">
              <span>Sheets needed:</span>
              <span className="font-semibold">{sheetsNeeded || "–"}</span>
            </li>
            <li className="flex justify-between">
              <span>Efficiency:</span>
              <span className="font-semibold">
                {itemsPerSheet > 0 ? ((itemsPerSheet * data.paper.outputWidth * data.paper.outputHeight) / (data.paper.inputWidth * data.paper.inputHeight) * 100).toFixed(1) : "–"}%
              </span>
            </li>
          </ul>
        </AdvancedCard>

        <AdvancedCard
          title="Production Intelligence"
          collapsed={collapseProductionIntel}
          setCollapsed={setCollapseProductionIntel}
          icon={<Settings className="w-4 h-4" />}
        >
          <div className="text-sm text-slate-600 space-y-2">
            <p>• Makeready time estimation</p>
            <p>• Run rate calculations</p>
            <p>• Press utilization metrics</p>
            <p>• Production timeline</p>
          </div>
        </AdvancedCard>

        <AdvancedCard
          title="Operations Dashboard"
          collapsed={collapseOpsDash}
          setCollapsed={setCollapseOpsDash}
          icon={<Info className="w-4 h-4" />}
        >
          <div className="text-sm text-slate-600 space-y-2">
            <p>• Cost breakdown summary</p>
            <p>• ETA calculations</p>
            <p>• Bottleneck analysis</p>
            <p>• Quality warnings</p>
          </div>
        </AdvancedCard>
      </div>
    </div>
  );
};

const AdvancedCard: React.FC<{
  title: string;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  icon: React.ReactNode;
}> = ({ title, collapsed, setCollapsed, icon, children }) => (
  <Card className="border-0 shadow-lg">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base font-bold text-slate-800 flex items-center">
          <div className="p-2 bg-[#27aae1]/10 rounded-lg mr-3">
            {icon}
          </div>
          {title}
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>
    </CardHeader>
    {!collapsed && <CardContent>{children}</CardContent>}
  </Card>
);

export default ProductOperationalSection;
