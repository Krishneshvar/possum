import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productsAPI } from '@/api/productsAPI.js';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProduct() {
      try {
        const data = await productsAPI.getById(productId);
        if (isMounted) {
          setProduct(data);
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await productsAPI.remove(productId);
        navigate('/products');
      } catch (err) {
        console.error("Failed to delete product:", err);
        setError("Failed to delete product. Please try again.");
      }
    }
  };

  const formatPrice = (price) => {
    if (price === null || isNaN(price)) return 'N/A';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) {
    return <div className="p-6">Product not found.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => navigate(`/products/edit/${product.id}`)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Product
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{product.name}</CardTitle>
          <CardDescription>Product ID: {product.id}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">SKU:</h3>
            <p>{product.sku}</p>
          </div>
          <div>
            <h3 className="font-semibold">Category:</h3>
            <p>{product.category_name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Price:</h3>
            <p>{formatPrice(product.price)}</p>
          </div>
          <div>
            <h3 className="font-semibold">Cost Price:</h3>
            <p>{formatPrice(product.cost_price)}</p>
          </div>
          <div>
            <h3 className="font-semibold">Profit Margin:</h3>
            <p>{product.profit_margin}%</p>
          </div>
          <div>
            <h3 className="font-semibold">Stock:</h3>
            <p>{product.stock}</p>
          </div>
          <div>
            <h3 className="font-semibold">Status:</h3>
            <p>{product.status}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
