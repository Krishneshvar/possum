import { Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { useDeleteCategoryMutation } from '@/services/categoriesApi.js';
import { toast } from 'sonner';

// Recursive component to render the category tree
const CategoryNode = ({ category, onEdit }) => {
  const [deleteCategory] = useDeleteCategoryMutation();

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory(category.id).unwrap();
        toast.success(`"${category.name}" deleted successfully.`);
      } catch (err) {
        const errorMsg = err.data?.error || 'An unexpected error occurred.';
        toast.error(errorMsg);
      }
    }
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
            <CategoryNode key={subcat.id} category={subcat} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function CategoriesTreeView({ categories, onEdit }) {
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
        <CategoryNode key={category.id} category={category} onEdit={onEdit} />
      ))}
    </div>
  );
}
