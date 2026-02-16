import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Tag } from 'lucide-react';
import { useDeleteCategoryMutation, Category } from '@/services/categoriesApi';
import { toast } from 'sonner';
import { flattenCategories } from '@/utils/categories.utils';
import GenericDeleteDialog from '@/components/common/GenericDeleteDialog';
import DataTable from "@/components/common/DataTable";

interface CategoriesTableViewProps {
    categories: Category[];
    onEdit: (category: Category) => void;
}

export default function CategoriesTableView({ categories, onEdit }: CategoriesTableViewProps) {
  const [deleteCategory] = useDeleteCategoryMutation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

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

  const columns = [
    {
      key: 'name',
      label: 'Name',
      renderCell: (category: Category) => <span className="font-medium">{category.name}</span>
    },
    {
      key: 'parent_id',
      label: 'Parent Category',
      renderCell: (category: Category) => (
        category.parent_id
          ? flatCategories.find((p) => p.id === category.parent_id)?.name || 'N/A'
          : '—'
      )
    }
  ];

  const renderActions = (category: Category) => (
    <div className="flex justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleDeleteClick(category)}
        className="text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const emptyState = (
    <div className="text-center p-8 text-muted-foreground">
      No categories found.
    </div>
  );

  return (
    <>
      <DataTable
        data={flatCategories}
        columns={columns}
        emptyState={emptyState}
        renderActions={renderActions}
        // @ts-ignore
        avatarIcon={<Tag className="h-4 w-4 text-primary" />}
      />

      <GenericDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        itemName={categoryToDelete?.name}
        dialogTitle="Delete Category"
      />
    </>
  );
}
