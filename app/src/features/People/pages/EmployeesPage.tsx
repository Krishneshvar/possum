import { useState } from 'react';
import { Plus, Pencil, Trash2, UserCog, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import GenericPageHeader from '@/components/common/GenericPageHeader';
import DataTable from "@/components/common/DataTable";
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog";
import ActionsDropdown from '@/components/common/ActionsDropdown';
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { EmployeeForm } from '../components/EmployeeForm';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation
} from '@/services/usersApi';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const itemsPerPage = 10;

  const { data, isLoading, error, refetch } = useGetUsersQuery({ 
    search: searchTerm, 
    page: currentPage, 
    limit: itemsPerPage,
    sortBy,
    sortOrder
  });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  const handleOpenAddDialog = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (user: any) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (values: any) => {
    try {
      if (editingUser) {
        await updateUser({ id: editingUser.id, ...values }).unwrap();
        toast.success("Employee updated successfully");
      } else {
        await createUser(values).unwrap();
        toast.success("Employee created successfully");
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.data?.error || (editingUser ? "Failed to update employee" : "Failed to create employee"));
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete.id).unwrap();
      toast.success("Employee deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete employee");
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleSort = (column: any) => {
    const field = column.sortField || column.key;
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  const columns = [
    { 
      key: 'name', 
      label: 'Name', 
      sortable: true,
      sortField: 'name',
      renderCell: (u: any) => <span className="font-medium">{u.name}</span> 
    },
    { 
      key: 'username', 
      label: 'Username', 
      sortable: true,
      sortField: 'username',
      renderCell: (u: any) => u.username 
    },
    {
      key: 'is_active',
      label: 'Status',
      renderCell: (u: any) => (
        <Badge 
          variant={u.is_active ? "default" : "secondary"}
          aria-label={`Employee status: ${u.is_active ? "Active" : "Inactive"}`}
        >
          {u.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      sortField: 'created_at',
      renderCell: (u: any) => <span className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</span>
    },
  ];

  const renderActions = (user: any) => (
    <TooltipProvider>
      <div className="flex items-center gap-1 justify-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
              onClick={() => handleOpenEditDialog(user)}
              aria-label={`Edit ${user.name}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit Employee</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hidden md:flex"
              onClick={() => handleOpenDeleteDialog(user)}
              aria-label={`Delete ${user.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete Employee</TooltipContent>
        </Tooltip>
        <div className="md:hidden">
          <ActionsDropdown>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleOpenEditDialog(user)} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>Edit Employee</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(user)}
              className="cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete Employee</span>
            </DropdownMenuItem>
          </ActionsDropdown>
        </div>
      </div>
    </TooltipProvider>
  );

  const emptyState = (
    <div className="text-center p-12 space-y-3">
      <div className="flex justify-center">
        <div className="rounded-full bg-muted p-3">
          <UserCog className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">No employees yet</p>
        <p className="text-sm text-muted-foreground">
          Add employees to manage access and track activity
        </p>
      </div>
      <Button onClick={handleOpenAddDialog} size="sm" className="mt-4">
        <Plus className="h-4 w-4 mr-2" />
        Add Your First Employee
      </Button>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
      <div className="w-full">
        <GenericPageHeader
          headerIcon={<UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
          headerLabel={"Employees"}
          actions={{
            primary: {
              label: "Add Employee",
              icon: Plus,
              onClick: handleOpenAddDialog,
              ariaLabel: "Add new employee (Ctrl+N)",
            }
          }}
        />
      </div>

      <DataTable
        data={users}
        // @ts-ignore
        columns={columns}
        isLoading={isLoading}
        // @ts-ignore
        error={error?.message}
        onRetry={refetch}

        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search employees..."

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
            <DialogTitle>{editingUser ? "Edit Employee" : "Add Employee"}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            defaultValues={editingUser}
            onSave={handleSave}
            isLoading={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>

      <GenericDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        itemName={userToDelete?.username}
        dialogTitle="Delete Employee?"
      />
    </div>
  );
}
