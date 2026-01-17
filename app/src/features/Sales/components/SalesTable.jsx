
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

export default function SalesTable({ items, updateQuantity, removeItem }) {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50">
                <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Current Order</h2>
            </div>

            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-white dark:bg-zinc-900 z-10 shadow-sm">
                        <TableRow className="hover:bg-transparent border-slate-100 dark:border-zinc-800">
                            <TableHead className="w-[60px]">Img</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-center w-[100px]">Qty</TableHead>
                            <TableHead className="text-right w-[100px]">Price</TableHead>
                            <TableHead className="text-right w-[100px]">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center text-slate-400">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <p>No items in cart</p>
                                        <p className="text-sm opacity-70">Add products to start a sale</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id} className="border-slate-50 hover:bg-slate-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 transition-colors">
                                    <TableCell>
                                        <Avatar className="h-9 w-9 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700">
                                            <AvatarFallback className="text-xs text-slate-500">{item.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-700 dark:text-slate-200">{item.name}</div>
                                        <div className="text-xs text-slate-400">{item.sku || 'SKU-000'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center">
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                className="w-16 h-8 text-center bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 focus-visible:ring-1"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-600 dark:text-slate-400">
                                        ₹{item.price.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-slate-800 dark:text-slate-200">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
