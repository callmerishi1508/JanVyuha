import { Component, type ReactNode } from 'react'

/**
 * App-wide safety net. Without this, any uncaught render error blanks the whole
 * page (white screen) — a bad look mid-demo. This catches it and shows a
 * friendly, recoverable fallback instead. i18n is intentionally NOT used here:
 * the boundary must render even if the failure is in the i18n layer itself.
 */
interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Best-effort logging; a real deployment can wire this to a client logger.
    console.error('Unhandled UI error:', error, info)
  }

  private reset = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
        <div className="max-w-md">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-600">
            <svg
              className="h-8 w-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-slate-600">
            An unexpected error interrupted the page. Your data is safe — please
            reload to continue.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Reload page
            </button>
            <a
              href="/"
              onClick={this.reset}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
