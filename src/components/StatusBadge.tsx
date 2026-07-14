import { STATUS_META, SEVERITIES } from '../data/categories'
import type { IssueStatus, Severity } from '../data/categories'
import { tStatus } from '../lib/i18n'
import { useTranslation } from 'react-i18next'

export function StatusBadge({ status }: { status: IssueStatus }) {
  useTranslation() // re-render on language change
  const meta = STATUS_META[status]
  return (
    <span className="chip" style={{ color: meta.color, backgroundColor: meta.bg }}>
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: meta.color }}
      />
      {tStatus(status)}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const { t } = useTranslation()
  const meta = SEVERITIES[severity]
  return (
    <span
      className="chip border"
      style={{
        color: meta.color,
        borderColor: meta.color + '55',
        backgroundColor: meta.color + '12',
      }}
    >
      {t(`severities.${severity}`)}
    </span>
  )
}
