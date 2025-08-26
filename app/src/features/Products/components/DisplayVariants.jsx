import { Split } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function DisplayVariants({ getVariantStockStatus, formatPrice, product }) {
  return (
    <div className="flex flex-col">
      {product.variants?.map((variant) => {
        const stockStatus = getVariantStockStatus(variant)
        const StockIcon = stockStatus.icon
        return (
          <Card key={variant.id} className="flex flex-grow w-full border border-slate-200 shadow-sm p-6">
            <CardHeader className="p-0 ">
              <CardTitle className="text-lg font-semibold">{variant.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 p-0 space-y-4 text-sm">
              <div className="flex flex-col">
                <div className="flex">
                  <p><strong>SKU:</strong> {variant.sku}</p>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Selling Price</p>
                  <p className="text-xl font-bold text-emerald-900">{formatPrice(variant.price)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Cost Price</p>
                  <p className="text-xl font-bold text-amber-900">{formatPrice(variant.cost_price)}</p>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center mb-1">
                  <StockIcon className={`mr-1 size-4 ${stockStatus.styles}`} />
                  <p className="text-xl font-bold text-slate-900">{variant.stock}</p>
                </div>
                <div className="flex">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Alert at:</p>
                  <p className="text-xl font-bold text-slate-900">{variant.stock_alert_cap}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
