import { MoreHorizontal, Eye, Trash2, Package, Edit, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useSelector, useDispatch } from 'react-redux';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { toast } from "sonner"
import { Input } from "@/components/ui/input";

import { useDeleteProductMutation, useGetProductsQuery } from "@/services/productsApi"
import { setSearchTerm, setCurrentPage } from "../productsSlice";
import DeleteProductDialog from "../components/DeleteProductDialog"
import ProductsFilter from "./ProductsFilter";

export default function ProductsTable({ onProductDeleted }) {
  const dispatch = useDispatch();
  const { searchTerm, currentPage, itemsPerPage, filters } = useSelector((state) => state.products);
  const { data: products = [], isFetching, isLoading } = useGetProductsQuery();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [deleteProduct] = useDeleteProductMutation();

  const filteredProducts = products
    ? products.filter((product) => {
        const matchesSearchTerm =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const getStockStatus = (stock) => {
          if (stock === 0) return 'out-of-stock';
          if (stock <= 10) return 'low-stock';
          return 'in-stock';
        };
        const matchesStockStatus =
          filters.stockStatus === 'all' || getStockStatus(product.stock) === filters.stockStatus;
          
        return matchesSearchTerm && matchesStockStatus;
      })
    : [];

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  const handleDeleteClick = (product) => {
    setSelectedProduct(product)
    setIsDeleteDialogOpen(true)
  }

  const handleDialogOpenChange = (open) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setTimeout(() => setSelectedProduct(null), 0)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return
    try {
      await deleteProduct(selectedProduct.id).unwrap();
      setIsDeleteDialogOpen(false)
      setSelectedProduct(null)
      onProductDeleted()
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
  }

  const formatPrice = (price) => {
    if (price === null || isNaN(price)) return "N/A"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number.parseFloat(price/100))
  }

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Out of Stock
        </Badge>
      )
    } else if (stock <= 10) {
      return (
        <Badge
          variant="secondary"
          className="gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
        >
          <AlertTriangle className="h-3 w-3" />
          Low Stock ({stock})
        </Badge>
      )
    } else {
      return (
        <Badge
          variant="secondary"
          className="gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
        >
          <CheckCircle className="h-3 w-3" />
          In Stock ({stock})
        </Badge>
      )
    }
  }

  const renderPaginationItems = () => {
    const items = []
    const maxVisible = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    const endPage = Math.min(totalPages, startPage + maxVisible - 1)

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => handlePageChange(i)} isActive={i === currentPage} className="cursor-pointer">
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }
    return items
  }

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
            <div className="flex flex-wrap items-center gap-2">
              <ProductsFilter />
            </div>
          </div>

          <Separator />

          <Table>
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Stock Status</TableHead>
                <TableHead className="font-semibold text-right">Price</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-muted/50">
                    <TableCell className="py-2">
                      <Avatar className="rounded-lg h-10 w-10">
                        <AvatarFallback className="bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="space-y-1">
                        <p className="font-medium leading-none">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <code className="relative rounded bg-muted px-2 py-1 text-sm font-mono">{product.sku}</code>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="outline" className="font-normal">
                        {product.category_name}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2">{getStockStatus(product.stock)}</TableCell>
                    <TableCell className="py-4 text-right">
                      <span className="font-semibold">{formatPrice(product.price)}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No products found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your search or add a new product</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 pt-2 border-t bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteProductDialog
        product={selectedProduct}
        open={isDeleteDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
