import { useState } from 'react';
import { Package, Plus, Pencil, Trash2, FolderTree, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import GenericPageHeader from '@/components/common/GenericPageHeader';
import { CategoryForm } from '../components/CategoryForm';
import {
    useGetCategoriesQuery,
    useAddCategoryMutation,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation
} from '@/services/categoriesApi';
import { Category } from '@shared/index';

interface CategoryWithSub extends Category {
    subcategories?: CategoryWithSub[];
}

interface CategoryItemProps {
    category: CategoryWithSub;
    level?: number;
    onEdit: (category: CategoryWithSub) => void;
    onDelete: (id: number) => void;
}

const CategoryItem = ({ category, level = 0, onEdit, onDelete }: CategoryItemProps) => {
    return (
        <>
            <div className="flex items-center justify-between p-3 border-b hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                    {level > 0 && <div className="w-4 border-l-2 border-b-2 h-4 -mt-2 border-muted-foreground/30 rounded-bl-sm" />}
                    <span className="font-medium flex items-center gap-2">
                        {category.subcategories && category.subcategories.length > 0 ? <FolderTree className="h-4 w-4 text-muted-foreground" /> : <div className="w-4" />}
                        {category.name}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(category)}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the category "{category.name}".
                                    {category.subcategories && category.subcategories.length > 0 && " All subcategories will also be deleted."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(category.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            {category.subcategories?.map(sub => (
                <CategoryItem
                    key={sub.id}
                    category={sub}
                    level={level + 1}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
};

export default function CategoriesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryWithSub | undefined>(undefined);

    const { data: categories = [], isLoading, refetch } = useGetCategoriesQuery(undefined);
    const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
    const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
    const [deleteCategory] = useDeleteCategoryMutation();

    const handleSave = async (data: any) => {
        try {
            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, ...data }).unwrap();
                toast.success('Category updated successfully');
            } else {
                await addCategory(data).unwrap();
                toast.success('Category added successfully');
            }
            setIsDialogOpen(false);
            setEditingCategory(undefined);
        } catch (error) {
            console.error(error);
            toast.error(editingCategory ? 'Failed to update category' : 'Failed to add category');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteCategory(id).unwrap();
            toast.success('Category deleted successfully');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete category');
        }
    };

    const openAddDialog = () => {
        setEditingCategory(undefined);
        setIsDialogOpen(true);
    };

    const openEditDialog = (category: CategoryWithSub) => {
        setEditingCategory(category);
        setIsDialogOpen(true);
    };

    return (
        <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-2 mb-6 w-full max-w-7xl overflow-hidden mx-auto">
            <div className="w-full">
                <GenericPageHeader
                    headerIcon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
                    headerLabel={"Categories"}
                    actions={{
                        primary: {
                            label: "Add Category",
                            icon: Plus,
                            onClick: openAddDialog,
                        }
                    }}
                    showBackButton={true}
                />
            </div>

            <div className="border rounded-md bg-card">
                <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
                    <h3 className="font-semibold">Category Structure</h3>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => refetch()}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Refresh categories</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading categories...</div>
                ) : categories.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No categories found. Add one to get started.</div>
                ) : (
                    <div>
                        {categories.map((category: CategoryWithSub) => (
                            <CategoryItem
                                key={category.id}
                                category={category}
                                onEdit={openEditDialog}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                        <DialogDescription>
                            Organize your products by creating a structured category hierarchy.
                        </DialogDescription>
                    </DialogHeader>
                    <CategoryForm
                        defaultValues={editingCategory}
                        categories={categories}
                        onSave={handleSave}
                        isLoading={isAdding || isUpdating}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
