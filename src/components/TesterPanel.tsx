import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  FlaskConical,
  X,
  Database,
  Cloud,
  HardDrive,
  Sparkles,
  RotateCcw,
  LogOut,
  Users,
  Building2,
  ChevronRight,
  Beaker,
  ShieldCheck,
} from 'lucide-react'
import { DEPARTMENT_LIST } from '../data/categories'
import { hasSupabase, testerAllowed, type BackendKind } from '../lib/config'
import { useTestMode } from '../store/testMode'
import { useAuth } from '../store/auth'
import { useIssues } from '../store/issues'
import { api as mockApi } from '../services/api'
import { cn } from '../lib/cn'

/**
 * Tester Mode — a developer control panel to exercise every flow before wiring
 * real keys or deploying. Visible in dev automatically, and in prod only when
 * explicitly enabled (VITE_ENABLE_TESTER=true or ?tester=1). Never shown to
 * ordinary end-users in a normal production build.
 */
export function TesterPanel() {
  const [allowed] = useState(() => testerAllowed())
  const { panelOpen, setPanelOpen, backend, setBackend, mockAi, setMockAi } =
    useTestMode()
  const { user, loginPublic, loginStakeholder, loginAdmin, logout } = useAuth()
  const refresh = useIssues((s) => s.refresh)
  const navigate = useNavigate()

  if (!allowed) return null

  const asAdmin = () => {
    logout()
    loginAdmin('Test Administrator')
    toast.success('Now: Administrator')
    navigate('/admin')
    setPanelOpen(false)
  }

  const asPublic = () => {
    logout()
    loginPublic('Test Citizen', '9999900000')
    toast.success('Now: Test Citizen (public)')
    navigate('/report')
    setPanelOpen(false)
  }

  const asDept = (id: (typeof DEPARTMENT_LIST)[number]['id'], name: string) => {
    logout()
    loginStakeholder(id, name + ' Officer', 'Duty Officer')
    toast.success(`Now: ${name} stakeholder`)
    navigate('/dashboard')
    setPanelOpen(false)
  }

  const reseed = async () => {
    await mockApi.reset()
    await refresh()
    toast.success('Mock data reset & reseeded')
  }

  const switchBackend = (b: BackendKind) => {
    if (b === 'supabase' && !hasSupabase) {
      toast.error('Add Supabase keys to .env first')
      return
    }
    setBackend(b)
    logout()
    refresh()
    toast.success(`Backend: ${b}`)
  }

  return (
    <>
      {/* Launcher */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="fixed bottom-4 left-4 z-[60] inline-flex items-center gap-2 rounded-full bg-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-lift transition-transform hover:scale-105"
          title="Open Tester Mode"
        >
          <FlaskConical className="h-4 w-4" />
          Tester
        </button>
      )}

      {/* Panel */}
      {panelOpen && (
        <div className="fixed bottom-4 left-4 z-[60] w-[340px] max-w-[calc(100vw-2rem)] animate-fade-in overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          <div className="flex items-center justify-between bg-fuchsia-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              <span className="text-sm font-bold">Tester Mode</span>
            </div>
            <button onClick={() => setPanelOpen(false)} aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-4">
            {/* Status */}
            <Section title="Status">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <StatusRow
                  icon={backend === 'supabase' ? Cloud : HardDrive}
                  label="Backend"
                  value={backend === 'supabase' ? 'Supabase' : 'Mock'}
                  tone={backend === 'supabase' ? 'green' : 'slate'}
                />
                <StatusRow
                  icon={Sparkles}
                  label="AI"
                  value={mockAi ? 'Mocked' : 'Live proxy'}
                  tone={mockAi ? 'amber' : 'green'}
                />
              </div>
              <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Logged in as:{' '}
                <span className="font-semibold text-ink-900">
                  {user ? `${user.name} (${user.role})` : 'nobody'}
                </span>
              </div>
            </Section>

            {/* Quick login */}
            <Section title="Instant login (no credentials)">
              <button onClick={asPublic} className="tester-item">
                <Users className="h-4 w-4 text-saffron-600" />
                <span className="flex-1 text-left">As General Public</span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
              <button onClick={asAdmin} className="tester-item mt-1.5">
                <ShieldCheck className="h-4 w-4 text-ink-700" />
                <span className="flex-1 text-left">As Administrator</span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
              </button>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {DEPARTMENT_LIST.map((d) => {
                  const Icon = d.icon
                  return (
                    <button
                      key={d.id}
                      onClick={() => asDept(d.id, d.short)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-ink-800 hover:bg-slate-50"
                    >
                      <Icon
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: d.color }}
                      />
                      <span className="truncate">{d.short}</span>
                    </button>
                  )
                })}
              </div>
              {user && (
                <button
                  onClick={() => {
                    logout()
                    toast.success('Logged out')
                    navigate('/')
                  }}
                  className="tester-item mt-1.5 text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="flex-1 text-left">Log out</span>
                </button>
              )}
            </Section>

            {/* Backend switch */}
            <Section title="Backend">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
                {(['mock', 'supabase'] as BackendKind[]).map((b) => (
                  <button
                    key={b}
                    onClick={() => switchBackend(b)}
                    className={cn(
                      'flex-1 rounded-md py-1.5 capitalize transition-colors',
                      backend === b
                        ? 'bg-white text-ink-900 shadow-sm'
                        : 'text-slate-500'
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
              {!hasSupabase && (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Supabase keys not found in <code>.env</code> — mock only.
                </p>
              )}
            </Section>

            {/* AI toggle */}
            <Section title="AI assist">
              <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-ink-800">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Mock AI (no API call)
                </span>
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-500"
                  checked={mockAi}
                  onChange={(e) => setMockAi(e.target.checked)}
                />
              </label>
              <p className="mt-1.5 text-[11px] text-slate-500">
                On = instant canned suggestions. Off = calls the /api/analyze
                Gemini proxy (needs a deployed function + key).
              </p>
            </Section>

            {/* Data */}
            <Section title="Data (mock backend)">
              <button onClick={reseed} className="tester-item">
                <RotateCcw className="h-4 w-4 text-slate-500" />
                <span className="flex-1 text-left">Reset & reseed demo data</span>
              </button>
              <button
                onClick={() => {
                  refresh()
                  toast.success('Reloaded issues')
                }}
                className="tester-item mt-1"
              >
                <Database className="h-4 w-4 text-slate-500" />
                <span className="flex-1 text-left">Reload issues</span>
              </button>
            </Section>

            {/* Jump */}
            <Section title="Jump to">
              <div className="grid grid-cols-2 gap-1.5 text-xs font-semibold">
                {[
                  ['/', 'Landing'],
                  ['/report', 'Report'],
                  ['/dashboard', 'Dashboard'],
                  ['/admin', 'Admin'],
                  ['/analytics', 'Analytics'],
                  ['/my-issues', 'My Reports'],
                ].map(([to, label]) => (
                  <button
                    key={to}
                    onClick={() => {
                      navigate(to)
                      setPanelOpen(false)
                    }}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-ink-800 hover:bg-slate-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </Section>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Building2 className="h-3 w-3" />
              Dev-only tools. Hidden from end-users in production builds.
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      {children}
    </div>
  )
}

function StatusRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Cloud
  label: string
  value: string
  tone: 'green' | 'amber' | 'slate'
}) {
  const tones = {
    green: 'text-ashoka-600 bg-ashoka-500/10',
    amber: 'text-amber-600 bg-amber-500/10',
    slate: 'text-slate-600 bg-slate-100',
  }
  return (
    <div className={cn('flex items-center gap-2 rounded-lg px-2.5 py-2', tones[tone])}>
      <Icon className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase opacity-70">{label}</div>
        <div className="truncate text-xs font-bold">{value}</div>
      </div>
    </div>
  )
}
