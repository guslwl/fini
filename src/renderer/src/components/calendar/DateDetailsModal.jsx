import { useEffect } from 'react'

import { centsToDecimalString } from '@/lib/utils'

function formatValue(value) {
  return centsToDecimalString(value) || '0.00'
}

function DateDetailsModal({
  open,
  date,
  holidayNames,
  unpaidItems,
  paidItems,
  unpaidSumCents,
  paidSumCents,
  totalSumCents,
  onClose,
  onMarkPaid,
  markingPayableId
}) {
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
            Close
          </button>
        </div>

        {holidayNames.length > 0 ? (
          <p className="mb-4 text-sm text-muted-foreground">{holidayNames.join(', ')}</p>
        ) : null}

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">Unpaid subtotal</p>
            <p className="text-sm font-medium">{formatValue(unpaidSumCents)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">Paid subtotal</p>
            <p className="text-sm font-medium">{formatValue(paidSumCents)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted-foreground">Global total</p>
            <p className="text-sm font-medium">{formatValue(totalSumCents)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Unpaid payables ({unpaidItems.length})</h4>
            {unpaidItems.length === 0 ? (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                No unpaid payables for this date.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">History</th>
                      <th className="px-3 py-2 font-medium">Account</th>
                      <th className="px-3 py-2 font-medium">Due date</th>
                      <th className="px-3 py-2 font-medium">Preferred date</th>
                      <th className="px-3 py-2 font-medium">Value</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidItems.map((payable) => (
                      <tr key={payable.id} className="border-t border-border">
                        <td className="px-3 py-2">{payable.history || '-'}</td>
                        <td className="px-3 py-2">{payable.account_id || '-'}</td>
                        <td className="px-3 py-2">{payable.due_date || '-'}</td>
                        <td className="px-3 py-2">{payable.preferred_date || '-'}</td>
                        <td className="px-3 py-2">{formatValue(payable.value)}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => onMarkPaid(payable)}
                            className="h-8 rounded-md bg-primary px-2 text-xs text-primary-foreground"
                            disabled={markingPayableId === payable.id}
                          >
                            {markingPayableId === payable.id ? 'Marking...' : 'Mark paid'}
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
            <h4 className="mb-2 text-sm font-medium">Paid payables ({paidItems.length})</h4>
            {paidItems.length === 0 ? (
              <div className="rounded-md border border-border p-3 text-sm text-muted-foreground">
                No paid payables for this date.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">History</th>
                      <th className="px-3 py-2 font-medium">Account</th>
                      <th className="px-3 py-2 font-medium">Due date</th>
                      <th className="px-3 py-2 font-medium">Preferred date</th>
                      <th className="px-3 py-2 font-medium">Value</th>
                      <th className="px-3 py-2 font-medium">Paid at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidItems.map((payable) => (
                      <tr key={payable.id} className="border-t border-border">
                        <td className="px-3 py-2">{payable.history || '-'}</td>
                        <td className="px-3 py-2">{payable.account_id || '-'}</td>
                        <td className="px-3 py-2">{payable.due_date || '-'}</td>
                        <td className="px-3 py-2">{payable.preferred_date || '-'}</td>
                        <td className="px-3 py-2">{formatValue(payable.value)}</td>
                        <td className="px-3 py-2">{payable.paid_at || '-'}</td>
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
