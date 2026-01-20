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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useGetSuppliersQuery, useDeleteSupplierMutation } from '@/services/suppliersApi';
import { SupplierForm } from '../components/SupplierForm';
import { MoreHorizontal, Plus, Search, Trash2, Edit, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
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

export default function SuppliersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  const { data, isLoading } = useGetSuppliersQuery({
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
        toast.success(`Supplier "${supplierToDelete.name}" deleted`);
        setSupplierToDelete(null);
      } catch (error) {
        console.error('Failed to delete supplier:', error);
        toast.error('Failed to delete supplier');
      }
    }
  };

  const handleFormSuccess = () => {
    setIsDataDialogOpen(false);
    setEditingSupplier(null);
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
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage your product suppliers.</p>
        </div>
        <Dialog open={isDataDialogOpen} onOpenChange={setIsDataDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" /> Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
            </DialogHeader>
            <SupplierForm supplierToEdit={editingSupplier} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center py-4 justify-between">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-8"
          />
        </div>
        {searchTerm && (
          <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setPage(1); }}>
            Clear Search
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('name')}>
                <div className="flex items-center">Name {getSortIcon('name')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('contact_person')}>
                <div className="flex items-center">Contact Person {getSortIcon('contact_person')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('phone')}>
                <div className="flex items-center">Phone {getSortIcon('phone')}</div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted/70" onClick={() => handleSort('email')}>
                <div className="flex items-center">Email {getSortIcon('email')}</div>
              </TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person || '-'}</TableCell>
                  <TableCell>{supplier.phone || '-'}</TableCell>
                  <TableCell>{supplier.email || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(supplier)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteClick(supplier)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      <AlertDialog open={!!supplierToDelete} onOpenChange={() => setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{supplierToDelete?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
