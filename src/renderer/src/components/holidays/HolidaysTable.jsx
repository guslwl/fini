import { Edit, Trash2 } from 'lucide-react'

function boolText(value) {
  return value ? 'Yes' : 'No'
}

function HolidaysTable({ rows, isLoading, onEdit, onDelete }) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 text-sm text-muted-foreground">
        Loading holidays...
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
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Business Day</th>
              <th className="px-4 py-3 font-medium">Count As Business Day</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No holidays found for the current filters.
                </td>
              </tr>
            ) : (
              rows.map((holiday) => (
                <tr key={holiday.id} className="border-t border-border">
                  <td className="px-4 py-3">{holiday.description}</td>
                  <td className="px-4 py-3">{holiday.date || '-'}</td>
                  <td className="px-4 py-3">{holiday.type || '-'}</td>
                  <td className="px-4 py-3">{boolText(holiday.is_business_day)}</td>
                  <td className="px-4 py-3">{boolText(holiday.should_count_as_business_day)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(holiday)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
                        title="Edit holiday"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(holiday)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-destructive/10 hover:text-destructive"
                        title="Delete holiday"
                      >
                        <Trash2 className="h-4 w-4" />
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

export default HolidaysTable
