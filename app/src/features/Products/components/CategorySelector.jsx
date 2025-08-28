import { useState, useEffect, useRef } from "react"
import { ChevronRight, ChevronLeft, Search, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const buildCategoryTree = (categories) => {
  if (!categories || !Array.isArray(categories)) {
    return []
  }

  const categoryMap = new Map()
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] })
  })

  const categoryTree = []
  categoryMap.forEach((category) => {
    if (category.parent_id === null) {
      categoryTree.push(category)
    } else {
      const parent = categoryMap.get(category.parent_id)
      if (parent) {
        parent.children.push(category)
      }
    }
  })

  return categoryTree
}

export default function CategorySelector({ categories = [], value, onChange }) {
  const [open, setOpen] = useState(false)
  const [currentCategories, setCurrentCategories] = useState([])
  const [history, setHistory] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const dropdownRef = useRef(null)

  const categoryTree = buildCategoryTree(categories)

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
    setCurrentCategories(categoryTree)
    setHistory([])
  }, [categories])

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true)
      const results = categories
        ? categories.filter((category) => category.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : []
      setSearchResults(results)
    } else {
      setIsSearching(false)
      setSearchResults([])
    }
  }, [searchQuery, categories])

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setCurrentCategories(categoryTree)
      setHistory([])
      setSearchQuery("")
      setIsSearching(false)
    }
    setOpen(isOpen)
  }

  const handleCategoryClick = (category) => {
    if (category.children && category.children.length > 0) {
      setHistory((prev) => [...prev, { categories: currentCategories, title: getCurrentTitle() }])
      setCurrentCategories(category.children)
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
    if (!categories || !Array.isArray(categories)) {
      return "Select a category"
    }
    const category = categories.find((c) => String(c.id) === String(id))
    return category ? category.name : "Select a category"
  }

  const getCategoryPath = (categoryId) => {
    const findPath = (cats, targetId, path = []) => {
      for (const cat of cats) {
        const newPath = [...path, cat.name]
        if (cat.id === targetId) {
          return newPath
        }
        if (cat.children && cat.children.length > 0) {
          const result = findPath(cat.children, targetId, newPath)
          if (result) return result
        }
      }
      return null
    }

    const path = findPath(categoryTree, categoryId)
    return path ? path.join(" > ") : ""
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleOpenChange(!open)}
        className="w-full justify-between h-11 text-left bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      >
        <span className="truncate text-gray-900">{findCategoryName(value)}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-9 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded p-0.5"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {!isSearching && history.length > 0 && (
            <div className="border-b border-gray-100">
              <button
                onClick={handleBack}
                className="w-full flex items-center px-3 py-2.5 text-left hover:bg-gray-50 text-blue-600 text-sm font-medium"
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
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{getCategoryPath(category.id)}</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-gray-500">
                  <Search className="mx-auto h-6 w-6 text-gray-300 mb-2" />
                  <p className="text-sm">No categories found</p>
                </div>
              )
            ) : (
              currentCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  {category.children && category.children.length > 0 && (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
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
