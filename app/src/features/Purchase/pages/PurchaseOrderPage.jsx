import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useGetPurchaseOrdersQuery,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation
} from '@/services/purchaseApi';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, CheckCircle, XCircle, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('DESC');

  const { data, isLoading } = useGetPurchaseOrdersQuery({
    page,
    limit,
    searchTerm,
    status: status === 'all' ? undefined : status,
    sortBy,
    sortOrder
  });

  const purchaseOrders = data?.purchaseOrders || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  const [receivePurchaseOrder] = useReceivePurchaseOrderMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();
  const [poToCancel, setPoToCancel] = useState(null);

  const handleReceive = async (id) => {
    try {
      await receivePurchaseOrder(id).unwrap();
      toast.success('Purchase Order received. Stock updated.');
    } catch (error) {
      console.error('Failed to receive PO:', error);
      toast.error(error?.data?.error || 'Failed to receive Purchase Order');
    }
  };

  const handleCancel = async () => {
    if (!poToCancel) return;
    try {
      await cancelPurchaseOrder(poToCancel.id).unwrap();
      toast.success('Purchase Order cancelled.');
      setPoToCancel(null);
    } catch (error) {
      console.error('Failed to cancel PO:', error);
      toast.error('Failed to cancel Purchase Order');
    }
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column);
      setSortOrder('ASC');
    }
    setPage(1);
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortOrder === 'ASC' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage orders to suppliers.</p>
        </div>
        <Button onClick={() => navigate('/purchase/orders/create')}>
          <Plus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-4 w-full md:max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID or supplier..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || status !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatus('all'); setPage(1); }}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('id')}>
                <div className="flex items-center">Order # {getSortIcon('id')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('supplier_name')}>
                <div className="flex items-center">Supplier {getSortIcon('supplier_name')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('order_date')}>
                <div className="flex items-center">Date {getSortIcon('order_date')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('status')}>
                <div className="flex items-center">Status {getSortIcon('status')}</div>
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/70" onClick={() => handleSort('item_count')}>
                <div className="flex items-center justify-end">Items {getSortIcon('item_count')}</div>
              </TableHead>
              <TableHead className="text-right cursor-pointer hover:bg-muted/70" onClick={() => handleSort('total_cost')}>
                <div className="flex items-center justify-end">Total Cost {getSortIcon('total_cost')}</div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24">Loading orders...</TableCell>
              </TableRow>
            ) : purchaseOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No purchase orders found.</TableCell>
              </TableRow>
            ) : (
              purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-mono">PO-{po.id}</TableCell>
                  <TableCell className="font-medium">{po.supplier_name}</TableCell>
                  <TableCell>{po.order_date ? new Date(po.order_date).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Badge variant={
                      po.status === 'received' ? 'default' :
                        po.status === 'cancelled' ? 'destructive' : 'secondary'
                    }>
                      {po.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{po.item_count}</TableCell>
                  <TableCell className="text-right">${po.total_cost?.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/purchase/orders/${po.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {po.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => handleReceive(po.id)}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Receive
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => setPoToCancel(po)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{totalCount === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center min-w-[32px] text-sm font-medium">
              {page} / {totalPages || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      <AlertDialog open={!!poToCancel} onOpenChange={(open) => !open && setPoToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel Purchase Order <span className="font-mono font-bold">PO-{poToCancel?.id}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
