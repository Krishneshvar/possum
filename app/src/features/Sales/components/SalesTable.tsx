import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Package, ShoppingCart } from "lucide-react";
import SalesTableRow from "./SalesTableRow";
import { useCurrency } from "@/hooks/useCurrency";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

interface SalesTableProps {
    items: any[];
    variants: any[];
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onDirectAdd: (variant: any) => void;
    updateQuantity: (index: number, quantity: number) => void;
    updatePrice: (index: number, price: number) => void;
    updateDiscount: (index: number, updates: { discountType?: 'amount' | 'percentage'; discountValue?: number }) => void;
    removeItem: (index: number) => void;
    total: number;
}

const NAV_COLS = [1, 2, 3, 4, 5, 6];
type SalesColumnKey = 'sno' | 'product' | 'qty' | 'price' | 'discount' | 'total';
const SALES_TABLE_WIDTHS_STORAGE_KEY = 'sales-table-column-widths-v1';

const MIN_COLUMN_WIDTHS: Record<SalesColumnKey, number> = {
    sno: 56,
    product: 220,
    qty: 88,
    price: 120,
    discount: 180,
    total: 120
};

const DEFAULT_COLUMN_WIDTHS: Record<SalesColumnKey, number> = {
    sno: 70,
    product: 340,
    qty: 100,
    price: 140,
    discount: 220,
    total: 140
};

const getInitialColumnWidths = (): Record<SalesColumnKey, number> => {
    if (typeof window === 'undefined') {
        return DEFAULT_COLUMN_WIDTHS;
    }

    try {
        const stored = window.localStorage.getItem(SALES_TABLE_WIDTHS_STORAGE_KEY);
        if (!stored) {
            return DEFAULT_COLUMN_WIDTHS;
        }

        const parsed = JSON.parse(stored) as Partial<Record<SalesColumnKey, number>>;
        const merged: Record<SalesColumnKey, number> = { ...DEFAULT_COLUMN_WIDTHS };

        (Object.keys(DEFAULT_COLUMN_WIDTHS) as SalesColumnKey[]).forEach((key) => {
            const width = parsed[key];
            if (typeof width === 'number' && Number.isFinite(width)) {
                merged[key] = Math.max(MIN_COLUMN_WIDTHS[key], width);
            }
        });

        return merged;
    } catch {
        return DEFAULT_COLUMN_WIDTHS;
    }
};

