import { useState, useEffect, useRef } from 'react';
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
import { Loader2, Info } from 'lucide-react';
import {
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useGetCategoriesQuery,
  Category
} from '@/services/categoriesApi';
import { flattenCategories } from '@/utils/categories.utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddOrEditCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingCategory?: Category | null;
}

export default function AddOrEditCategoryModal({ isOpen, onClose, editingCategory }: AddOrEditCategoryModalProps) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const isEditMode = !!editingCategory;
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { data: categories = [] } = useGetCategoriesQuery();
  const flatCategories = flattenCategories(categories);

  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const isSaving = isAdding || isUpdating;

  useEffect(() => {
    if (isOpen) {
      if (editingCategory) {
        setName(editingCategory.name);
        setParentId(editingCategory.parent_id || null);
      } else {
        setName('');
        setParentId(null);
      }
      setError('');
      // Focus name input when modal opens
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [editingCategory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!name.trim()) {
      setError('Category name is required');
      nameInputRef.current?.focus();
      return;
    }

    if (name.trim().length < 2) {
      setError('Category name must be at least 2 characters');
      nameInputRef.current?.focus();
      return;
    }

    try {
      if (isEditMode && editingCategory) {
        await updateCategory({ id: editingCategory.id, name: name.trim(), parentId: parentId ?? undefined }).unwrap();
        toast.success(`"${name.trim()}" updated successfully`);
      } else {
        await addCategory({ name: name.trim(), parentId: parentId ?? undefined }).unwrap();
        toast.success(`"${name.trim()}" created successfully`);
      }
      onClose();
    } catch (err: any) {
      const errorMsg = err.data?.error || 'An unexpected error occurred.';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const filteredCategories = flatCategories.filter(cat => cat.id !== (editingCategory?.id));
  const hasCategories = filteredCategories.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onClose()}>
      <DialogContent className="sm:max-w-[480px]" aria-describedby="category-modal-description">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Category' : 'Create New Category'}</DialogTitle>
          <DialogDescription id="category-modal-description">
            {isEditMode 
              ? 'Update the category name or change its parent category.' 
              : 'Categories help organize your products. You can create nested categories by selecting a parent.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="category-name" className="text-sm font-medium">
              Category Name <span className="text-destructive">*</span>
            </Label>
            <Input
              ref={nameInputRef}
              id="category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Electronics, Beverages, Snacks"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? "name-error" : undefined}
              disabled={isSaving}
              className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {error && (
              <p id="name-error" className="text-sm text-destructive flex items-center gap-1">
                <Info className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parent-category" className="text-sm font-medium">
              Parent Category
            </Label>
            <Select
              onValueChange={(value) => setParentId(value === 'null' ? null : parseInt(value, 10))}
              value={parentId === null ? 'null' : String(parentId)}
              disabled={!hasCategories || isSaving}
            >
              <SelectTrigger 
                id="parent-category" 
                aria-label="Select parent category"
              >
                <SelectValue placeholder="None (top-level category)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">None (top-level category)</SelectItem>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {'  '.repeat(cat.depth || 0)}{cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {hasCategories 
                ? 'Optional: Select a parent to create a subcategory' 
                : 'Create your first category as a top-level category'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update Category' : 'Create Category')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
