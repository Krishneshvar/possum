import { useState } from 'react';
import { useGetTaxesQuery, useAddTaxMutation, useUpdateTaxMutation, useDeleteTaxMutation } from '@/services/taxesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Percent } from 'lucide-react';
import { toast } from 'sonner';
import DataTable from '@/components/common/DataTable';

export default function TaxesPage() {
    const { data: taxes = [], isLoading, refetch } = useGetTaxesQuery();
    const [addTax, { isLoading: isAdding }] = useAddTaxMutation();
    const [updateTax, { isLoading: isUpdating }] = useUpdateTaxMutation();
    const [deleteTax, { isLoading: isDeleting }] = useDeleteTaxMutation();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [sort, setSort] = useState({
        sortBy: 'name',
        sortOrder: 'ASC',
    });

    const [selectedTax, setSelectedTax] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        rate: '',
        type: 'exclusive'
    });

    const resetForm = () => {
        setFormData({ name: '', rate: '', type: 'exclusive' });
        setSelectedTax(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await addTax({
                ...formData,
                rate: parseFloat(formData.rate)
            }).unwrap();
            toast.success('Tax added successfully');
            setIsAddOpen(false);
            resetForm();
        } catch (err) {
            toast.error('Failed to add tax');
            console.error(err);
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!selectedTax) return;
        try {
            await updateTax({
                id: selectedTax.id,
                ...formData,
                rate: parseFloat(formData.rate)
            }).unwrap();
            toast.success('Tax updated successfully');
            setIsEditOpen(false);
            resetForm();
        } catch (err) {
            toast.error('Failed to update tax');
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!selectedTax) return;
        try {
            await deleteTax(selectedTax.id).unwrap();
            toast.success('Tax deleted successfully');
            setIsDeleteOpen(false);
            setSelectedTax(null);
        } catch (err) {
            toast.error('Failed to delete tax');
            console.error(err);
        }
    };

    const openEdit = (tax) => {
        setSelectedTax(tax);
        setFormData({
            name: tax.name,
            rate: tax.rate.toString(),
            type: tax.type
        });
        setIsEditOpen(true);
    };

    const openDelete = (tax) => {
        setSelectedTax(tax);
        setIsDeleteOpen(true);
    };

    const handleSort = (field, order) => {
        setSort({ sortBy: field, sortOrder: order });
    };

    // Sort taxes locally
    const sortedTaxes = [...taxes].sort((a, b) => {
        const { sortBy, sortOrder } = sort;
        let aVal = a[sortBy];
        let bVal = b[sortBy];

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (sortOrder === 'ASC') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    const columns = [
        {
            key: 'name',
            label: 'Tax Name',
            sortable: true,
            sortField: 'name',
            renderCell: (tax) => <span className="font-medium">{tax.name}</span>
        },
        {
            key: 'rate',
            label: 'Rate',
            sortable: true,
            sortField: 'rate',
            renderCell: (tax) => (
                <div className="flex items-center gap-1.5 font-semibold text-primary">
                    <Percent className="h-4 w-4" />
                    {tax.rate}%
                </div>
            )
        },
        {
            key: 'type',
            label: 'Type',
            sortable: true,
            sortField: 'type',
            className: 'text-center',
            renderCell: (tax) => (
                <div className="flex justify-center">
                    <Badge
                        variant={tax.type === 'inclusive' ? 'secondary' : 'outline'}
                        className={`px-2 py-0.5 text-[10px] font-bold capitalize ${tax.type === 'inclusive' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : ''}`}
                    >
                        {tax.type}
                    </Badge>
                </div>
            )
        },
    ];

    const renderActions = (tax) => (
        <div className="flex justify-end gap-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openEdit(tax)}
                title="Edit Tax"
            >
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => openDelete(tax)}
                title="Delete Tax"
            >
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
            </Button>
        </div>
    );

    const emptyState = (
        <div className="text-center p-8 text-muted-foreground">
            <div className="flex flex-col items-center justify-center space-y-3">
                <Percent className="h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">No taxes found</p>
                <p className="text-sm">Click the "Add New Tax" button to get started.</p>
            </div>
        </div>
    );

    return (
        <div className="h-[calc(100vh-7rem)] flex flex-col gap-4 p-4 overflow-hidden">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">Taxes</h1>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add New Tax
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Add New Tax</DialogTitle>
                            <DialogDescription>Create a new tax rule to apply to items or bills.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">Tax Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. VAT 15%"
                                    className="h-11"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="rate" className="text-sm font-semibold">Rate (%)</Label>
                                    <div className="relative">
                                        <Input
                                            id="rate"
                                            type="number"
                                            step="0.01"
                                            placeholder="15.00"
                                            className="h-11 pr-8"
                                            value={formData.rate}
                                            onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                            required
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type" className="text-sm font-semibold">Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="exclusive">Exclusive</SelectItem>
                                            <SelectItem value="inclusive">Inclusive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" size="lg" className="w-full" disabled={isAdding}>
                                    {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Tax Configuration
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <DataTable
                data={sortedTaxes}
                columns={columns}
                isLoading={isLoading}
                onRetry={refetch}

                sortBy={sort.sortBy}
                sortOrder={sort.sortOrder}
                onSort={handleSort}

                emptyState={emptyState}
                renderActions={renderActions}
                avatarIcon={<Percent className="h-4 w-4 text-primary" />}
            />

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Tax</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-rate">Rate (%)</Label>
                            <Input
                                id="edit-rate"
                                type="number"
                                step="0.01"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="exclusive">Exclusive</SelectItem>
                                    <SelectItem value="inclusive">Inclusive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Tax</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedTax?.name}? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
