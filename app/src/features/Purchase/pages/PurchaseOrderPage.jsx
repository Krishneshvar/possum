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
  useGetPurchaseOrdersQuery,
  useReceivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation
} from '@/services/purchaseApi';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { Plus, Eye, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
// import { format } from 'date-fns';

export default function PurchaseOrdersPage() {
  const { data: purchaseOrders = [], isLoading } = useGetPurchaseOrdersQuery();
  const [receivePurchaseOrder] = useReceivePurchaseOrderMutation();
  const [cancelPurchaseOrder] = useCancelPurchaseOrderMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleReceive = async (id) => {
    try {
      await receivePurchaseOrder(id).unwrap();
      toast.success('Purchase Order received. Stock updated.');
    } catch (error) {
      console.error('Failed to receive PO:', error);
      toast.error('Failed to receive Purchase Order');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      await cancelPurchaseOrder(id).unwrap();
      toast.success('Purchase Order cancelled.');
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

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage orders to suppliers.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Purchase Order</DialogTitle>
            </DialogHeader>
            <PurchaseOrderForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
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
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600" onClick={() => handleCancel(po.id)}>
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
