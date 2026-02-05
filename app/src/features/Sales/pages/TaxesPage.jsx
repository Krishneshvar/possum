
import { useState } from 'react';
import { useGetTaxesQuery, useAddTaxMutation, useUpdateTaxMutation, useDeleteTaxMutation } from '@/services/taxesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Plus, Pencil, Trash2, Percent } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxesPage() {
    const { data: taxes, isLoading } = useGetTaxesQuery();
    const [addTax, { isLoading: isAdding }] = useAddTaxMutation();
    const [updateTax, { isLoading: isUpdating }] = useUpdateTaxMutation();
    const [deleteTax, { isLoading: isDeleting }] = useDeleteTaxMutation();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Percent className="h-8 w-8 text-primary" />
                        </div>
                        Taxes
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">Manage tax rates and types for your products and services.</p>
                </div>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="shadow-lg shadow-primary/20" onClick={resetForm}>
                            <Plus className="mr-2 h-5 w-5" />
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

            <Card className="shadow-sm border-muted-foreground/10 overflow-hidden flex-1">
                <CardHeader className="pb-0 pt-6 px-6">
                    <CardTitle className="text-xl">Active Tax Configurations</CardTitle>
                    <CardDescription>A list of all currently active tax rules available in the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0 pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent bg-muted/30">
                                <TableHead className="w-[40%] pl-8 py-4 text-xs uppercase font-bold tracking-widest text-muted-foreground">Tax Name</TableHead>
                                <TableHead className="py-4 text-xs uppercase font-bold tracking-widest text-muted-foreground">Rate</TableHead>
                                <TableHead className="py-4 text-xs uppercase font-bold tracking-widest text-muted-foreground">Type</TableHead>
                                <TableHead className="text-right pr-8 py-4 text-xs uppercase font-bold tracking-widest text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {taxes && taxes.length > 0 ? (
                                taxes.map((tax) => (
                                    <TableRow key={tax.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="font-bold text-lg pl-8 py-5">{tax.name}</TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-1.5 font-semibold text-primary text-base">
                                                <Percent className="h-4 w-4" />
                                                {tax.rate}%
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge
                                                variant={tax.type === 'inclusive' ? 'secondary' : 'outline'}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${tax.type === 'inclusive' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : ''}`}
                                            >
                                                {tax.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8 py-5">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full shadow-sm"
                                                    onClick={() => openEdit(tax)}
                                                    title="Edit Tax"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-full shadow-sm"
                                                    onClick={() => openDelete(tax)}
                                                    title="Delete Tax"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3 opacity-50">
                                            <Percent className="h-12 w-12" />
                                            <p className="text-lg font-medium">No taxes found</p>
                                            <p className="text-sm">Click the "Add New Tax" button to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
