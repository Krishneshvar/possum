import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Loader2, Package, Eye, EyeOff, Calendar } from "lucide-react";
import { useGetVariantsQuery } from "@/services/productsApi";
import { cn } from "@/lib/utils";

// Helper hook for debouncing
function useLocalDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// Custom component for resizable table headers
const ResizableTableHead = ({ className, children, columnWidth, minWidth = 50, onWidthChange, ...props }) => {
    // Local state for dragging to prevent heavy re-renders on parent
    const [localWidth, setLocalWidth] = useState(columnWidth || minWidth);
    const [isResizing, setIsResizing] = useState(false);

    // Sync local width with prop width when not resizing
    useEffect(() => {
        if (!isResizing && columnWidth) {
            setLocalWidth(columnWidth);
        }
    }, [columnWidth, isResizing]);

    const handleMouseDown = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.pageX;
        const startWidth = localWidth;

        const handleMouseMove = (e) => {
            const currentWidth = Math.max(minWidth, startWidth + (e.pageX - startX));
            setLocalWidth(currentWidth);
        };

        const handleMouseUp = (e) => {
            const finalWidth = Math.max(minWidth, startWidth + (e.pageX - startX));
            setIsResizing(false);
            if (onWidthChange) {
                onWidthChange(finalWidth);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [localWidth, minWidth, onWidthChange]);

    return (
        <TableHead
            className={cn("relative transition-none border-r border-border last:border-r-0", className)}
            style={{ width: localWidth, minWidth: localWidth }}
            {...props}
        >
            {children}
            <div
                onMouseDown={handleMouseDown}
                className={cn(
                    "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize touch-none select-none z-50",
                    "hover:bg-primary/50 transition-colors",
                    isResizing ? "bg-primary" : "bg-transparent"
                )}
            />
        </TableHead>
    );
};

export default function SalesTable({
    items,
    updateQuantity,
    updatePrice,
    updateDiscount,
    removeItem,
    onProductSelect,
    showPreview,
    setShowPreview,
    className,
    columnWidths,
    onColumnResize,
    grandTotal = 0,
    date = new Date()
}) {
    // --- Product Search Logic ---
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const searchInputRef = useRef(null);

    // Refs for row inputs to manage focus
    const qtyRefs = useRef({});
    const priceRefs = useRef({});
    const discountRefs = useRef({});

    // Track the last added item to focus it
    const [focusTargetId, setFocusTargetId] = useState(null);
    const [focusedResultIndex, setFocusedResultIndex] = useState(-1);

    // We only want to search when the user types something
    const debouncedSearch = useLocalDebounce(searchTerm, 300);

    const { data: variants = [], isLoading, isFetching } = useGetVariantsQuery(
        { query: debouncedSearch || "" }
    );

    // Close dropdown when clicking outside or pressing Escape
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [wrapperRef]);

    // Handle focus when a new item is added/selected
    useEffect(() => {
        if (focusTargetId && qtyRefs.current[focusTargetId]) {
            qtyRefs.current[focusTargetId].focus();
            setFocusTargetId(null);
        }
    }, [items, focusTargetId]);

    // Reset focused result index when search term changes or dropdown closes
    useEffect(() => {
        setFocusedResultIndex(-1);
    }, [searchTerm, isOpen]);

    const handleSelect = (variant) => {
        const displayLabel = variant.product_name === variant.name
            ? variant.product_name
            : `${variant.product_name} | ${variant.name}`;

        onProductSelect({ ...variant, name: displayLabel });
        setSearchTerm("");
        setIsOpen(false);
        // Set focus target to this variant's ID (which matches item.id)
        setFocusTargetId(variant.id);
    };

    const handleQtyKeyDown = (e, itemId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (priceRefs.current[itemId]) {
                priceRefs.current[itemId].focus();
                priceRefs.current[itemId].select();
            }
        }
    };

    const handlePriceKeyDown = (e, itemId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (discountRefs.current[itemId]) {
                discountRefs.current[itemId].focus();
                discountRefs.current[itemId].select();
            }
        }
    };

    const handleDiscountKeyDown = (e, itemId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (searchInputRef.current) {
                searchInputRef.current.focus();
            }
        }
    };

    // Keyboard Navigation Logic
    const handleTableKeyDown = (e) => {
        const target = e.target;
        const isInput = target.tagName === 'INPUT';
        const isCell = target.tagName === 'TD' || target.hasAttribute('data-grid-cell');

        if (!isInput && !isCell) return;

        // Delete Row Logic
        if (e.key === 'Delete') {
            // Find row ID from target attributes or closest row
            const tr = target.closest('tr');
            if (tr) {
                const rowId = tr.getAttribute('data-row-id');
                if (rowId) {
                    e.preventDefault();
                    removeItem(rowId);
                    // After deletion, focus back to search or previous row if possible
                    setTimeout(() => {
                        if (searchInputRef.current) searchInputRef.current.focus();
                    }, 0);
                    return;
                }
            }
        }

        // Arrow Key Navigation
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            const currentCell = target.tagName === 'TD' ? target : target.closest('td');
            if (!currentCell) return;

            const currentTr = currentCell.parentElement;
            const colIndex = Array.from(currentTr.children).indexOf(currentCell);

            let nextTd = null;

            if (e.key === 'ArrowUp') {
                const nextTr = currentTr.previousElementSibling;
                if (nextTr && nextTr.tagName === 'TR') {
                    nextTd = nextTr.children[colIndex];
                }
            } else if (e.key === 'ArrowDown') {
                const nextTr = currentTr.nextElementSibling;
                if (nextTr && nextTr.tagName === 'TR') {
                    nextTd = nextTr.children[colIndex];
                }
            } else if (e.key === 'ArrowLeft') {
                // If in input, only move if at start
                if (isInput && target.selectionStart !== 0) return;
                nextTd = currentCell.previousElementSibling;
            } else if (e.key === 'ArrowRight') {
                // If in input, only move if at end
                if (isInput && target.selectionEnd !== target.value.length) return;
                nextTd = currentCell.nextElementSibling;
            }

            if (nextTd) {
                e.preventDefault();
                const input = nextTd.querySelector('input');
                if (input) {
                    input.focus();
                    if (input.select) input.select();
                } else {
                    nextTd.focus();
                }
            }
        }

        // Enter to focus input inside cell (if on metadata cell)
        if (e.key === 'Enter' && isCell && !isInput) {
            const input = target.querySelector('input');
            if (input) {
                e.preventDefault();
                input.focus();
                if (input.select) input.select();
            }
        }
    };

    // Search Input specific Key Down handler for Dropdown Navigation
    const handleSearchKeyDown = (e) => {
        if (!isOpen || variants.length === 0) {
            // Allow bubbling to handleTableKeyDown for row navigation
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedResultIndex(prev => {
                const nextIndex = Math.min(prev + 1, variants.length - 1);
                // Scroll into view logic could be added here
                return nextIndex;
            });
        } else if (e.key === 'ArrowUp') {
            if (focusedResultIndex >= 0) {
                e.preventDefault();
                setFocusedResultIndex(prev => prev - 1);
            }
            // If focusedResultIndex is -1, we don't prevent default, 
            // allowing it to bubble to handleTableKeyDown for row navigation
        } else if (e.key === 'Enter') {
            if (focusedResultIndex >= 0 && variants[focusedResultIndex]) {
                e.preventDefault();
                handleSelect(variants[focusedResultIndex]);
            }
        }
    };

    // Effect to scroll focused result into view if needed
    // This requires refs on the result items. Simple version:
    useEffect(() => {
        if (focusedResultIndex >= 0) {
            const button = document.getElementById(`result-item-${focusedResultIndex}`);
            if (button) {
                button.scrollIntoView({ block: 'nearest' });
                button.focus();
            }
        } else if (focusedResultIndex === -1 && searchInputRef.current) {
            // Focus back to search input if index goes back to -1 via Up Arrow
            searchInputRef.current.focus();
        }
    }, [focusedResultIndex]);

    return (
        <div className={cn("flex flex-col bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-0", className)}>
            {/* Header Info Bar */}
            <div className="flex-none p-4 bg-muted/50 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Bill Date: {date.toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-background px-4 py-2 rounded-md border border-border shadow-sm flex items-center gap-3">
                        <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Grand Total</span>
                        <span className="text-xl font-bold text-primary">₹{grandTotal.toFixed(2)}</span>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPreview(!showPreview)}
                        className={cn(
                            "h-9 w-9 border border-border bg-background transition-all duration-200",
                            showPreview ? "text-primary border-primary/20 bg-primary/5" : "text-muted-foreground"
                        )}
                        title={showPreview ? "Hide Preview" : "Show Preview"}
                    >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <Table
                className="min-w-[900px] relative"
                containerClassName="flex-1 overflow-auto border-t border-border min-h-0"
                onKeyDown={handleTableKeyDown}
            >
                <TableHeader className="sticky top-0 z-30 shadow-sm bg-background">
                    <TableRow className="border-border">
                        <ResizableTableHead
                            columnWidth={columnWidths.index}
                            minWidth={40}
                            onWidthChange={(w) => onColumnResize('index', w)}
                            className="bg-background text-center sticky left-0 top-0 z-40 shadow-[1px_0_1px_0_hsl(var(--border))]"
                        >
                            #
                        </ResizableTableHead>
                        <ResizableTableHead
                            columnWidth={columnWidths.product}
                            minWidth={150}
                            onWidthChange={(w) => onColumnResize('product', w)}
                            className="sticky top-0 z-30"
                        >
                            Product
                        </ResizableTableHead>
                        <ResizableTableHead
                            columnWidth={columnWidths.qty}
                            onWidthChange={(w) => onColumnResize('qty', w)}
                            className="text-center sticky top-0 z-30"
                        >
                            Qty
                        </ResizableTableHead>
                        <ResizableTableHead
                            columnWidth={columnWidths.price}
                            onWidthChange={(w) => onColumnResize('price', w)}
                            className="text-right sticky top-0 z-30"
                        >
                            Price
                        </ResizableTableHead>
                        <ResizableTableHead
                            columnWidth={columnWidths.mrp}
                            onWidthChange={(w) => onColumnResize('mrp', w)}
                            className="text-right sticky top-0 z-30"
                        >
                            MRP
                        </ResizableTableHead>
                        <ResizableTableHead
                            columnWidth={columnWidths.discount}
                            onWidthChange={(w) => onColumnResize('discount', w)}
                            className="text-right sticky top-0 z-30"
                        >
                            Discount
                        </ResizableTableHead>
                        <ResizableTableHead
                            columnWidth={columnWidths.total}
                            onWidthChange={(w) => onColumnResize('total', w)}
                            className="text-right sticky top-0 z-30"
                        >
                            Total
                        </ResizableTableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, index) => (
                        <TableRow
                            key={item.id}
                            data-row-id={item.id}
                            className="border-border hover:bg-muted/50 transition-colors group"
                        >
                            <TableCell
                                tabIndex={0}
                                data-grid-cell
                                className="text-center font-medium text-muted-foreground text-xs sticky left-0 z-20 bg-background shadow-[1px_0_0_0_hsl(var(--border))] border-r border-border focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
                            >
                                {index + 1}
                            </TableCell>
                            <TableCell
                                tabIndex={0}
                                data-grid-cell
                                className="border-r border-border focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
                            >
                                <div className="font-medium text-foreground">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.sku || 'SKU-000'}</div>
                            </TableCell>
                            <TableCell
                                className="border-r border-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary focus-within:z-50 focus-within:outline-none p-0"
                            >
                                <div className="flex items-center justify-center h-full w-full">
                                    <Input
                                        ref={(el) => (qtyRefs.current[item.id] = el)}
                                        data-row-id={item.id}
                                        type="text"
                                        value={item.quantity || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "" || /^\d+$/.test(val)) {
                                                updateQuantity(item.id, val === "" ? "" : parseInt(val));
                                            }
                                        }}
                                        onKeyDown={(e) => handleQtyKeyDown(e, item.id)}
                                        className="w-full h-12 text-center bg-transparent border-none focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
                                    />
                                </div>
                            </TableCell>
                            <TableCell
                                className="text-right font-medium border-r border-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary focus-within:z-50 focus-within:outline-none p-0"
                            >
                                <div className="flex items-center justify-end h-full w-full px-2 gap-1">
                                    <span className="text-muted-foreground text-xs">₹</span>
                                    <Input
                                        ref={(el) => (priceRefs.current[item.id] = el)}
                                        data-row-id={item.id}
                                        type="text"
                                        value={item.price || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                updatePrice(item.id, val === "" ? "" : parseFloat(val));
                                            }
                                        }}
                                        onKeyDown={(e) => handlePriceKeyDown(e, item.id)}
                                        className="w-full h-12 border-none p-0 text-right bg-transparent focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </TableCell>
                            <TableCell
                                tabIndex={0}
                                data-grid-cell
                                className="text-right font-medium text-muted-foreground border-r border-border focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
                            >
                                ₹{(parseFloat(item.mrp) || 0).toFixed(2)}
                            </TableCell>
                            <TableCell
                                className="text-right font-medium border-r border-border focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary focus-within:z-50 focus-within:outline-none p-0"
                            >
                                <div className="flex items-center justify-end h-full w-full px-2 gap-1">
                                    <span className="text-muted-foreground text-xs">₹</span>
                                    <Input
                                        ref={(el) => (discountRefs.current[item.id] = el)}
                                        data-row-id={item.id}
                                        type="text"
                                        value={item.discount || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                updateDiscount(item.id, val === "" ? "" : parseFloat(val));
                                            }
                                        }}
                                        onKeyDown={(e) => handleDiscountKeyDown(e, item.id)}
                                        className="w-full h-12 border-none p-0 text-right bg-transparent focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </TableCell>
                            <TableCell
                                tabIndex={0}
                                data-grid-cell
                                className="text-right font-bold text-foreground border-r border-border focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
                            >
                                ₹{(((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)) - (parseFloat(item.discount) || 0)).toFixed(2)}
                            </TableCell>
                        </TableRow>
                    ))}

                    {/* Search Row */}
                    <TableRow className="border-border hover:bg-transparent">
                        <TableCell
                            tabIndex={0}
                            data-grid-cell
                            className="text-center font-medium text-muted-foreground text-xs sticky left-0 z-20 bg-background shadow-[1px_0_0_0_hsl(var(--border))] border-r border-border h-12 focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
                        >
                            {items.length + 1}
                        </TableCell>
                        <TableCell
                            className="border-r border-border p-0 relative focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary focus-within:z-50 focus-within:outline-none"
                            ref={wrapperRef}
                        >
                            <div className="relative w-full h-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
                                <Input
                                    ref={searchInputRef}
                                    placeholder="Scan or Search Product..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setIsOpen(true);
                                    }}
                                    onFocus={() => setIsOpen(true)}
                                    // Make it look seamless
                                    className="h-12 w-full border-none rounded-none bg-transparent pl-9 focus-visible:ring-0 focus-visible:bg-accent/50 placeholder:text-muted-foreground/50"
                                    onKeyDown={handleSearchKeyDown}
                                />
                                {(isLoading || isFetching) && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                                    </div>
                                )}

                                {/* Dropdown Results */}
                                {isOpen && variants.length > 0 && (
                                    <div className="fixed mt-1 w-[400px] bg-popover rounded-md shadow-xl border border-border max-h-[300px] overflow-auto z-[100] p-1"
                                        style={{
                                            left: wrapperRef.current?.getBoundingClientRect().left,
                                            top: wrapperRef.current?.getBoundingClientRect().bottom
                                        }}>
                                        {variants.length === 0 && !isLoading && !isFetching ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No products found.
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {variants.map((variant, index) => (
                                                    <button
                                                        key={variant.id}
                                                        id={`result-item-${index}`}
                                                        onClick={() => handleSelect(variant)}
                                                        tabIndex={-1} // Controlled via focus effect
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'ArrowUp' && index === 0) {
                                                                e.preventDefault();
                                                                setFocusedResultIndex(-1); // Go back to input
                                                            } else if (e.key === 'ArrowUp') {
                                                                e.preventDefault();
                                                                setFocusedResultIndex(index - 1);
                                                            } else if (e.key === 'ArrowDown') {
                                                                e.preventDefault();
                                                                setFocusedResultIndex(Math.min(variants.length - 1, index + 1));
                                                            }
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left group outline-none",
                                                            index === focusedResultIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent"
                                                        )}
                                                    >
                                                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border">
                                                            <Package className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm text-foreground truncate">
                                                                {variant.product_name} {variant.name !== variant.product_name ? `| ${variant.name}` : ''}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex gap-2">
                                                                <span>{variant.sku || 'No SKU'}</span>
                                                                <span className="text-muted-foreground/50">•</span>
                                                                <span>Stock: {variant.stock ?? '0'}</span>
                                                            </div>
                                                        </div>
                                                        <div className="font-bold text-sm text-foreground whitespace-nowrap">
                                                            ₹{variant.mrp}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TableCell>
                        <TableCell
                            tabIndex={0}
                            data-grid-cell
                            colSpan={6}
                            className="bg-muted/10 border-r border-border focus:ring-2 focus:ring-inset focus:ring-primary focus:z-50 focus:outline-none"
                        />
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}
