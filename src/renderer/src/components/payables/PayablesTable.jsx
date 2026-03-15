import { useTranslation } from 'react-i18next'

import { formatCentsLocale, formatDateLocale } from '@/lib/utils'

function effectiveDate(payable) {
  return payable.preferred_date || payable.due_date || ''
}

function PayablesTable({ rows, isLoading, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  const { t, i18n } = useTranslation(['payables', 'common'])

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
              <th className="px-4 py-3 font-medium">{t('common:labels.history')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.dueDate')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.preferredDate')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.effectiveDate')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.value')}</th>
              <th className="px-4 py-3 font-medium">{t('table.headers.paid')}</th>
              <th className="px-4 py-3 font-medium">{t('common:labels.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  {t('table.empty')}
                </td>
              </tr>
            ) : (
              rows.map((payable) => (
                <tr key={payable.id} className="border-t border-border">
                  <td className="px-4 py-3">{payable.history}</td>
                  <td className="px-4 py-3">{formatDateLocale(payable.due_date, i18n.language)}</td>
                  <td className="px-4 py-3">
                    {formatDateLocale(payable.preferred_date, i18n.language)}
                  </td>
                  <td className="px-4 py-3">
                    {formatDateLocale(effectiveDate(payable), i18n.language)}
                  </td>
                  <td className="px-4 py-3">{formatCentsLocale(payable.value, i18n.language)}</td>
                  <td className="px-4 py-3">
                    {payable.paid_at ? t('common:boolean.yes') : t('common:boolean.no')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(payable)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        {t('common:buttons.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(payable)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        {t('common:buttons.delete')}
                      </button>
                      {payable.paid_at ? (
                        <button
                          type="button"
                          onClick={() => onMarkUnpaid(payable)}
                          className="h-8 rounded-md border border-border px-2 text-xs"
                        >
                          {t('table.actions.unpay')}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkPaid(payable)}
                          className="h-8 rounded-md bg-primary px-2 text-xs text-primary-foreground"
                        >
                          {t('table.actions.markPaid')}
                        </button>
                      )}
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

export default PayablesTable
