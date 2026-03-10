import { Filter } from 'lucide-react'

function HolidaysFilters({
  year,
  yearOptions,
  description,
  hidePast,
  sort,
  onYearChange,
  onDescriptionChange,
  onHidePastChange,
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
          <span className="text-muted-foreground">Year</span>
          <select
            value={year}
            onChange={(event) => onYearChange(Number(event.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={optionYear}>
                {optionYear}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Description</span>
          <input
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Search description"
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
            <option value="date-asc">Date (oldest first)</option>
            <option value="date-desc">Date (newest first)</option>
            <option value="description-asc">Description (A-Z)</option>
            <option value="description-desc">Description (Z-A)</option>
          </select>
        </label>

        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={hidePast}
            onChange={(event) => onHidePastChange(event.target.checked)}
            className="h-4 w-4 rounded border border-input"
          />
          <span>Do not show past holidays</span>
        </label>
      </div>
    </div>
  )
}

export default HolidaysFilters
