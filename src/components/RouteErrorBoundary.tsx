import { Component, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Home } from 'lucide-react'

/**
 * Route-scoped safety net, wrapped around <Routes> in App.tsx (inside Header/
 * Footer, which stay live). Distinct from the app-wide `ErrorBoundary` in two
 * ways:
 *  1. It resets automatically when the pathname changes (navigating away
 *     recovers the app without a full reload) — see the `key` App.tsx passes.
 *  2. It recognises a lazy **chunk-load failure** (a stale hashed JS/CSS chunk
 *     from a previous deploy, common right after a redeploy on flaky mobile)
 *     and shows a distinct "a new version is available" message instead of
 *     the generic error, since re-rendering won't fix it — only a reload will.
 */
function isChunkLoadError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|loading chunk|importing a module script failed/i.test(
    msg
  )
}

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

class Boundary extends Component<Props & { t: (key: string) => string }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Route error:', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    const { t } = this.props
    const chunkFailure = isChunkLoadError(error)

    return (
      <div className="container-page grid place-items-center py-20 text-center">
        <div className="max-w-md">
          <h2 className="text-xl font-extrabold text-ink-900">
            {chunkFailure ? t('common.updateAvailable') : t('common.routeErrorTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {chunkFailure ? t('common.updateAvailableBody') : t('common.routeErrorBody')}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => window.location.reload()} className="btn-primary">
              <RefreshCw className="h-4 w-4" />
              {t('common.reloadPage')}
            </button>
            {!chunkFailure && (
              <a href="/" className="btn-outline">
                <Home className="h-4 w-4" />
                {t('common.goHome')}
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }
}

/**
 * Functional wrapper so we can use the translation hook (the class boundary
 * itself can't) and pass `key={pathname}` from the caller to force a reset on
 * navigation.
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  return <Boundary t={t}>{children}</Boundary>
}
