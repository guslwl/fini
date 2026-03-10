import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

function DeleteConfirmDialog({ open, onCancel, onConfirm, holidayDescription }) {
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    function handleEscapeKey(event) {
      if (event.key !== 'Escape') {
        return
      }

      event.preventDefault()

      if (!isDeleting) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleEscapeKey)

    return () => {
      window.removeEventListener('keydown', handleEscapeKey)
    }
  }, [open, isDeleting, onCancel])

  if (!open) {
    return null
  }

  function handleCancel() {
    if (isDeleting) {
      return
    }

    onCancel()
  }

  async function handleConfirmDelete() {
    setIsDeleting(true)
    try {
      await onConfirm()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleCancel()
        }
      }}
    >
      <div className="w-full max-w-sm rounded-lg border border-border bg-background p-5 shadow-lg">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Delete holiday</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{holidayDescription}&quot;?
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="h-9 rounded-md border border-border px-3 text-sm"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            className="h-9 rounded-md bg-destructive px-3 text-sm text-primary-foreground"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmDialog
