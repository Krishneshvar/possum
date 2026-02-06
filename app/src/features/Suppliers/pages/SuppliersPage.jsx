import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/alert-dialog";
import { useGetSuppliersQuery, useDeleteSupplierMutation } from '@/services/suppliersApi';
import { SupplierForm } from '../components/SupplierForm';
import { Plus, Trash2, Edit, Truck } from 'lucide-react';
import { toast } from 'sonner';
import DataTable from '@/components/common/DataTable';
import ActionsDropdown from '@/components/common/ActionsDropdown';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  const { data, isLoading, refetch } = useGetSuppliersQuery({
    page,
    limit,
    searchTerm,
    sortBy,
    sortOrder
  });

  const suppliers = data?.suppliers || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  const [deleteSupplier] = useDeleteSupplierMutation();

  const [isDataDialogOpen, setIsDataDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier);
    setIsDataDialogOpen(true);
  };

  const handleAddClick = () => {
    setEditingSupplier(null);
    setIsDataDialogOpen(true);
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
  };

  const confirmDelete = async () => {
    if (supplierToDelete) {
      try {
        await deleteSupplier(supplierToDelete.id).unwrap();
        toast.success('Supplier deleted successfully');
        setSupplierToDelete(null);
      } catch (error) {
        console.error('Failed to delete supplier:', error);
        toast.error('Failed to delete supplier');
      }
    }
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      sortField: 'name',
      renderCell: (supplier) => <span className="font-medium">{supplier.name}</span>
    },
    {
      key: 'contact_person',
      label: 'Contact Person',
      sortable: false,
      renderCell: (supplier) => <span className="text-muted-foreground">{supplier.contact_person || '-'}</span>
    },
    {
      key: 'email',
      label: 'Email',
      sortable: false,
      renderCell: (supplier) => <span className="text-sm">{supplier.email || '-'}</span>
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false,
      renderCell: (supplier) => <span className="text-sm">{supplier.phone || '-'}</span>
    },
    {
      key: 'address',
      label: 'Address',
      sortable: false,
      renderCell: (supplier) => (
        <span className="text-sm text-muted-foreground max-w-[200px] truncate block" title={supplier.address}>
          {supplier.address || '-'}
        </span>
      )
    },
  ];

  const renderActions = (supplier) => (
    <ActionsDropdown>
      <DropdownMenuItem onClick={() => handleEditClick(supplier)} className="cursor-pointer">
        <Edit className="mr-2 h-4 w-4" />
        <span>Edit</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => handleDeleteClick(supplier)}
        className="cursor-pointer text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        <span>Delete</span>
      </DropdownMenuItem>
    </ActionsDropdown>
  );

  const emptyState = (
    <div className="text-center p-8 text-muted-foreground">
      No suppliers found. Add your first supplier to get started.
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
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
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
        columns={columns}
        isLoading={isLoading}
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
      />

      <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the supplier "{supplierToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
