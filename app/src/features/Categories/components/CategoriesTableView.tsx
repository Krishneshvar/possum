import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Tag, FolderTree } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useDeleteCategoryMutation, Category } from '@/services/categoriesApi';
import { toast } from 'sonner';
import { flattenCategories } from '@/utils/categories.utils';
import GenericDeleteDialog from '@/components/common/GenericDeleteDialog';
import ActionsDropdown from '@/components/common/ActionsDropdown';
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
      label: 'Category Name',
      renderCell: (category: Category) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {category.name}
          </span>
        </div>
      )
    },
    {
      key: 'parent_id',
      label: 'Parent',
      renderCell: (category: Category) => {
        if (!category.parent_id) {
          return <span className="text-muted-foreground text-sm">Top-level</span>;
        }
        const parent = flatCategories.find((p) => p.id === category.parent_id);
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{parent?.name || 'Unknown'}</span>
          </div>
        );
      }
    }
  ];

  const renderActions = (category: Category) => (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary hidden md:flex"
            onClick={() => onEdit(category)}
            aria-label={`Edit ${category.name}`}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit Category</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hidden md:flex"
            onClick={() => handleDeleteClick(category)}
            aria-label={`Delete ${category.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete Category</TooltipContent>
      </Tooltip>

      <div className="md:hidden">
        <ActionsDropdown>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onEdit(category)} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Edit Category</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive cursor-pointer hover:bg-destructive/10"
            onClick={() => handleDeleteClick(category)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete Category</span>
          </DropdownMenuItem>
        </ActionsDropdown>
      </div>
    </div>
  );

  const emptyState = (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <div className="rounded-full bg-primary/10 p-4">
          <Tag className="h-8 w-8 text-primary" />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Categories help organize your products. Create your first category to get started.
      </p>
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
