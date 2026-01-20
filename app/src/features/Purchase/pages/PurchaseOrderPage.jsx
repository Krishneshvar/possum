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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { data: purchaseOrders = [], isLoading } = useGetPurchaseOrdersQuery();
  const [receivePurchaseOrder] = useReceivePurchaseOrderMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();

  const [selectedPo, setSelectedPo] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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

  const handleViewDetails = (po) => {
    // Ideally fetch full details including items here if not already loaded
    // But for this list view, items count is shown. We might need a separate endpoint for details
    // or include items in list. The repo `getAllPurchaseOrders` returns summary.
    // For now we just show what we have.
    // TODO: Fetch items for the details view if needed.
    setSelectedPo(po);
    setIsDetailsOpen(true);
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

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
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
                  <TableCell>{po.order_date ? new Date(po.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</TableCell>
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
                      {/* <Button variant="ghost" size="sm" onClick={() => handleViewDetails(po)}>
                        <Eye className="h-4 w-4" />
                      </Button> */}
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

      {/* Details Modal Placeholder */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
          <p>Details for PO-{selectedPo?.id}...</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
