import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { formatCentsLocale, formatDateLocale } from '@/lib/utils'

function DateDetailsModal({
  open,
  date,
  holidayNames,
  unpaidItems,
  paidItems,
  unpaidSumCents,
  paidSumCents,
  totalSumCents,
  scheduledItems = [],
  onClose,
  onMarkPaid,
  markingPayableId
}) {
  const { t, i18n } = useTranslation(['payables', 'common', 'recurring'])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleEscapeKey(event) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()
      onClose()
    }

    window.addEventListener('keydown', handleEscapeKey)

    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  function handleClose() {
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose()
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-border bg-background p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{date}</h3>
          <button
            type="button"
            onClick={handleClose}
            className="h-9 rounded-md border border-border px-3 text-sm"
          >
            {t('common:buttons.close')}
          </button>
        </div>

        {holidayNames.length > 0 ? (
          <p className="mb-4 text-sm text-muted-foreground">{holidayNames.join(', ')}</p>
        ) : null}

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">{t('dateDetails.unpaidSubtotal')}</p>
            <p className="text-sm font-medium">
              {formatCentsLocale(unpaidSumCents, i18n.language)}
            </p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">{t('dateDetails.paidSubtotal')}</p>
            <p className="text-sm font-medium">{formatCentsLocale(paidSumCents, i18n.language)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">{t('dateDetails.globalTotal')}</p>
            <p className="text-sm font-medium">{formatCentsLocale(totalSumCents, i18n.language)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">
              {t('dateDetails.unpaidSection', { count: unpaidItems.length })}
            </h4>
            {unpaidItems.length === 0 ? (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                {t('dateDetails.noUnpaid')}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('common:labels.history')}</th>
                      <th className="px-3 py-2 font-medium">{t('dateDetails.headers.account')}</th>
                      <th className="px-3 py-2 font-medium">{t('common:labels.dueDate')}</th>
                      <th className="px-3 py-2 font-medium">{t('common:labels.preferredDate')}</th>
                      <th className="px-3 py-2 font-medium">{t('common:labels.value')}</th>
                      <th className="px-3 py-2 font-medium">{t('dateDetails.headers.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidItems.map((payable) => (
                      <tr key={payable.id} className="border-t border-border">
                        <td className="px-3 py-2">{payable.history || '-'}</td>
                        <td className="px-3 py-2">{payable.account_id || '-'}</td>
                        <td className="px-3 py-2">
                          {formatDateLocale(payable.due_date, i18n.language)}
                        </td>
                        <td className="px-3 py-2">
                          {formatDateLocale(payable.preferred_date, i18n.language)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCentsLocale(payable.value, i18n.language)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onMarkPaid(payable)}
                            className="h-8 rounded-md bg-primary px-2 text-xs text-primary-foreground"
                            disabled={markingPayableId === payable.id}
                          >
                            {markingPayableId === payable.id
                              ? t('dateDetails.marking')
                              : t('dateDetails.markPaid')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">
              {t('dateDetails.paidSection', { count: paidItems.length })}
            </h4>
            {paidItems.length === 0 ? (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                {t('dateDetails.noPaid')}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('common:labels.history')}</th>
                      <th className="px-3 py-2 font-medium">{t('dateDetails.headers.account')}</th>
                      <th className="px-3 py-2 font-medium">{t('common:labels.dueDate')}</th>
                      <th className="px-3 py-2 font-medium">{t('common:labels.preferredDate')}</th>
                      <th className="px-3 py-2 font-medium">{t('common:labels.value')}</th>
                      <th className="px-3 py-2 font-medium">{t('dateDetails.headers.paidAt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidItems.map((payable) => (
                      <tr key={payable.id} className="border-t border-border">
                        <td className="px-3 py-2">{payable.history || '-'}</td>
                        <td className="px-3 py-2">{payable.account_id || '-'}</td>
                        <td className="px-3 py-2">
                          {formatDateLocale(payable.due_date, i18n.language)}
                        </td>
                        <td className="px-3 py-2">
                          {formatDateLocale(payable.preferred_date, i18n.language)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCentsLocale(payable.value, i18n.language)}
                        </td>
                        <td className="px-3 py-2">
                          {formatDateLocale(payable.paid_at, i18n.language)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium">
              {t('dateDetails.scheduledSection', { count: scheduledItems.length })}
            </h4>
            {scheduledItems.length === 0 ? (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                {t('dateDetails.noScheduled')}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-dashed border-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">{t('common:labels.description')}</th>
                      <th className="px-3 py-2 font-medium">{t('recurring:table.headers.type')}</th>
                      <th className="px-3 py-2 font-medium">{t('recurring:table.headers.certainty')}</th>
                      <th className="px-3 py-2 font-medium">{t('common:labels.value')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledItems.map((tx) => (
                      <tr key={tx.id} className="border-t border-border">
                        <td className="px-3 py-2">{tx.description}</td>
                        <td className="px-3 py-2">
                          {t(`recurring:modal.type.${tx.type}`, { defaultValue: tx.type })}
                        </td>
                        <td className="px-3 py-2">
                          {t(`recurring:modal.certainty.${tx.certainty}`, { defaultValue: tx.certainty })}
                        </td>
                        <td className="px-3 py-2">
                          {tx.amount !== null ? formatCentsLocale(tx.amount, i18n.language) : '?'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DateDetailsModal
