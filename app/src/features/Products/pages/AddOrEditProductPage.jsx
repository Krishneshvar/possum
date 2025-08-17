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
    // Navigate after the toast is shown
    navigate('/products');
    return null;
  }
  
  if (isFormLoading || isCategoriesLoading) {
    return <div className="p-6">Loading product data...</div>;
  }
  
  // This is the key change: prepare initial data to ensure the form has the correct values
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
      <div className="container mx-auto p-8">
        <div className="">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="text-muted-foreground">
                {isEditMode ? 'Update an existing product in your inventory.' : 'Create a new product entry for your POS system inventory.'}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
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
    </div>
  );
}
