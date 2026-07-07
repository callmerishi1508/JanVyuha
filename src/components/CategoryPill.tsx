import { CATEGORIES, type CategoryId } from '../data/categories'
import { tCategory } from '../lib/i18n'
import { useTranslation } from 'react-i18next'

export function CategoryPill({
  category,
  size = 'sm',
}: {
  category: CategoryId
  size?: 'sm' | 'md'
}) {
  useTranslation() // re-render on language change
  const c = CATEGORIES[category]
  const Icon = c.icon
  const dim = size === 'md' ? 'text-sm px-3 py-1.5' : 'text-xs px-2.5 py-1'
  return (
    <span
      className={`chip ${dim}`}
      style={{ color: c.color, backgroundColor: c.color + '14' }}
    >
      <Icon className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />
      {tCategory(category)}
    </span>
  )
}

/** Square icon tile used for category grids. */
export function CategoryIconTile({
  category,
  className = 'h-11 w-11',
}: {
  category: CategoryId
  className?: string
}) {
  const c = CATEGORIES[category]
  const Icon = c.icon
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-xl ${className}`}
      style={{ backgroundColor: c.color + '18', color: c.color }}
    >
      <Icon className="h-1/2 w-1/2" />
    </div>
  )
}
