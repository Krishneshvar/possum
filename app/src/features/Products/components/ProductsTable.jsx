import {  Eye, Trash2, Package, Edit, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Table } from "@/components/ui/table";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useDeleteProductMutation, useGetProductsQuery } from "@/services/productsApi";
import ColumnVisibilityDropdown from "@/components/common/ColumnVisibilityDropdown";
import { setSearchTerm, setCurrentPage } from "../productsSlice";
import ProductsFilter from "./ProductsFilter";
import GenericDeleteDialog from "@/components/common/GenericDeleteDialog";

import GenericTableHeader from "@/components/common/GenericTableHeader";
import GenericTableBody from "@/components/common/GenericTableBody";
import GenericPagination from "@/components/common/GenericPagination";
import ActionsDropdown from "@/components/common/ActionsDropdown";

import {allColumns} from "./productsTableContents.jsx"

export default function ProductsTable({ onProductDeleted }) {
  const dispatch = useDispatch();
  const { searchTerm, currentPage, itemsPerPage, filters } = useSelector((state) => state.products);
  const { data: products = [] } = useGetProductsQuery();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleteProduct] = useDeleteProductMutation();
  const [visibleColumns, setVisibleColumns] = useState(
    allColumns.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {})
  );

  const filteredProducts = products ? products.filter((product) => {
    const matchesSearchTerm =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const getStockStatus = (stock) => {
      if (stock === 0) return 'out-of-stock';
      if (stock <= 10) return 'low-stock';
      return 'in-stock';
    };

    const matchesStockStatus = filters.stockStatus === 'all' || getStockStatus(product.stock) === filters.stockStatus;
    const matchesCategory = filters.categories.length === 0 || filters.categories.includes(product.category_name);
    const matchesStatus = filters.status === "all" || product.status === filters.status;

    return matchesSearchTerm && matchesStockStatus && matchesCategory && matchesStatus;
  }) : [];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogOpenChange = (open) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setTimeout(() => setSelectedProduct(null), 0);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await deleteProduct(selectedProduct.id).unwrap();
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      onProductDeleted();
      toast.success("Product deleted successfully", {
        description: "The selected product was deleted successfully.",
        duration: 5000,
      });
    } catch (err) {
      toast.error("Error deleting product", {
        description: "An error occurred while deleting product. Please try again later.",
        duration: 5000,
      });
    }
  };

  const emptyState = (
    <div className="flex flex-col items-center gap-2">
      <Package className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">No products found</p>
      <p className="text-xs text-muted-foreground">Try adjusting your search or add a new product</p>
    </div>
  );

  const renderProductActions = (product) => (
    <ActionsDropdown>
      <DropdownMenuItem asChild>
        <Link to={`/products/${product.id}`} className="cursor-pointer">
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to={`/products/edit/${product.id}`} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className="text-destructive focus:text-destructive cursor-pointer"
        onClick={() => handleDeleteClick(product)}
      >
        <Trash2 className="mr-2 h-4 w-4 text-destructive" />
        Delete Product
      </DropdownMenuItem>
    </ActionsDropdown>
  );

  return (
    <>
      <Card>
        <CardContent className="space-y-4 pt-2">
          <div className="flex flex-col gap-4 sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products by name or SKU..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => dispatch(setSearchTerm(e.target.value))}
                />
              </div>
            <div className="flex justify-between">
              <ProductsFilter />
              <ColumnVisibilityDropdown columns={allColumns} onChange={setVisibleColumns} />
            </div>
          </div>

          <Separator />

          <Table>
            <GenericTableHeader columns={allColumns} visibleColumns={visibleColumns} />
            <GenericTableBody 
              data={paginatedProducts} 
              allColumns={allColumns}
              visibleColumns={visibleColumns} 
              emptyState={emptyState}
              renderActions={renderProductActions}
              avatarIcon={<Package className="h-4 w-4 text-primary" />}
            />
          </Table>
          
          <GenericPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      <GenericDeleteDialog
        dialogTitle="Delete Product?"
        itemName={selectedProduct?.name ?? "this product"}
        open={isDeleteDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
