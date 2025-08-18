import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useGetProductQuery, useAddProductMutation, useUpdateProductMutation } from '@/services/productsApi';
import { useGetCategoriesQuery } from '@/services/categoriesApi';
import ProductForm from '../components/ProductForm';

export default function AddOrEditProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const isEditMode = !!productId;

  const { data: product, isLoading: isProductLoading, error: productError } = useGetProductQuery(productId, {
    skip: !isEditMode,
  });
  const { data: categories, isLoading: isCategoriesLoading, error: categoriesError } = useGetCategoriesQuery();

  const [addProduct, { isLoading: isAdding }] = useAddProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const isSaving = isAdding || isUpdating;
  const isFormLoading = isEditMode && isProductLoading;
  const hasError = productError || categoriesError;

  if (hasError) {
    toast.error('Error fetching data', {
      description: 'Could not load product or categories. Please try again later.',
      duration: 5000,
    });
    navigate('/products');
    return null;
  }
  
  if (isFormLoading || isCategoriesLoading) {
    return <div className="p-6">Loading product data...</div>;
  }

  let initialData = null;
  if (isEditMode && product && categories) {
    const matchingCategory = categories.find(cat => cat.name === product.category_name);
    
    initialData = {
      ...product,
      category_id: matchingCategory ? matchingCategory.id : '',
    };
  }

  const handleSubmit = async (productData) => {
    try {
      if (isEditMode) {
        await updateProduct({ id: Number(productId), ...productData }).unwrap();
        toast.success('Product updated successfully!', {
          description: `${productData.name} has been updated.`,
          duration: 5000,
        });
      } else {
        await addProduct(productData).unwrap();
        toast.success('Product added successfully!', {
          description: `${productData.name} has been added to your inventory.`,
          duration: 5000,
        });
      }
      navigate('/products');
    } catch (err) {
      console.error('Failed to save product:', err);
      toast.error('Error saving product', {
        description: 'An error occurred while saving. Please try again later.',
        duration: 5000,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-8">
        <div className="mb-6 flex flex-col gap-2 items-start justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="mb-4 bg-black text-white hover:bg-gray-800 hover:text-slate-50 cursor-pointer"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Update an existing product in your inventory.' : 'Create a new product entry for your inventory.'}
            </p>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-card">
          <ProductForm
            initialData={initialData}
            categories={categories}
            onSubmit={handleSubmit}
            isEditMode={isEditMode}
            isSaving={isSaving}
          />
        </Card>
      </div>
    </div>
  );
}
