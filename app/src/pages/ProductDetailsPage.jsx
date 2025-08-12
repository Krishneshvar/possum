import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '../api.js';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Edit2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    stock: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchProduct() {
      try {
        const data = await productsAPI.getById(productId);
        if (isMounted) {
          setProduct(data);
          setFormData({
            name: data.name ?? '',
            sku: data.sku ?? '',
            category: data.category ?? '',
            price: data.price?.toString() ?? '',
            stock: data.stock?.toString() ?? '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setError("Failed to fetch product data.");
        }
        console.error("Failed to fetch product:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    if (product) {
      setFormData({
        name: product.name ?? '',
        sku: product.sku ?? '',
        category: product.category ?? '',
        price: product.price?.toString() ?? '',
        stock: product.stock?.toString() ?? '',
      });
    }
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      const updatedProduct = {
        name: formData.name,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
      };
      await productsAPI.update(Number(productId), updatedProduct);
      setProduct(updatedProduct);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update product:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  if (!product) {
    return <div className="p-6">Product not found.</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        {!isEditing && (
          <Button onClick={handleEditClick}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Product' : product.name}</CardTitle>
          <CardDescription>Product ID: {product.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" value={formData.category} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" name="stock" type="number" value={formData.stock} onChange={handleChange} />
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-semibold">SKU:</h3>
                <p>{product.sku}</p>
              </div>
              <div>
                <h3 className="font-semibold">Category:</h3>
                <p>{product.category}</p>
              </div>
              <div>
                <h3 className="font-semibold">Price:</h3>
                <p>${product.price.toFixed(2)}</p>
              </div>
              <div>
                <h3 className="font-semibold">Stock:</h3>
                <p>{product.stock}</p>
              </div>
            </>
          )}
        </CardContent>
        {isEditing && (
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelClick}>Cancel</Button>
            <Button onClick={handleSaveClick} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
