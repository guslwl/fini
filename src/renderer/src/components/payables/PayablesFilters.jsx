import { Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation(['payables', 'common'])

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{t('common:labels.filters')}</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t('filters.status.label')}</span>
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="unpaid">{t('filters.status.unpaidOnly')}</option>
            <option value="paid">{t('filters.status.paidOnly')}</option>
            <option value="all">{t('filters.status.all')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t('filters.searchHistory')}</span>
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t('filters.searchHistory')}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t('common:labels.month')}</span>
          <input
            type="month"
            value={month}
            onChange={(event) => onMonthChange(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t('common:labels.sorting')}</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="date-asc">{t('filters.sorting.effectiveDateAsc')}</option>
            <option value="date-desc">{t('filters.sorting.effectiveDateDesc')}</option>
            <option value="value-asc">{t('filters.sorting.valueAsc')}</option>
            <option value="value-desc">{t('filters.sorting.valueDesc')}</option>
            <option value="history-asc">{t('filters.sorting.historyAsc')}</option>
            <option value="history-desc">{t('filters.sorting.historyDesc')}</option>
          </select>
        </label>
      </div>
    </div>
  )
}

export default PayablesFilters
