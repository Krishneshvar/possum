import { useState } from 'react';
import { useGetTaxCategoriesQuery, useCreateTaxCategoryMutation, useUpdateTaxCategoryMutation, useDeleteTaxCategoryMutation } from '@/services/taxesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxCategories() {
    const { data: categories, isLoading } = useGetTaxCategoriesQuery();
    const [createCategory, { isLoading: isCreating }] = useCreateTaxCategoryMutation();
    const [updateCategory] = useUpdateTaxCategoryMutation();
    const [deleteCategory] = useDeleteTaxCategoryMutation();

    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [editing, setEditing] = useState(null);

    const handleCreate = async () => {
        if (!newCategory.name) return toast.error('Name is required');
        try {
            await createCategory(newCategory).unwrap();
            toast.success('Category created');
            setNewCategory({ name: '', description: '' });
        } catch (err) {
            toast.error('Failed to create category');
        }
    };

    const handleUpdate = async (id, data) => {
        try {
            await updateCategory({ id, ...data }).unwrap();
            toast.success('Category updated');
            setEditing(null);
        } catch (err) {
            toast.error('Failed to update category');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? Products using this category might be affected.')) return;
        try {
            await deleteCategory(id).unwrap();
            toast.success('Category deleted');
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to delete category');
        }
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Tax Category</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="grid w-full items-center gap-1.5">
                        <label>Name</label>
                        <Input value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} placeholder="e.g. Reduced Rate" />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <label>Description</label>
                        <Input value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} placeholder="e.g. Essential goods" />
                    </div>
                    <Button onClick={handleCreate} disabled={isCreating}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Existing Categories</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Products Using</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories?.map(category => (
                                <TableRow key={category.id}>
                                    <TableCell>
                                        {editing === category.id ? (
                                            <Input defaultValue={category.name} onBlur={(e) => handleUpdate(category.id, { name: e.target.value })} />
                                        ) : category.name}
                                    </TableCell>
                                    <TableCell>
                                        {editing === category.id ? (
                                            <Input defaultValue={category.description} onBlur={(e) => handleUpdate(category.id, { description: e.target.value })} />
                                        ) : category.description}
                                    </TableCell>
                                    <TableCell>{category.product_count}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => setEditing(editing === category.id ? null : category.id)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(category.id)} disabled={category.product_count > 0}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
