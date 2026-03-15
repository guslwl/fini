import { Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation(['holidays', 'common'])

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{t('common:labels.filters')}</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">{t('common:labels.year')}</span>
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
          <span className="text-muted-foreground">{t('common:labels.description')}</span>
          <input
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder={t('filters.searchDescription')}
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
            <option value="date-asc">{t('filters.sorting.dateAsc')}</option>
            <option value="date-desc">{t('filters.sorting.dateDesc')}</option>
            <option value="description-asc">{t('filters.sorting.descriptionAsc')}</option>
            <option value="description-desc">{t('filters.sorting.descriptionDesc')}</option>
          </select>
        </label>

        <label className="flex items-center gap-2 self-end text-sm">
          <input
            type="checkbox"
            checked={hidePast}
            onChange={(event) => onHidePastChange(event.target.checked)}
            className="h-4 w-4 rounded border border-input"
          />
          <span>{t('filters.hidePast')}</span>
        </label>
      </div>
    </div>
  )
}

export default HolidaysFilters
