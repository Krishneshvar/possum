import { Package } from 'lucide-react';
import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteVariantMutation
} from '@/services/productsApi';
import { useGetCategoriesQuery } from '@/services/categoriesApi';
import ProductForm from '../components/ProductForm';
import GenericPageHeader from '@/components/common/GenericPageHeader';
import { flattenCategories } from '@/utils/categories.utils';
import { useProductAndVariantForm } from '../hooks/useProductAndVariantForm';

export default function AddOrEditProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();

  const isEditMode = !!productId;

  const { data: product, isLoading: isProductLoading, error: productError } = useGetProductQuery(productId!, {
    skip: !isEditMode || !productId,
  });
  const { data: categoriesData, isLoading: isCategoriesLoading, error: categoriesError } = useGetCategoriesQuery(undefined);

  const [createProduct, { isLoading: isCreating }] = useAddProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteVariant] = useDeleteVariantMutation();

  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  const initialData = useMemo(() => {
    if (isEditMode && product) {
      const flatCategories = flattenCategories(categories);
      const matchingCategory = flatCategories?.find(cat => cat.name === product.category_name);

      return {
        ...product,
        category_id: matchingCategory ? String(matchingCategory.id) : '',
        tax_category_id: product.tax_category_id ? String(product.tax_category_id) : '',
      };
    }
    return null;
  }, [isEditMode, product, categories]);

  const { formData, ...formHandlers } = useProductAndVariantForm(initialData);

  const isSaving = isCreating || isUpdating;
  const isFormLoading = isEditMode && isProductLoading;
  const hasError = productError || categoriesError;

  const saveProductAndVariants = async (isEdit: boolean, id?: number) => {
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category_id', formData.category_id || '0');
      submitData.append('taxIds', JSON.stringify(formData.tax_category_id ? [formData.tax_category_id] : []));
      submitData.append('status', formData.status);

      if (formData.imageFile) {
        submitData.append('image', formData.imageFile);
      }

      const finalVariants = formData.variants.map(v => ({
        name: v.name,
        sku: v.sku,
        price: v.mrp,
        cost_price: v.cost_price,
        stock: v.stock,
        stock_alert_cap: v.stock_alert_cap,
        is_default: v.is_default,
        status: v.status,
        ...(v.id && { id: v.id })
      }));

      submitData.append('variants', JSON.stringify(finalVariants));

      if (isEdit && id) {
        await updateProduct({ id, body: submitData }).unwrap();
      } else {
        await createProduct(submitData).unwrap();
      }
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const deleteVariantFromApi = async (variantId: number, productId: number) => {
      try {
          await deleteVariant({ productId, variantId }).unwrap();
      } catch (error) {
          console.error("Failed to delete variant", error);
          toast.error("Failed to delete variant");
      }
  };

  if (hasError) {
    console.error('Product error:', productError);
    console.error('Categories error:', categoriesError);
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

  const handleSuccess = (productName: string) => {
    toast.success('Product saved successfully!', {
      description: `${productName} has been saved.`,
      duration: 5000,
    });
    navigate('/products');
  };

  const handleFailure = (err: any) => {
    console.error('Failed to save product:', err);
    const errorMsg = err?.data?.error || 'An error occurred while saving. Please try again later.';
    toast.error('Error saving product', {
      description: errorMsg,
      duration: 5000,
    });
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
        saveProductAndVariants={saveProductAndVariants}
        deleteVariantFromApi={deleteVariantFromApi}
        formData={formData}
        {...formHandlers}
      />
    </div>
  );
}
