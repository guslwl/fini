import { centsToDecimalString } from '@/lib/utils'

function formatValue(value) {
  const formatted = centsToDecimalString(value)

  if (!formatted) {
    return '-'
  }

  return `$ ${formatted}`
}

function formatDueDay(dueDay) {
  if (!Number.isInteger(dueDay)) {
    return '-'
  }

  return String(dueDay)
}

function RecurringTable({ rows, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
        Loading recurring payables...
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Due day</th>
              <th className="px-4 py-3 font-medium">Should postpone</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No recurring payables found.
                </td>
              </tr>
            ) : (
              rows.map((recurring) => (
                <tr key={recurring.id} className="border-t border-border">
                  <td className="px-4 py-3">{recurring.history}</td>
                  <td className="px-4 py-3">{formatDueDay(recurring.due_day)}</td>
                  <td className="px-4 py-3">{recurring.should_postpone ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{formatValue(recurring.value)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(recurring)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(recurring)}
                        className="h-8 rounded-md border border-border px-2 text-xs"
                      >
                        Delete
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
