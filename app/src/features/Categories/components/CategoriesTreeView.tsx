import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronRight, FolderOpen, Folder } from 'lucide-react';
import { useDeleteCategoryMutation } from '@/services/categoriesApi';
import { toast } from 'sonner';
import GenericDeleteDialog from '@/components/common/GenericDeleteDialog';
import { Category } from '@/services/categoriesApi';

// Recursive component to render the category tree
const CategoryNode = ({ 
  category, 
  onEdit, 
  onDelete,
  level = 0 
}: { 
  category: Category; 
  onEdit: (category: Category) => void; 
  onDelete: (category: Category) => void;
  level?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = category.subcategories && category.subcategories.length > 0;

  const handleDelete = () => {
    onDelete(category);
  };

  return (
    <div className="select-none">
      <div 
        className="group flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-0.5 hover:bg-muted rounded transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
            >
              <ChevronRight 
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`} 
              />
            </button>
          ) : (
            <div className="w-5" />
          )}
          
          {hasChildren ? (
            <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          
          <span className="text-sm font-medium truncate">{category.name}</span>
          
          {hasChildren && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              ({category.subcategories!.length})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(category)}
            aria-label={`Edit ${category.name}`}
            title="Edit category"
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            aria-label={`Delete ${category.name}`}
            title="Delete category"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {category.subcategories!.map(subcat => (
            <CategoryNode 
              key={subcat.id} 
              category={subcat} 
              onEdit={onEdit} 
              onDelete={onDelete}
              level={level + 1}
            />
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
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-4">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Categories help organize your products into a hierarchical structure. Create your first category to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="mb-3 pb-2 border-b border-border">
        <p className="text-xs text-muted-foreground">
          {categories.length} top-level {categories.length === 1 ? 'category' : 'categories'}
        </p>
      </div>
      
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
