import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { useDeleteCategoryMutation } from '@/services/categoriesApi.js';
import { toast } from 'sonner';
import { flattenCategories } from '@/utils/categories.utils';

export default function CategoriesTableView({ categories, onEdit }) {
  const [deleteCategory] = useDeleteCategoryMutation();

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  const handleDelete = async (categoryId, categoryName) => {
    if (window.confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      try {
        await deleteCategory(categoryId).unwrap();
        toast.success(`"${categoryName}" deleted successfully.`);
      } catch (err) {
        const errorMsg = err.data?.error || 'An unexpected error occurred.';
        toast.error(errorMsg);
      }
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Parent Category</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flatCategories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                No categories found.
              </TableCell>
            </TableRow>
          ) : (
            flatCategories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>
                  {category.parent_id
                    ? flatCategories.find((p) => p.id === category.parent_id)?.name || 'N/A'
                    : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
