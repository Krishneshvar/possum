import { useEffect, useState } from 'react';

import { productsAPI } from '@/api/productsAPI.js';
import ProductsTable from '../components/ProductsTable';
import ProductsActions from '../components/ProductsActions';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataStale, setIsDataStale] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <ProductsActions searchTerm={searchTerm} onSearchChange={setSearchTerm} filteredCount={filteredProducts.length} />
      <ProductsTable
        products={paginatedProducts}
        onProductDeleted={handleProductDeleted}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};
