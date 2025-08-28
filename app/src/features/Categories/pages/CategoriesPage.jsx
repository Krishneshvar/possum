import { Package, View, Table, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import GenericPageHeader from '@/components/common/GenericPageHeader';
import CategoriesTableView from '../components/CategoriesTableView';
import CategoriesTreeView from '../components/CategoriesTreeView';
import AddOrEditCategoryModal from '../components/AddOrEditCategoryModal';
import { useGetCategoriesQuery } from '@/services/categoriesApi.js';

export default function CategoriesPage() {
  const [view, setView] = useState('tree');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { data: categories = [], isLoading, error } = useGetCategoriesQuery();

  const handleEdit = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Define the actions object for the GenericPageHeader
  const categoryActions = {
    primary: {
      label: "Add Category",
      onClick: handleOpenModal,
      icon: Plus,
    },
    secondary: [
      {
        label: "Switch View",
        onClick: () => setView(view === 'tree' ? 'table' : 'tree'),
        icon: view === 'tree' ? Table : View,
      },
    ]
  };

  return (
    <div className="flex flex-col w-full px-1 mx-auto max-w-5xl">
      <div className="mb-4">
        {/* Pass the new actions object to GenericPageHeader */}
        <GenericPageHeader
          headerIcon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
          headerLabel="Categories"
          actions={categoryActions}
        />
      </div>

      <Card className="border-border/50 shadow-sm w-full overflow-hidden">
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-xl font-semibold">
              {view === 'tree' ? 'Category Hierarchy' : 'Category List'}
            </h2>
            <div className="flex gap-2 sm:hidden">
              <Button
                variant="outline"
                onClick={() => setView(view === 'tree' ? 'table' : 'tree')}
              >
                {view === 'tree' ? <Table className="h-4 w-4" /> : <View className="h-4 w-4" />}
                <span className="ml-2">{view === 'tree' ? 'Table View' : 'Tree View'}</span>
              </Button>
              <Button onClick={handleOpenModal}>
                <Plus className="h-4 w-4" />
                <span className="ml-2">Add Category</span>
              </Button>
            </div>
          </div>
          <Separator />
          {error ? (
            <div className="text-center text-destructive">
              Failed to load categories.
            </div>
          ) : isLoading ? (
            <div className="text-center text-muted-foreground">
              Loading categories...
            </div>
          ) : view === 'tree' ? (
            <CategoriesTreeView categories={categories} onEdit={handleEdit} />
          ) : (
            <CategoriesTableView categories={categories} onEdit={handleEdit} />
          )}
        </CardContent>
      </Card>
      <AddOrEditCategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingCategory={editingCategory}
      />
    </div>
  );
}
