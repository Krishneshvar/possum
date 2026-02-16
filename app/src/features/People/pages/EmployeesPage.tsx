import { useState } from 'react';
import { Plus, Pencil, Trash2, UserCog, User } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import GenericPageHeader from '@/components/common/GenericPageHeader';
import DataTable from "@/components/common/DataTable";
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog";
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
  const itemsPerPage = 10;

  const { data, isLoading, error, refetch } = useGetUsersQuery({ search: searchTerm, page: currentPage, limit: itemsPerPage });
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

  const columns = [
    { key: 'name', label: 'Name', renderCell: (u: any) => <span className="font-medium">{u.name}</span> },
    { key: 'username', label: 'Username', renderCell: (u: any) => u.username },
    {
      key: 'is_active',
      label: 'Status',
      renderCell: (u: any) => (
        <Badge variant={u.is_active ? "default" : "secondary"}>
          {u.is_active ? "Active" : "Inactive"}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Created At',
      renderCell: (u: any) => <span className="text-muted-foreground text-sm">{new Date(u.created_at).toLocaleDateString()}</span>
    },
  ];

  const renderActions = (user: any) => (
    <div className="flex items-center gap-2 justify-end">
      <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(user)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => handleOpenDeleteDialog(user)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const emptyState = (
    <div className="text-center p-8 text-muted-foreground">
      No employees found.
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
