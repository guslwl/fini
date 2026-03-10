import { Filter } from 'lucide-react'

function PayablesFilters({
  status,
  search,
  month,
  sort,
  onStatusChange,
  onSearchChange,
  onMonthChange,
  onSortChange
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Filters</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Status</span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="unpaid">Unpaid only</option>
            <option value="paid">Paid only</option>
            <option value="all">All</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Search history</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search history"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Month</span>
          <input
            type="month"
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Sorting</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="date-asc">Effective date (oldest first)</option>
            <option value="date-desc">Effective date (newest first)</option>
            <option value="value-asc">Value (lowest first)</option>
            <option value="value-desc">Value (highest first)</option>
            <option value="history-asc">History (A-Z)</option>
            <option value="history-desc">History (Z-A)</option>
          </select>
        </label>
      </div>
    </div>
  )
}

export default PayablesFilters
