import { useState } from 'react';
import { Plus, Pencil, Trash2, Users, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import GenericPageHeader from '@/components/common/GenericPageHeader';
import DataTable from "@/components/common/DataTable";
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog";
import ActionsDropdown from '@/components/common/ActionsDropdown';
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { CustomerForm } from '../components/CustomerForm';
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation
} from '@/services/customersApi';

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  const itemsPerPage = 10;

  const { data, isLoading, error, refetch } = useGetCustomersQuery({ searchTerm, page: currentPage, limit: itemsPerPage, sortBy, sortOrder });
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();
  const [deleteCustomer] = useDeleteCustomerMutation();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<any>(null);

  const customers = data?.customers || [];
  const totalPages = data?.totalPages || 1;

  const handleOpenAddDialog = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (customer: any) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (customer: any) => {
    setCustomerToDelete(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingCustomer) {
        await updateCustomer({ id: editingCustomer.id, ...values }).unwrap();
        toast.success("Customer updated successfully");
      } else {
        await createCustomer(values).unwrap();
        toast.success("Customer created successfully");
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(editingCustomer ? "Failed to update customer" : "Failed to create customer");
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete.id).unwrap();
      toast.success("Customer deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete customer");
    } finally {
      setIsDeleteDialogOpen(false);
      setCustomerToDelete(null);
    }
  };

  const handleSort = (column: any) => {
    if (column.key === sortBy) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(column.key);
      setSortOrder('ASC');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', sortable: true, renderCell: (c: any) => <span className="font-medium">{c.name}</span> },
    { key: 'phone', label: 'Phone', renderCell: (c: any) => c.phone || '-' },
    { key: 'email', label: 'Email', sortable: true, renderCell: (c: any) => c.email || '-' },
    { key: 'address', label: 'Address', renderCell: (c: any) => <div className="max-w-[200px] truncate">{c.address || '-'}</div> },
  ];

  const renderActions = (customer: any) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
            onClick={() => handleOpenEditDialog(customer)}
            aria-label={`Edit ${customer.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit Customer</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hidden md:flex"
            onClick={() => handleOpenDeleteDialog(customer)}
            aria-label={`Delete ${customer.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete Customer</TooltipContent>
      </Tooltip>

      <div className="md:hidden">
        <ActionsDropdown>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => handleOpenEditDialog(customer)} className="cursor-pointer">
            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Edit Customer</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => handleOpenDeleteDialog(customer)}
            className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Customer</span>
          </DropdownMenuItem>
        </ActionsDropdown>
      </div>
    </div>
  );

  const emptyState = (
    <div className="text-center p-8 space-y-3">
      <div className="flex justify-center">
        <div className="rounded-full bg-muted p-3">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No customers yet</p>
        <p className="text-sm text-muted-foreground">Start building your customer base by adding your first customer</p>
      </div>
      <Button onClick={handleOpenAddDialog} size="sm" className="mt-2">
        <Plus className="h-4 w-4 mr-2" />
        Add Your First Customer
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          headerLabel={"Customers"}
          actions={{
            primary: {
              label: "Add Customer",
              icon: Plus,
              onClick: handleOpenAddDialog,
            }
          }}
        />
      </div>

      <DataTable
        data={customers}
        // @ts-ignore
        columns={columns}
        isLoading={isLoading}
        // @ts-ignore
        error={error?.message}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customers..."

        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}

        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}

        emptyState={emptyState}
        renderActions={renderActions}
        // @ts-ignore
        avatarIcon={<User className="h-4 w-4 text-primary" />}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <CustomerForm
            defaultValues={editingCustomer}
            onSave={handleSave}
            isLoading={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>

      <GenericDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={customerToDelete?.name}
        dialogTitle="Delete Customer?"
      />
    </div>
  );
}
