import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetPurchaseOrdersQuery } from '@/services/purchaseApi';
import { useGetSuppliersQuery } from '@/services/suppliersApi';
import { ShoppingCart, Truck, Users, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PurchasePage() {
  const { data: posData } = useGetPurchaseOrdersQuery({ limit: 1000 }); // Increase limit for overview stats or handle via totalCount
  const { data: suppliersData } = useGetSuppliersQuery({ limit: 1000 });

  const pos = posData?.purchaseOrders || [];
  const suppliers = suppliersData?.suppliers || [];
  const totalPOCount = posData?.totalCount || 0;
  const totalSupplierCount = suppliersData?.totalCount || 0;

  const pendingPOs = pos.filter(po => po.status === 'pending');
  const receivedPOs = pos.filter(po => po.status === 'received');

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Purchasing Overview</h1>
        <p className="text-muted-foreground mt-1">Manage your supply chain and inventory procurement.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" /> Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPOCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-500" /> Pending Reception
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingPOs.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" /> Active Suppliers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSupplierCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-green-500" /> Received POs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivedPOs.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.hash = '#/purchase/orders'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Manage Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Create and track orders to your suppliers. Receive items into stock.</p>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link to="/purchase/orders">Go to Orders</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.hash = '#/suppliers'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Supplier Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Manage your contact list of manufacturers and distributors.</p>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link to="/suppliers">Go to Suppliers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
