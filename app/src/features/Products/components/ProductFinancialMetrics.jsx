import { BarChart3, DollarSign, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProductFinancialMetrics({ product }) {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
            Financial Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-700 uppercase tracking-wide">Profit Margin</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{product.profit_margin/100}%</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-medium text-purple-700 uppercase tracking-wide">Tax Rate</p>
            </div>
            <p className="text-2xl font-bold text-purple-900">{product.product_tax}%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
