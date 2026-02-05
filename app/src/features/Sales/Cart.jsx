import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/hooks/useCurrency";

export default function Cart({
  cart,
  cartTotal,
  paymentMethod,
  setPaymentMethod,
  customerName,
  setCustomerName,
  completeSale,
  updateQuantity,
  removeFromCart,
}) {
  const currency = useCurrency();
  return (
    <Card className="col-span-1 border-0">
      <CardHeader>
        <CardTitle className="text-xl">Current Sale</CardTitle>
      </CardHeader>
      <CardContent className="h-full space-y-4">
        {cart.length === 0 ? (
          <div className="flex h-[80%] items-center justify-center text-muted-foreground">
            No items in cart
          </div>
        ) : (
          <ScrollArea className="h-[250px]">
            <Table>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="w-[50px]">
                      <Avatar className="rounded-lg">
                        <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {currency}{item.price}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        min={1}
                        onChange={(e) =>
                          updateQuantity(
                            item.product_id,
                            parseInt(e.target.value || "1", 10)
                          )
                        }
                        className="w-16"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {currency}{(item.price * item.quantity).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        <div className="mt-auto space-y-4 pt-4">
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>{currency}{cartTotal.toFixed(2)}</span>
          </div>

          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="wallet">Digital Wallet</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <Button className="w-full" onClick={completeSale}>
            Complete Sale
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
