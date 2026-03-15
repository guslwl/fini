import { useTranslation } from 'react-i18next'

import { formatCentsLocale, formatDateLocale } from '@/lib/utils'

function ScheduledTransactionsTable({ rows, isLoading, onEdit, onDelete }) {
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
              <th className="px-4 py-3 font-medium">{t('table.headers.type')}</th>
              <th className="px-4 py-3 font-medium">{t('table.headers.frequency')}</th>
              <th className="px-4 py-3 font-medium">{t('table.headers.nextDate')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.value')}</th>
              <th className="px-4 py-3 font-medium">{t('table.headers.certainty')}</th>
              <th className="px-4 py-3 font-medium">{t('table.headers.status')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              rows.map((tx) => (
                <tr key={tx.id} className="border-t border-border">
                  <td className="px-4 py-3">{tx.description}</td>
                  <td className="px-4 py-3">
                    {t(`modal.type.${tx.type}`, { defaultValue: tx.type })}
                  </td>
                  <td className="px-4 py-3">
                    {t(`modal.frequency.${tx.frequency}`, { defaultValue: tx.frequency })}
                  </td>
                  <td className="px-4 py-3">{formatDateLocale(tx.next_date, i18n.language)}</td>
                  <td className="px-4 py-3">
                    {tx.amount !== null ? formatCentsLocale(tx.amount, i18n.language) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {t(`modal.certainty.${tx.certainty}`, { defaultValue: tx.certainty })}
                  </td>
                  <td className="px-4 py-3">
                    {t(`modal.status.${tx.status}`, { defaultValue: tx.status })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(tx)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        {t('common:buttons.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(tx)}
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

export default ScheduledTransactionsTable
