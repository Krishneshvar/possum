import { useEffect, useState } from 'react';
import { productsAPI } from '../api.js';
import ProductsTable from '@/components/products/ProductsTable';
import ProductsActions from '@/components/products/ProductsActions';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataStale, setIsDataStale] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchProducts() {
      try {
        const data = await productsAPI.getAll();
        if (isMounted) {
          setProducts(data);
          setIsDataStale(false);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    }
    fetchProducts();
    return () => {
      isMounted = false;
    };
  }, [isDataStale]);

  const handleProductDeleted = () => {
    setIsDataStale(true);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 p-6">
      <ProductsActions searchTerm={searchTerm} onSearchChange={setSearchTerm} filteredCount={filteredProducts.length} />
      <ProductsTable products={filteredProducts} onProductDeleted={handleProductDeleted} />
    </div>
  );
}
