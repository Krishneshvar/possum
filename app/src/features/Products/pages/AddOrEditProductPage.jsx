import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";

import { categoriesAPI } from '@/api/categoriesAPI.js';
import { productsAPI } from '@/api/productsAPI.js';
import ProductForm from '../components/ProductForm';

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
        toast.error("Could not load product or categories. Please try again later.", {
          description: "Error fetching data",
          duration: 5000,
        });
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
        toast.success("Product updated successfully!", {
          description: `${productData.name} has been updated.`,
          duration: 5000,
        });
      } else {
        await productsAPI.create(productData);
        toast.success("Product added successfully!", {
          description: `${productData.name} has been added to your inventory.`,
          duration: 5000,
        });
      }
      navigate('/products')
    } catch (err) {
      console.error("Failed to save product:", err);
      toast.error("An error occurred while saving. Please try again later.", {
        description: "Error saving product"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditMode && isFormLoading) {
    return <div className="p-6">Loading product data...</div>;
  }

  const initialData = isEditMode && product ? product : null;

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
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Product Details</CardTitle>
              <Separator />
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
      </div>
    </div>
  );
};
