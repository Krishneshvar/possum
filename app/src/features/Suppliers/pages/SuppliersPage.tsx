import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Supplier, useGetSuppliersQuery, useDeleteSupplierMutation, useGetPaymentPoliciesQuery } from '@/services/suppliersApi';
import { SupplierForm } from '../components/SupplierForm';
import { Plus, Trash2, Edit, Truck, PackageOpen, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DataTable from '@/components/common/DataTable';
import ActionsDropdown from '@/components/common/ActionsDropdown';
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { extractErrorMessage } from '@/utils/error.utils';

type SupplierSortField = 'name' | 'contact_person' | 'phone' | 'email' | 'created_at';



export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState<SupplierSortField>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const [filterPolicyId, setFilterPolicyId] = useState<string | undefined>();

  const { data: policies = [] } = useGetPaymentPoliciesQuery();

  const { data, isLoading, error, refetch, isFetching: isRefreshing } = useGetSuppliersQuery({
    page,
    limit,
    searchTerm,
    paymentPolicyId: filterPolicyId ? Number(filterPolicyId) : undefined,
    sortBy,
    sortOrder
  });

  const suppliers = data?.suppliers || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  const [deleteSupplier] = useDeleteSupplierMutation();

  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  const handleEditClick = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsDataDialogOpen(true);
  };

  const handleAddClick = () => {
    setEditingSupplier(null);
    setIsDataDialogOpen(true);
  };

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const confirmDelete = async () => {
    if (supplierToDelete) {
      try {
        await deleteSupplier(supplierToDelete.id).unwrap();
        toast.success('Supplier archived successfully');
        setSupplierToDelete(null);
      } catch (error) {
        toast.error(extractErrorMessage(error, 'Failed to delete supplier'));
      }
    }
  };

  const handleSort = (column: { sortField?: string }) => {
    if (!column.sortField) return;
    const order = sortBy === column.sortField && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(column.sortField as SupplierSortField);
    setSortOrder(order);
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      sortField: 'name',
      renderCell: (supplier: Supplier) => <span className="font-medium">{supplier.name}</span>
    },
    {
      key: 'contact_person',
      label: 'Contact Person',
      sortable: false,
      renderCell: (supplier: Supplier) => <span className="text-muted-foreground">{supplier.contact_person || '-'}</span>
    },
    {
      key: 'email',
      label: 'Email',
      sortable: false,
      renderCell: (supplier: Supplier) => <span className="text-sm">{supplier.email || '-'}</span>
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false,
      renderCell: (supplier: Supplier) => <span className="text-sm">{supplier.phone || '-'}</span>
    },
    {
      key: 'payment_policy',
      label: 'Policy',
      sortable: false,
      renderCell: (supplier: Supplier & { payment_policy_name?: string }) => {
        return <span className="text-sm">{supplier.payment_policy_name || 'Pay when received'}</span>
      }
    },
    {
      key: 'address',
      label: 'Address',
      sortable: false,
      renderCell: (supplier: Supplier) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={supplier.address ?? undefined}>
          {supplier.address || '-'}
        </span>
      )
    },
  ] as const;

  const renderActions = (supplier: Supplier) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
            onClick={() => handleEditClick(supplier)}
            aria-label={`Edit ${supplier.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit Supplier</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hidden md:flex"
            onClick={() => handleDeleteClick(supplier)}
            aria-label={`Delete ${supplier.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete Supplier</TooltipContent>
      </Tooltip>

      <div className="md:hidden">
        <ActionsDropdown>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleEditClick(supplier)} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Edit Supplier</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleDeleteClick(supplier)}
            className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Supplier</span>
          </DropdownMenuItem>
        </ActionsDropdown>
      </div>
    </div>
  );

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const supplierErrorMessage = useMemo(() => {
    if (!error) return null;
    return extractErrorMessage(error, 'Failed to load suppliers');
  }, [error]);

  const emptyState = (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <PackageOpen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No suppliers yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Suppliers are vendors who provide products for your inventory. Add your first supplier to start managing purchase orders.
      </p>
      <Button onClick={handleAddClick} size="sm">
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Add Your First Supplier
      </Button>
    </div>
  );

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage your supplier information and contacts.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{totalCount} Suppliers</span>
          <Dialog open={isDataDialogOpen} onOpenChange={setIsDataDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddClick}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground pt-1">
                  {editingSupplier
                    ? 'Update supplier information and contact details'
                    : 'Enter supplier information to add them to your system'}
                </DialogDescription>
              </DialogHeader>
              <SupplierForm
                supplier={editingSupplier}
                onSuccess={() => {
                  setIsDataDialogOpen(false);
                  setEditingSupplier(null);
                }}
                onCancel={() => {
                  setIsDataDialogOpen(false);
                  setEditingSupplier(null);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable
        data={suppliers}
        columns={[...columns]}
        isLoading={isLoading}
        error={supplierErrorMessage}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        searchPlaceholder="Search suppliers..."

        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}

        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}

        emptyState={emptyState}
        renderActions={renderActions}
        avatarIcon={<Truck className="h-4 w-4 text-primary" />}
        onRefresh={refetch}
        isRefreshing={isRefreshing}

        customFilters={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground mr-1" />
            <Select
              value={filterPolicyId || ""}
              onValueChange={(val: string) => {
                setFilterPolicyId(val || undefined);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[180px] bg-background border-border/50">
                <SelectValue placeholder="Filter by Policy" />
              </SelectTrigger>
              <SelectContent>
                {policies.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
        onFilterChange={() => { }}
        onClearAllFilters={() => {
          setFilterPolicyId(undefined);
          setSearchTerm('');
          setPage(1);
        }}
        isAnyFilterActive={!!filterPolicyId || !!searchTerm}
      />

      <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive <span className="font-semibold text-foreground">{supplierToDelete?.name}</span>. Associated purchase orders will remain intact for historical records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
