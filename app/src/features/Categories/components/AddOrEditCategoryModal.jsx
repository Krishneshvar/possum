import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useGetCategoriesQuery,
} from '@/services/categoriesApi';
import { flattenCategories } from '@/utils/categories.utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AddOrEditCategoryModal({ isOpen, onClose, editingCategory }) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState(null);
  const isEditMode = !!editingCategory;

  const { data: categories = [] } = useGetCategoriesQuery();
  const flatCategories = flattenCategories(categories);

  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const isSaving = isAdding || isUpdating;

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setParentId(editingCategory.parent_id);
    } else {
      setName('');
      setParentId(null);
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditMode) {
        await updateCategory({ id: editingCategory.id, name, parentId }).unwrap();
        toast.success('Category updated successfully!');
      } else {
        await addCategory({ name, parentId }).unwrap();
        toast.success('Category added successfully!');
      }
      onClose();
    } catch (err) {
      const errorMsg = err.data?.error || 'An unexpected error occurred.';
      toast.error(errorMsg);
    }
  };

  const filteredCategories = flatCategories.filter(cat => cat.id !== (editingCategory?.id));
  const hasCategories = filteredCategories.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this category.' : 'Create a new category.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Electronics"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent-category">Parent Category (Optional)</Label>
            <Select
              onValueChange={(value) => setParentId(value === 'null' ? null : parseInt(value, 10))}
              value={parentId === null ? 'null' : String(parentId)}
            >
              <SelectTrigger id="parent-category" disabled={!hasCategories}>
                <SelectValue placeholder="Select a parent category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">No Parent</SelectItem>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
