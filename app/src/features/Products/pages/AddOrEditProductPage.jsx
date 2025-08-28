import { Package } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useGetProductQuery, useAddProductMutation, useUpdateProductMutation } from '@/services/productsApi';
import { useGetCategoriesQuery } from '@/services/categoriesApi';
import ProductForm from '../components/ProductForm';
import GenericPageHeader from '@/components/common/GenericPageHeader';

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
    navigate(-1);
    return null;
  }
  
  if (isFormLoading || isCategoriesLoading) {
    return <div className="p-6">Loading product data...</div>;
  }

  let initialData = null;
  if (isEditMode && product) {
    const matchingCategory = categories?.find(cat => cat.name === product.category_name);

    initialData = {
      ...product,
      category_id: matchingCategory ? String(matchingCategory.id) : '',
    };
  }

  const handleSuccess = (productName) => {
    toast.success('Product saved successfully!', {
      description: `${productName} has been saved.`,
      duration: 5000,
    });
    navigate(-1);
  };

  const handleFailure = (err) => {
    console.error('Failed to save product:', err);
    toast.error('Error saving product', {
      description: 'An error occurred while saving. Please try again later.',
      duration: 5000,
    });
  };

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
    <div className="flex flex-col w-full px-1 mx-auto max-w-5xl">
      <div className="mb-4">
        <GenericPageHeader
          headerIcon={<Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />}
          headerLabel={isEditMode ? 'Edit Product' : 'Add Product'}
          actions={{}}
          showBackButton={true}
        />
      </div>

      <ProductForm
        initialData={initialData}
        categories={categories}
        onSuccess={handleSuccess}
        onFailure={handleFailure}
        isEditMode={isEditMode}
        isSaving={isSaving}
      />
    </div>
  );
}
