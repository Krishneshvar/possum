import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetTaxCategoriesQuery, useCreateTaxCategoryMutation, useDeleteTaxCategoryMutation } from '@/services/taxesApi';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';

export default function TaxCategories() {
    const { data: categories, isLoading } = useGetTaxCategoriesQuery(undefined);
    const [createCategory] = useCreateTaxCategoryMutation();
    const [deleteCategory] = useDeleteTaxCategoryMutation();

    const [newCategory, setNewCategory] = useState({ name: '', description: '' });

    const handleCreate = async () => {
        try {
            await createCategory(newCategory).unwrap();
            toast.success('Category created');
            setNewCategory({ name: '', description: '' });
        } catch (err) {
            toast.error('Failed to create category');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteCategory(id).unwrap();
            toast.success('Category deleted');
        } catch (err) {
            toast.error('Failed to delete category (likely used by products)');
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Add Tax Category</CardTitle></CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="grid gap-1.5 flex-1">
                        <label className="text-sm font-medium">Name</label>
                        <Input value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="e.g. Standard Rate" />
                    </div>
                    <div className="grid gap-1.5 flex-[2]">
                        <label className="text-sm font-medium">Description</label>
                        <Input value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} placeholder="Optional description" />
                    </div>
                    <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Add</Button>
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
                                <TableHead>Product Count</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories?.map((cat: any) => (
                                <TableRow key={cat.id}>
                                    <TableCell>{cat.name}</TableCell>
                                    <TableCell>{cat.description}</TableCell>
                                    <TableCell>{cat.product_count}</TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(cat.id)}>
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
