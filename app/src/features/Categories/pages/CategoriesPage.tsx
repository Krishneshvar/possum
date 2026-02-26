import { Package, LayoutList, Network, Plus, Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import GenericPageHeader from '@/components/common/GenericPageHeader';
import CategoriesTableView from '../components/CategoriesTableView';
import CategoriesTreeView from '../components/CategoriesTreeView';
import AddOrEditCategoryModal from '../components/AddOrEditCategoryModal';
import { useGetCategoriesQuery, Category } from '@/services/categoriesApi';
import { flattenCategories, FlattenedCategory } from '@/utils/categories.utils';

export default function CategoriesPage() {
  const [view, setView] = useState<'tree' | 'table'>('tree');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: categories = [], isLoading, error, refetch } = useGetCategoriesQuery();

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;

    const searchLower = searchTerm.toLowerCase();
    const flatList: FlattenedCategory[] = flattenCategories(categories);
    const matchedIds = new Set(
      flatList
        .filter((cat: FlattenedCategory) => cat.name.toLowerCase().includes(searchLower))
        .map((cat: FlattenedCategory) => cat.id)
    );

    // Recursive filter that includes parents of matched items
    const filterWithParents = (cats: Category[]): Category[] => {
      return cats.reduce((acc, cat) => {
        const hasMatch = matchedIds.has(cat.id);
        const filteredSubs = cat.subcategories ? filterWithParents(cat.subcategories) : [];

        if (hasMatch || filteredSubs.length > 0) {
          acc.push({ ...cat, subcategories: filteredSubs });
        }
        return acc;
      }, [] as Category[]);
    };

    return filterWithParents(categories);
  }, [categories, searchTerm]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const categoryActions = {
    primary: {
      label: "Add Category",
      onClick: handleOpenModal,
      icon: Plus,
    },
  };

  const totalCount = useMemo(() => flattenCategories(categories).length, [categories]);
  const filteredCount = useMemo(() => flattenCategories(filteredCategories).length, [filteredCategories]);

  return (
    <div className="flex flex-col w-full px-1 mx-auto max-w-5xl">
      <div className="mb-4">
        <GenericPageHeader
          headerIcon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
          headerLabel="Categories"
          actions={categoryActions}
        />
      </div>

      <Card className="border-border/50 shadow-sm w-full overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* View Controls & Search */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <Tabs value={view} onValueChange={(v: any) => setView(v as 'tree' | 'table')} className="w-full sm:w-auto">
              <TabsList className="grid w-full sm:w-auto grid-cols-2">
                <TabsTrigger value="tree" className="gap-2">
                  <Network className="h-4 w-4" />
                  <span className="hidden sm:inline">Hierarchy</span>
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <LayoutList className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                className="pl-10 pr-10"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                aria-label="Search categories"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          {searchTerm && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredCount} of {totalCount} {totalCount === 1 ? 'category' : 'categories'}
            </div>
          )}

          {/* Content Area */}
          {error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-destructive/10 p-3 mb-3">
                <Package className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-medium text-destructive">Failed to load categories</p>
              <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading categories...</p>
              </div>
            </div>
          ) : view === 'tree' ? (
            <CategoriesTreeView categories={filteredCategories} onEdit={handleEdit} />
          ) : (
            <CategoriesTableView
              categories={filteredCategories}
              onEdit={handleEdit}
              onRefresh={refetch}
              isRefreshing={isLoading}
            />
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
