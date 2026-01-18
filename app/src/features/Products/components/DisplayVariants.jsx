import { Split } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"

export default function DisplayVariants({ product, getProductStatus, getVariantStockStatus, formatPrice }) {
  return (
    <CardContent>
      <div className="flex mb-4 gap-4 items-center">
        <Split className="size-5" />
        <h2 className="text-lg font-medium">Variants</h2>
      </div>
      <div className="flex flex-col gap-4">
        {product.variants?.map((variant) => {
          const stockStatus = getVariantStockStatus(variant)
          const StockIcon = stockStatus.icon

          return (
            <div
              key={variant.id}
              className={`flex flex-row md:flex-col lg:flex-row flex-1 flex-grow justify-between border p-4 gap-2 rounded-lg ${variant.is_default ? "bg-accent/50 border-primary" : "border-border"}`}
            >
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex sm:items-center gap-1">
                    <h2 className="text-lg font-semibold">{variant.name}</h2>
                    {variant.is_default ? <Badge variant="secondary" className="size-fit">Default</Badge> : null}
                  </div>
                  <p className="text-md text-muted-foreground">SKU: {variant.sku}</p>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground md:flex-row md:justify-between lg:flex-row lg:gap-6">
                  <div className="flex gap-1">
                    <p>Price: </p>
                    <p className="text-primary">{formatPrice(variant.price)}</p>
                  </div>
                  <div className="flex gap-1">
                    <p>Cost: </p>
                    <p>{formatPrice(variant.cost_price)}</p>
                  </div>
                  <div className="flex gap-1">
                    <p>Margin: </p>
                    <p className="">
                      {variant.cost_price > 0
                        ? (((variant.price - variant.cost_price) / variant.cost_price) * 100).toFixed(2)
                        : '0.00'}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-end items-end gap-2 sm:justify-between md:flex-row lg:flex-col lg:items-end text-sm">
                <div className="flex">
                  {getProductStatus(variant.status)}
                </div>
                <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center">
                  <p className="flex gap-1 justify-center items-center text-xl font-bold text-foreground">
                    <StockIcon className={`size-4 ${stockStatus.styles}`} /> {variant.stock}
                  </p>
                  <p className="text-sm hidden sm:block">units</p>
                </div>
                <div className="flex flex-col items-end text-sm sm:flex-row sm:gap-1">
                  <p className="text-muted-foreground">Alert at:</p>
                  <p className="text-foreground">{variant.stock_alert_cap}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </CardContent>
  )
}
