import { ChevronRight, ChevronLeft, Search, X, ChevronDown } from "lucide-react"
import { useState, useEffect, useRef, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { flattenCategories } from '@/utils/categories.utils.js';

export default function CategorySelector({ categories = [], value, onChange }) {
  const [open, setOpen] = useState(false)
  const [currentCategories, setCurrentCategories] = useState([])
  const [history, setHistory] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const dropdownRef = useRef(null)

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  useEffect(() => {
    setCurrentCategories(categories)
    setHistory([])
  }, [categories])

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      const results = flatCategories.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setSearchResults(results)
    } else {
      setIsSearching(false)
      setSearchResults([])
    }
  }, [searchQuery, flatCategories])

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setCurrentCategories(categories)
      setHistory([])
      setSearchQuery("")
      setIsSearching(false)
    }
    setOpen(isOpen)
  }

  const handleCategoryClick = (category) => {
    if (category.subcategories && category.subcategories.length > 0) {
      setHistory((prev) => [...prev, { categories: currentCategories, title: getCurrentTitle() }])
      setCurrentCategories(category.subcategories)
      setSearchQuery("")
      setIsSearching(false)
    } else {
      onChange("category_id", String(category.id));
      setOpen(false)
    }
  }

  const handleBack = () => {
    if (history.length > 0) {
      const prevState = history[history.length - 1]
      setHistory((prev) => prev.slice(0, -1))
      setCurrentCategories(prevState.categories)
      setSearchQuery("")
      setIsSearching(false)
    }
  }

  const getCurrentTitle = () => {
    if (history.length === 0) return "Categories"
    return "Subcategories"
  }

  const handleSearchResultClick = (category) => {
    onChange("category_id", String(category.id));
    setOpen(false)
  }

  const findCategoryName = (id) => {
    const category = flatCategories.find((c) => String(c.id) === String(id))
    return category ? category.name : "Select a category"
  }

  const getCategoryPath = (categoryId) => {
    const findPath = (cats, targetId, path = []) => {
      for (const cat of cats) {
        const newPath = [...path, cat.name]
        if (cat.id === targetId) {
          return newPath
        }
        if (cat.subcategories && cat.subcategories.length > 0) {
          const result = findPath(cat.subcategories, targetId, newPath)
          if (result) return result
        }
      }
      return null
    }

    const path = findPath(categories, categoryId)
    return path ? path.join(" > ") : ""
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOpenChange(!open)}
        className="w-full justify-between h-11 text-left bg-background border-border hover:border-border/80 focus:border-ring focus:ring-1 focus:ring-ring"
      >
        <span className="truncate text-foreground">{findCategoryName(value)}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-9 border-border focus:border-ring focus:ring-1 focus:ring-ring bg-background text-foreground"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-muted rounded p-0.5"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {!isSearching && history.length > 0 && (
            <div className="border-b border-border">
              <button
                onClick={handleBack}
                className="w-full flex items-center px-3 py-2.5 text-left hover:bg-muted/50 text-primary text-sm font-medium"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </button>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {isSearching ? (
              searchResults.length > 0 ? (
                searchResults.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleSearchResultClick(category)}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border last:border-b-0"
                  >
                    <div className="text-sm font-medium text-foreground">{category.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{getCategoryPath(category.id)}</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-muted-foreground">
                  <Search className="mx-auto h-6 w-6 text-muted-foreground/30 mb-2" />
                  <p className="text-sm">No categories found</p>
                </div>
              )
            ) : (
              currentCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{category.name}</span>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
