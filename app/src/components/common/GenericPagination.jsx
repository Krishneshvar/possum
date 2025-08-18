import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

export default function GenericPagination({ currentPage, totalPages, onPageChange }) {
  const renderPaginationItems = () => {
    const items = []
    const visiblePages = 3

    if (totalPages <= visiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink onClick={() => onPageChange(i)} isActive={i === currentPage} className="cursor-pointer">
              {i}
            </PaginationLink>
          </PaginationItem>,
        )
      }
      return items
    }

    let pagesToShow = [];
    pagesToShow.push(currentPage);

    if (currentPage + 1 <= totalPages) {
      pagesToShow.push(currentPage + 1);
    }
    if (currentPage + 2 <= totalPages) {
      pagesToShow.push(currentPage + 2);
    }

    const lastPage = totalPages;
    const isLastPageVisible = pagesToShow.includes(lastPage);

    pagesToShow.forEach((page) => {
      items.push(
        <PaginationItem key={page}>
          <PaginationLink onClick={() => onPageChange(page)} isActive={page === currentPage} className="cursor-pointer">
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    });

    if (!isLastPageVisible) {
      items.push(<span key="ellipsis" className="px-2 text-sm text-muted-foreground">...</span>);
      items.push(
        <PaginationItem key={lastPage}>
          <PaginationLink onClick={() => onPageChange(lastPage)} className="cursor-pointer">
            {lastPage}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 px-1">
      <p className="text-sm text-muted-foreground font-medium text-center sm:text-left">
        Page {currentPage} of {totalPages}
      </p>
      <Pagination>
        <PaginationContent className="gap-1">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-muted/80"} h-9 px-2 sm:px-3`}
            />
          </PaginationItem>
          {renderPaginationItems()}
          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-muted/80"} h-9 px-2 sm:px-3`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
