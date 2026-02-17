import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { useDeleteCategoryMutation } from '@/services/categoriesApi';
import { toast } from 'sonner';
import GenericDeleteDialog from '@/components/common/GenericDeleteDialog';
import { Category } from '@/services/categoriesApi';

// Recursive component to render the category tree
const CategoryNode = ({ category, onEdit, onDelete }: { category: Category, onEdit: (category: Category) => void, onDelete: (category: Category) => void }) => {
  const handleDelete = () => {
    onDelete(category);
  };

  return (
    <div className="pl-4 border-l border-border">
      <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
        <span className="text-sm font-medium">{category.name}</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            title="Edit Category"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            title="Delete Category"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {category.subcategories && category.subcategories.length > 0 && (
        <div className="mt-2">
          {category.subcategories.map(subcat => (
            <CategoryNode key={subcat.id} category={subcat} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoriesTreeView({ categories, onEdit }: { categories: Category[], onEdit: (category: Category) => void }) {
  const [deleteCategory] = useDeleteCategoryMutation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory(categoryToDelete.id).unwrap();
      toast.success(`"${categoryToDelete.name}" deleted successfully.`);
    } catch (err: any) {
      const errorMsg = err.data?.error || 'An unexpected error occurred.';
      toast.error(errorMsg);
    } finally {
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No categories found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <CategoryNode
          key={category.id}
          category={category}
          onEdit={onEdit}
          onDelete={handleDeleteClick}
        />
      ))}

      <GenericDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={categoryToDelete?.name}
        dialogTitle="Delete Category"
      />
    </div>
  );
}
