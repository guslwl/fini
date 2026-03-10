import { centsToDecimalString } from '@/lib/utils'

function formatValue(value) {
  const formatted = centsToDecimalString(value)

  if (!formatted) {
    return '-'
  }

  return formatted
}

function effectiveDate(payable) {
  return payable.preferred_date || payable.due_date || ''
}

function PayablesTable({ rows, isLoading, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
        Loading payables...
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">History</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 font-medium">Preferred date</th>
              <th className="px-4 py-3 font-medium">Effective date</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Paid</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No payables found for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((payable) => (
                <tr key={payable.id} className="border-t border-border">
                  <td className="px-4 py-3">{payable.history}</td>
                  <td className="px-4 py-3">{payable.due_date || '-'}</td>
                  <td className="px-4 py-3">{payable.preferred_date || '-'}</td>
                  <td className="px-4 py-3">{effectiveDate(payable) || '-'}</td>
                  <td className="px-4 py-3">{formatValue(payable.value)}</td>
                  <td className="px-4 py-3">{payable.paid_at ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(payable)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(payable)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        Delete
                      </button>
                      {payable.paid_at ? (
                        <button
                          type="button"
                          onClick={() => onMarkUnpaid(payable)}
                          className="h-8 rounded-md border border-border px-2 text-xs"
                        >
                          Unpay
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onMarkPaid(payable)}
                          className="h-8 rounded-md bg-primary px-2 text-xs text-primary-foreground"
                        >
                          Mark paid
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
