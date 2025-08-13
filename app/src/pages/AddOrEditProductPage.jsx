import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { categoriesAPI } from '@/api/categoriesAPI.js';
import { productsAPI } from '@/api/productsAPI.js';
import ProductForm from '@/components/products/ProductForm';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';

export default function AddOrEditProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(!!productId);

  const isEditMode = !!productId;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const categoriesList = await categoriesAPI.getAll();
        
        if (!isMounted) return;
        setCategories(categoriesList);

        if (isEditMode) {
          const productData = await productsAPI.getById(productId);
          
          if (!isMounted) return;

          if (productData) {
            const matchingCategory = categoriesList.find(cat => cat.name === productData.category_name);
            if (matchingCategory) {
              productData.category_id = matchingCategory.id;
            }
          }
          setProduct(productData);
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
        navigate('/products');
      } finally {
        if (isMounted) {
          setIsFormLoading(false);
        }
      }
    };
    
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [productId, isEditMode, navigate]);

  const handleSubmit = async (productData) => {
    setIsSaving(true);
    try {
      if (isEditMode) {
        await productsAPI.update(Number(productId), productData);
      } else {
        await productsAPI.create(productData);
      }
      navigate('/products');
    } catch (err) {
      console.error("Failed to save product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditMode && isFormLoading) {
    return <div className="p-6">Loading product data...</div>;
  }

  const initialData = isEditMode && product ? product : null;

  return (
    <div className="flex flex-col gap-4 p-6">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4 w-fit">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Product' : 'Add New Product'}</CardTitle>
        </CardHeader>
        {(!isEditMode || product) && (
          <ProductForm
            initialData={initialData}
            categories={categories}
            onSubmit={handleSubmit}
            isEditMode={isEditMode}
            isSaving={isSaving}
          />
        )}
      </Card>
    </div>
  );
}