export default function SalesTable({
    items,
    variants,
    searchTerm,
    onSearchChange,
    onDirectAdd,
    updateQuantity,
    updatePrice,
    updateDiscount,
    removeItem,
    total
}: SalesTableProps) {
    const currency = useCurrency();
    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownListRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showAllOnFocus, setShowAllOnFocus] = useState(true);
    const [activeDropdownIndex, setActiveDropdownIndex] = useState(0);
    const [columnWidths, setColumnWidths] = useState<Record<SalesColumnKey, number>>(getInitialColumnWidths);
    const resizingColumnRef = useRef<SalesColumnKey | null>(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when items are added
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [items.length]);

    const totalQuantity = useMemo(() => {
        return items.reduce((sum, item) => sum + item.quantity, 0);
    }, [items]);

    const filteredVariants = useMemo(() => {
        if (showAllOnFocus) {
            return variants;
        }

        const normalized = searchTerm.trim().toLowerCase();
        if (!normalized) {
            return variants;
        }

        return variants.filter((variant: any) => {
            const productName = String(variant.product_name || '').toLowerCase();
            const variantName = String(variant.name || '').toLowerCase();
            const sku = String(variant.sku || '').toLowerCase();
            return productName.includes(normalized) || variantName.includes(normalized) || sku.includes(normalized);
        });
    }, [searchTerm, showAllOnFocus, variants]);

    const focusCell = (row: number, col: number) => {
        const target = document.querySelector<HTMLElement>(`[data-nav-row=\"${row}\"][data-nav-col=\"${col}\"]`);
        target?.focus();
    };

    const handleCellArrowNav = (e: ReactKeyboardEvent<HTMLElement>, row: number, col: number) => {
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            return;
        }

        e.preventDefault();

        const maxRow = items.length;
        let nextRow = row;
        let nextCol = col;

        if (e.key === 'ArrowUp') nextRow = Math.max(0, row - 1);
        if (e.key === 'ArrowDown') nextRow = Math.min(maxRow, row + 1);
        if (e.key === 'ArrowLeft') {
            const idx = NAV_COLS.indexOf(col);
            nextCol = NAV_COLS[Math.max(0, idx - 1)] ?? col;
        }
        if (e.key === 'ArrowRight') {
            const idx = NAV_COLS.indexOf(col);
            nextCol = NAV_COLS[Math.min(NAV_COLS.length - 1, idx + 1)] ?? col;
        }

        focusCell(nextRow, nextCol);
    };

    const beginResize = (e: React.MouseEvent, key: SalesColumnKey) => {
        e.preventDefault();
        e.stopPropagation();
        resizingColumnRef.current = key;
        startXRef.current = e.pageX;
        startWidthRef.current = columnWidths[key];
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
                setIsDropdownOpen(true);
                setShowAllOnFocus(true);
                setActiveDropdownIndex(0);
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const key = resizingColumnRef.current;
            if (!key) return;
            const delta = e.pageX - startXRef.current;
            const next = Math.max(MIN_COLUMN_WIDTHS[key], startWidthRef.current + delta);
            setColumnWidths((prev) => ({ ...prev, [key]: next }));
        };

        const handleMouseUp = () => {
            resizingColumnRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        window.localStorage.setItem(SALES_TABLE_WIDTHS_STORAGE_KEY, JSON.stringify(columnWidths));
    }, [columnWidths]);

    useEffect(() => {
        if (!isDropdownOpen || filteredVariants.length === 0) {
            return;
        }
        const safeIndex = Math.max(0, Math.min(activeDropdownIndex, filteredVariants.length - 1));
        const activeOption = dropdownListRef.current?.querySelector<HTMLElement>(`[data-option-index="${safeIndex}"]`);
        activeOption?.scrollIntoView({ block: 'nearest' });
    }, [activeDropdownIndex, filteredVariants.length, isDropdownOpen]);

    useEffect(() => {
        if (activeDropdownIndex >= filteredVariants.length) {
            setActiveDropdownIndex(0);
        }
    }, [activeDropdownIndex, filteredVariants.length]);

    const handleSearchKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setIsDropdownOpen(false);
            searchInputRef.current?.blur();
            return;
        }

        if (isDropdownOpen && filteredVariants.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            setActiveDropdownIndex((prev) => {
                if (e.key === 'ArrowDown') {
                    return (prev + 1) % filteredVariants.length;
                }
                return (prev - 1 + filteredVariants.length) % filteredVariants.length;
            });
            return;
        }

        if (isDropdownOpen && filteredVariants.length > 0 && e.key === 'Enter') {
            e.preventDefault();
            const safeIndex = Math.max(0, Math.min(activeDropdownIndex, filteredVariants.length - 1));
            const variant = filteredVariants[safeIndex];
            if (variant) {
                onDirectAdd(variant);
                setIsDropdownOpen(false);
                setActiveDropdownIndex(0);
            }
            return;
        }

        handleCellArrowNav(e, 0, 1);
    };

    return (
        <div className="h-[calc(100vh-7rem)] border rounded-lg overflow-hidden flex flex-col bg-card shadow-sm">
            <div className="flex items-center gap-2 p-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-foreground">Cart Items</h3>
            </div>
            <div
                ref={scrollContainerRef}
                className="overflow-auto flex-1 flex flex-col min-h-0"
                role="region"
                aria-label="Shopping cart items"
            >
                <Table className="table-fixed w-full" containerClassName="overflow-visible">
                    <colgroup>
                        <col style={{ width: `${columnWidths.sno}px` }} />
                        <col style={{ width: `${columnWidths.product}px` }} />
                        <col style={{ width: `${columnWidths.qty}px` }} />
                        <col style={{ width: `${columnWidths.price}px` }} />
                        <col style={{ width: `${columnWidths.discount}px` }} />
                        <col style={{ width: `${columnWidths.total}px` }} />
                    </colgroup>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="relative border border-border font-semibold text-center">
                                S. No
                                <button type="button" className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30" onMouseDown={(e) => beginResize(e, 'sno')} aria-label="Resize S. No column" />
                            </TableHead>
                            <TableHead className="relative border border-border font-semibold">
                                Product
                                <button type="button" className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30" onMouseDown={(e) => beginResize(e, 'product')} aria-label="Resize Product column" />
                            </TableHead>
                            <TableHead className="relative border border-border text-center font-semibold">
                                Qty
                                <button type="button" className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30" onMouseDown={(e) => beginResize(e, 'qty')} aria-label="Resize Qty column" />
                            </TableHead>
                            <TableHead className="relative border border-border text-right font-semibold">
                                Price
                                <button type="button" className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30" onMouseDown={(e) => beginResize(e, 'price')} aria-label="Resize Price column" />
                            </TableHead>
                            <TableHead className="relative border border-border text-right font-semibold">
                                Discount
                                <button type="button" className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30" onMouseDown={(e) => beginResize(e, 'discount')} aria-label="Resize Discount column" />
                            </TableHead>
                            <TableHead className="relative border border-border text-right font-semibold">
                                Total
                                <button type="button" className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/30" onMouseDown={(e) => beginResize(e, 'total')} aria-label="Resize Total column" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-10 text-center border border-border">
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <Package className="h-10 w-10 opacity-20" aria-hidden="true" />
                                        <div>
                                            <p className="font-medium text-base">Your cart is empty</p>
                                            <p className="text-sm mt-1">Search and add products to get started</p>
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item, index) => (
                                <SalesTableRow
                                    key={`${item.id}-${index}`}
                                    item={item}
                                    index={index}
                                    updateQuantity={updateQuantity}
                                    updatePrice={updatePrice}
                                    updateDiscount={updateDiscount}
                                    removeItem={removeItem}
                                    onCellArrowNav={handleCellArrowNav}
                                />
                            ))
                        )}
                        {/* Search / Add row — always at the bottom */}
                        <TableRow className="bg-muted/10">
                            <TableCell className="border border-border text-center font-medium text-muted-foreground text-lg leading-none">+</TableCell>
                            <TableCell className="border border-border relative" colSpan={5}>
                                <Input
                                    ref={searchInputRef}
                                    value={searchTerm}
                                    placeholder="Search product, variant, or SKU... (Ctrl+K)"
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                        onSearchChange(e.target.value);
                                        setShowAllOnFocus(false);
                                        setActiveDropdownIndex(0);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => {
                                        setShowAllOnFocus(true);
                                        setActiveDropdownIndex(0);
                                        setIsDropdownOpen(true);
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setIsDropdownOpen(false);
                                        }, 120);
                                    }}
                                    onKeyDown={handleSearchKeyDown}
                                    aria-label="Search and add product to cart"
                                    aria-autocomplete="list"
                                    aria-controls="cart-variant-results"
                                    aria-expanded={isDropdownOpen}
                                    aria-activedescendant={isDropdownOpen && filteredVariants.length > 0 ? `cart-variant-option-${activeDropdownIndex}` : undefined}
                                    data-nav-row={items.length + 1}
                                    data-nav-col={1}
                                />
                                {isDropdownOpen && (
                                    <div
                                        id="cart-variant-results"
                                        role="listbox"
                                        ref={dropdownListRef}
                                        className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-md border bg-popover shadow-lg"
                                    >
                                        {filteredVariants.length > 0 ? (
                                            filteredVariants.map((variant: any, idx: number) => (
                                                <button
                                                    key={variant.id}
                                                    id={`cart-variant-option-${idx}`}
                                                    type="button"
                                                    role="option"
                                                    aria-selected={activeDropdownIndex === idx}
                                                    data-option-index={idx}
                                                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent ${activeDropdownIndex === idx ? 'bg-accent' : ''}`}
                                                    onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
                                                    onMouseEnter={() => setActiveDropdownIndex(idx)}
                                                    onClick={() => {
                                                        onDirectAdd(variant);
                                                        setIsDropdownOpen(false);
                                                        setActiveDropdownIndex(0);
                                                    }}
                                                >
                                                    <div>
                                                        <div className="font-medium">{variant.product_name}</div>
                                                        <div className="text-xs text-muted-foreground">{variant.name}</div>
                                                    </div>
                                                    <div className="text-right text-xs text-muted-foreground">
                                                        <div>{variant.sku}</div>
                                                        <div>{variant.stock} in stock</div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                No matching variants
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

                {/* Spacer to maintain gap between search bar and footer */}
                <div className="flex-1 min-h-[16rem]" />

                {/* Sticky Footer stuck to bottom of container */}
                <div className="mt-auto sticky bottom-0 z-10 bg-card border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <Table className="table-fixed w-full" containerClassName="overflow-visible">
                        <colgroup>
                            <col style={{ width: `${columnWidths.sno}px` }} />
                            <col style={{ width: `${columnWidths.product}px` }} />
                            <col style={{ width: `${columnWidths.qty}px` }} />
                            <col style={{ width: `${columnWidths.price}px` }} />
                            <col style={{ width: `${columnWidths.discount}px` }} />
                            <col style={{ width: `${columnWidths.total}px` }} />
                        </colgroup>
                        <TableFooter className="bg-transparent border-0">
                            <TableRow className="hover:bg-transparent border-0">
                                <TableCell className="border-x border-border" />
                                <TableCell className="border-x border-border font-bold text-sm">Totals</TableCell>
                                <TableCell className="border-x border-border text-center font-bold tabular-nums text-primary">{totalQuantity}</TableCell>
                                <TableCell className="border-x border-border" />
                                <TableCell className="border-x border-border" />
                                <TableCell className="border border-border text-right font-bold tabular-nums text-primary">
                                    {currency}{total.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </div>
        </div >
    );
}
