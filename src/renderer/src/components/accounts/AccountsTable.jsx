import { Archive, ArchiveRestore, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

function buildTree(accounts) {
  const byId = new Map(accounts.map((a) => [a.id, a]))
  const childrenOf = new Map()
  const roots = []

  for (const account of accounts) {
    if (account.parent_id == null || !byId.has(account.parent_id)) {
      roots.push(account)
    } else {
      if (!childrenOf.has(account.parent_id)) childrenOf.set(account.parent_id, [])
      childrenOf.get(account.parent_id).push(account)
    }
  }

  function flatten(node, depth) {
    const children = (childrenOf.get(node.id) ?? []).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
    return [
      { ...node, depth, hasChildren: children.length > 0 },
      ...children.flatMap((child) => flatten(child, depth + 1))
    ]
  }

  return roots
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((root) => flatten(root, 0))
}

// Tailwind needs full class names — generate statically
const INDENT_CLASS = ['pl-2', 'pl-6', 'pl-10', 'pl-14', 'pl-18', 'pl-22']

export default function AccountsTable({
  accounts,
  visibleColumns,
  isLoading,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete
}) {
  const { t } = useTranslation('accounts')
  const [collapsed, setCollapsed] = useState(new Set())

  function toggle(id) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const OPTIONAL_COLS = [
    { id: 'code', header: t('table.headers.code'), render: (n) => n.code ?? '—' },
    {
      id: 'category',
      header: t('table.headers.category'),
      render: (n) => t(`categories.${n.category}`)
    },
    { id: 'type', header: t('table.headers.type'), render: (n) => t(`types.${n.type}`) },
    { id: 'currency', header: t('table.headers.currency'), render: (n) => n.currency }
  ]

  const activeCols = OPTIONAL_COLS.filter((c) => visibleColumns[c.id])
  const colSpan = 1 + activeCols.length + 1

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-lg border bg-background">
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t('table.loading')}</p>
      </div>
    )
  }

  const flatTree = buildTree(accounts)

  const hidden = new Set()
  for (const node of flatTree) {
    if (node.parent_id != null && (hidden.has(node.parent_id) || collapsed.has(node.parent_id))) {
      hidden.add(node.id)
    }
  }

  const visibleRows = flatTree.filter((node) => !hidden.has(node.id))

  return (
    <div className="overflow-hidden rounded-lg border bg-background">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="px-4 py-3 text-left font-medium">{t('table.headers.name')}</th>
            {activeCols.map((col) => (
              <th key={col.id} className="px-4 py-3 text-left font-medium">
                {col.header}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium">{t('table.headers.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="px-4 py-6 text-center text-muted-foreground">
                {t('table.empty')}
              </td>
            </tr>
          ) : (
            visibleRows.map((node) => (
              <tr
                key={node.id}
                className="border-t border-border cursor-pointer select-none hover:bg-muted/30"
                onDoubleClick={() => onEdit(node)}
              >
                <td
                  className={`py-3 pr-4 ${INDENT_CLASS[Math.min(node.depth, INDENT_CLASS.length - 1)]}`}
                >
                  <div className="flex items-center gap-1">
                    {node.hasChildren ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggle(node.id)
                        }}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        {collapsed.has(node.id) ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center text-xs text-muted-foreground/40 select-none">
                        –
                      </span>
                    )}
                    <span
                      className={[
                        node.type === 'group' ? 'font-medium' : '',
                        node.archived_at ? 'text-muted-foreground' : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {node.name}
                    </span>
                    {node.archived_at ? (
                      <span className="ml-1 rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {t('badges.archived')}
                      </span>
                    ) : null}
                  </div>
                </td>
                {activeCols.map((col) => (
                  <td key={col.id} className="px-4 py-3 text-muted-foreground">
                    {col.render(node)}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {node.archived_at ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUnarchive(node)
                        }}
                        className="h-8 rounded-md border px-2 text-xs hover:bg-muted"
                      >
                        <ArchiveRestore className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onArchive(node)
                        }}
                        className="h-8 rounded-md border px-2 text-xs hover:bg-muted"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(node)
                      }}
                      className="h-8 rounded-md border px-2 text-xs hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
