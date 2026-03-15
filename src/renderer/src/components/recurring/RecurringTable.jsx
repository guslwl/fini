import { useTranslation } from 'react-i18next'

import { formatCentsLocale } from '@/lib/utils'

function formatDueDay(dueDay) {
  if (!Number.isInteger(dueDay)) {
    return '-'
  }

  return String(dueDay)
}

function RecurringTable({ rows, isLoading, onEdit, onDelete }) {
  const { t, i18n } = useTranslation(['recurring', 'common'])

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
        {t('table.loading')}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">{t('common:labels.description')}</th>
              <th className="px-4 py-3 font-medium">{t('table.headers.dueDay')}</th>
              <th className="px-4 py-3 font-medium">{t('table.headers.shouldPostpone')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.value')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              rows.map((recurring) => (
                <tr key={recurring.id} className="border-t border-border">
                  <td className="px-4 py-3">{recurring.history}</td>
                  <td className="px-4 py-3">{formatDueDay(recurring.due_day)}</td>
                  <td className="px-4 py-3">
                    {recurring.should_postpone ? t('common:boolean.yes') : t('common:boolean.no')}
                  </td>
                  <td className="px-4 py-3">{formatCentsLocale(recurring.value, i18n.language)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(recurring)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        {t('common:buttons.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(recurring)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        {t('common:buttons.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecurringTable
