import {
  Flame,
  Car,
  UserSearch,
  Trees,
  Construction,
  Volume2,
  Zap,
  Droplets,
  HeartPulse,
  Trash2,
  PawPrint,
  type LucideIcon,
} from 'lucide-react'

/** The government departments that act on issues (a.k.a. stakeholders). */
export type DepartmentId =
  'fire' | 'ambulance' | 'police' | 'municipal' | 'electricity' | 'water' | 'animal'

export interface Department {
  id: DepartmentId
  name: string
  short: string
  authority: string
  color: string
  icon: LucideIcon
  helpline: string
}

export const DEPARTMENTS: Record<DepartmentId, Department> = {
  fire: {
    id: 'fire',
    name: 'Fire & Emergency Services',
    short: 'Fire Services',
    authority: 'State Fire Services Department',
    color: '#e0392b',
    icon: Flame,
    helpline: '101',
  },
  ambulance: {
    id: 'ambulance',
    name: 'Medical & Ambulance Services',
    short: 'Medical / 108',
    authority: 'Emergency Medical Services (EMRI 108)',
    color: '#d81b60',
    icon: HeartPulse,
    helpline: '108',
  },
  police: {
    id: 'police',
    name: 'Police Department',
    short: 'Police',
    authority: 'State Police / Commissionerate',
    color: '#1f2a52',
    icon: UserSearch,
    helpline: '100',
  },
  municipal: {
    id: 'municipal',
    name: 'Municipal Corporation & Public Works',
    short: 'Municipal / PWD',
    authority: 'Urban Local Body & PWD',
    color: '#0f8a4f',
    icon: Construction,
    // National urban-services / municipal grievance helpline. Swap for the
    // target city's ULB control-room number on a specific state rollout.
    helpline: '1913',
  },
  electricity: {
    id: 'electricity',
    name: 'State Electricity Board',
    short: 'Electricity',
    authority: 'State Power Distribution Company',
    color: '#f2a007',
    icon: Zap,
    helpline: '1912',
  },
  water: {
    id: 'water',
    name: 'Water Supply & Sewerage Board',
    short: 'Water Board',
    authority: 'Municipal Water Works',
    color: '#0277bd',
    icon: Droplets,
    helpline: '1916',
  },
  animal: {
    id: 'animal',
    name: 'Animal Welfare & Veterinary Services',
    short: 'Animal Welfare',
    authority: 'Dept. of Animal Husbandry & Veterinary',
    color: '#8d6e63',
    icon: PawPrint,
    helpline: '1962',
  },
}

export const DEPARTMENT_LIST: Department[] = Object.values(DEPARTMENTS)

/** Runtime guard for values read from untyped sources (DB rows, API responses). */
export function isDepartmentId(v: unknown): v is DepartmentId {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(DEPARTMENTS, v)
}

/** Issue categories the public can report. */
export type CategoryId =
  | 'fire'
  | 'road_accident'
  | 'missing_person'
  | 'tree_fall'
  | 'road_damage'
  | 'public_nuisance'
  | 'electricity'
  | 'water'
  | 'medical'
  | 'garbage'

/**
 * A department that MAY be involved depending on the specifics of the incident.
 * The AI (and a keyword fallback) decide whether it's likely; the citizen makes
 * the final call in the report wizard — so no wrong department is ever alerted.
 */
export interface ConditionalDept {
  department: DepartmentId
  /** Why this department is involved (shown when it's included). */
  reason: string
  /** Plain-language question asked when it's uncertain. */
  question: string
  /** Keywords in the description that strongly imply this department applies. */
  keywords: string[]
  /** Pre-selected by default (e.g. life-safety for emergencies). */
  defaultOn?: boolean
}

export interface Category {
  id: CategoryId
  name: string
  description: string
  icon: LucideIcon
  color: string
  emergency: boolean
  /** Always alerted for this category. */
  core: DepartmentId[]
  /** Context-dependent departments — included only when warranted/confirmed. */
  conditional: ConditionalDept[]
}

/**
 * CATEGORIES is the single source of truth for routing. Each issue reaches its
 * `core` departments plus any `conditional` departments the context warrants and
 * the citizen confirms — e.g. a *building* fire adds Ambulance (people at risk),
 * while a *tree* on fire does not, unless animals are affected (Animal Welfare).
 */
export const CATEGORIES: Record<CategoryId, Category> = {
  fire: {
    id: 'fire',
    name: 'Fire Accident',
    description: 'Building, vehicle or forest fire; gas leak or explosion risk.',
    icon: Flame,
    color: '#e0392b',
    emergency: true,
    core: ['fire'],
    conditional: [
      {
        department: 'ambulance',
        reason: 'People may be injured, burnt or trapped',
        question: 'Are people injured, trapped or at risk?',
        keywords: [
          'people',
          'person',
          'injur',
          'trapped',
          'burn',
          'casualt',
          'resident',
          'child',
          'elderly',
          'hospital',
          'unconscious',
          'smoke inhalation',
          'building',
          'house',
          'flat',
          'apartment',
        ],
        defaultOn: true,
      },
      {
        department: 'electricity',
        reason: 'Fire may involve electrical wiring or a transformer',
        question: 'Is the fire near electric wires or a transformer?',
        keywords: [
          'wire',
          'transformer',
          'electric',
          'short circuit',
          'pole',
          'current',
          'cable',
        ],
      },
      {
        department: 'police',
        reason: 'Crowd control, evacuation or cordon',
        question: 'Is crowd control or evacuation needed?',
        keywords: ['crowd', 'evacuat', 'cordon', 'traffic', 'stampede', 'public'],
      },
      {
        department: 'municipal',
        reason: 'Debris clearance or water for firefighting',
        question: 'Is debris clearance or extra water needed?',
        keywords: ['debris', 'collapse', 'building collapse', 'blocked'],
      },
      {
        department: 'animal',
        reason: 'Animals may be affected or trapped',
        question: 'Are animals affected or trapped?',
        keywords: ['animal', 'cattle', 'dog', 'cow', 'livestock', 'pet', 'stray', 'bird'],
      },
    ],
  },
  road_accident: {
    id: 'road_accident',
    name: 'Road Accident',
    description: 'Vehicle collision, injuries or traffic obstruction.',
    icon: Car,
    color: '#d81b60',
    emergency: true,
    core: ['police', 'ambulance'],
    conditional: [
      {
        department: 'fire',
        reason: 'Vehicle fire or people trapped needing rescue',
        question: 'Is there a vehicle fire or someone trapped?',
        keywords: ['fire', 'trapped', 'rescue', 'overturned', 'crush', 'burning'],
      },
      {
        department: 'municipal',
        reason: 'Debris or road damage to clear',
        question: 'Is there debris or road damage?',
        keywords: ['debris', 'pothole', 'divider', 'road damage', 'oil spill'],
      },
      {
        department: 'electricity',
        reason: 'A vehicle hit a pole or live wires',
        question: 'Did the vehicle hit a pole or wires?',
        keywords: ['pole', 'wire', 'transformer', 'electric'],
      },
      {
        department: 'animal',
        reason: 'An animal was involved or injured',
        question: 'Was an animal involved or injured?',
        keywords: ['animal', 'cattle', 'cow', 'dog', 'stray'],
      },
    ],
  },
  missing_person: {
    id: 'missing_person',
    name: 'Missing Person',
    description: 'Report a missing child, adult or senior citizen.',
    icon: UserSearch,
    color: '#5e35b1',
    emergency: true,
    core: ['police'],
    conditional: [
      {
        department: 'ambulance',
        reason: 'A vulnerable person may need medical help when found',
        question: 'Is the person medically vulnerable (child/elderly/ill)?',
        keywords: [
          'elderly',
          'child',
          'senior',
          'patient',
          'medical',
          'disabled',
          'ill',
          'alzheimer',
          'dementia',
          'wheelchair',
        ],
      },
    ],
  },
  medical: {
    id: 'medical',
    name: 'Medical Emergency',
    description: 'Someone needs urgent medical help or an ambulance.',
    icon: HeartPulse,
    color: '#c2185b',
    emergency: true,
    core: ['ambulance'],
    conditional: [
      {
        department: 'police',
        reason: 'Possible assault, crime or law-and-order need',
        question: 'Is this due to violence or a crime?',
        keywords: [
          'assault',
          'attack',
          'stab',
          'beaten',
          'crime',
          'violence',
          'poison',
          'suicide',
          'fight',
        ],
      },
      {
        department: 'fire',
        reason: 'Rescue or extrication may be needed',
        question: 'Is rescue or extrication needed?',
        keywords: ['trapped', 'rescue', 'drown', 'height', 'stuck', 'well'],
      },
    ],
  },
  tree_fall: {
    id: 'tree_fall',
    name: 'Tree Fall',
    description: 'Fallen tree or branch blocking a road or footpath.',
    icon: Trees,
    color: '#2e7d32',
    emergency: false,
    core: ['municipal'],
    conditional: [
      {
        department: 'fire',
        reason: 'Tree on fire, or a rescue from the fallen tree',
        question: 'Is the tree on fire or is someone trapped?',
        keywords: ['fire', 'burning', 'flame', 'trapped', 'rescue'],
      },
      {
        department: 'electricity',
        reason: 'The tree fell on electric lines',
        question: 'Did the tree fall on electric wires or poles?',
        keywords: ['wire', 'line', 'pole', 'electric', 'cable', 'power'],
      },
      {
        department: 'police',
        reason: 'Traffic diversion for a blocked road',
        question: 'Is traffic blocked and needing diversion?',
        keywords: ['traffic', 'road blocked', 'highway', 'jam', 'diversion', 'blocking'],
      },
      {
        department: 'ambulance',
        reason: 'Someone was injured by the tree',
        question: 'Is anyone injured?',
        keywords: ['injur', 'hurt', 'person', 'people', 'hit', 'trapped'],
      },
      {
        department: 'animal',
        reason: 'Animals hurt or trapped by the tree',
        question: 'Are animals hurt or trapped?',
        keywords: ['animal', 'cattle', 'dog', 'cow', 'bird', 'livestock', 'pet'],
      },
    ],
  },
  road_damage: {
    id: 'road_damage',
    name: 'Road Damage',
    description: 'Potholes, broken road, damaged flyover or footpath.',
    icon: Construction,
    color: '#6d4c41',
    emergency: false,
    core: ['municipal'],
    conditional: [
      {
        department: 'police',
        reason: 'Traffic hazard / accident risk',
        question: 'Is it causing a traffic hazard or accidents?',
        keywords: ['accident', 'traffic', 'hazard', 'skid', 'highway'],
      },
      {
        department: 'water',
        reason: 'A water leak or drain is causing the damage',
        question: 'Is a water leak or drain causing the damage?',
        keywords: ['water', 'leak', 'drain', 'sewage', 'flood'],
      },
    ],
  },
  public_nuisance: {
    id: 'public_nuisance',
    name: 'Public Nuisance',
    description: 'Illegal encroachment, loud disturbance or unsafe activity.',
    icon: Volume2,
    color: '#455a64',
    emergency: false,
    core: ['police'],
    conditional: [
      {
        department: 'municipal',
        reason: 'Encroachment, illegal structure or cleanup',
        question: 'Does it involve encroachment or cleanup?',
        keywords: [
          'encroach',
          'illegal',
          'structure',
          'garbage',
          'stall',
          'vendor',
          'dump',
          'construction',
        ],
      },
    ],
  },
  electricity: {
    id: 'electricity',
    name: 'Electricity Issue',
    description: 'Power outage, sparking line, or fallen electric pole.',
    icon: Zap,
    color: '#f2a007',
    emergency: false,
    core: ['electricity'],
    conditional: [
      {
        department: 'fire',
        reason: 'Sparking or fire risk from the fault',
        question: 'Is there sparking or a fire risk?',
        keywords: ['spark', 'fire', 'smoke', 'burning', 'short circuit'],
      },
      {
        department: 'ambulance',
        reason: 'Someone was electrocuted or injured',
        question: 'Has someone been electrocuted or injured?',
        keywords: ['shock', 'electrocut', 'injur', 'person', 'unconscious', 'died'],
      },
      {
        department: 'municipal',
        reason: 'A fallen pole is blocking the road',
        question: 'Is a fallen pole blocking the road?',
        keywords: ['pole fell', 'fallen pole', 'blocked', 'road', 'tree'],
      },
    ],
  },
  water: {
    id: 'water',
    name: 'Water Issue',
    description: 'Pipeline burst, contamination, or no water supply.',
    icon: Droplets,
    color: '#0277bd',
    emergency: false,
    core: ['water'],
    conditional: [
      {
        department: 'municipal',
        reason: 'Road flooding or drainage cleanup',
        question: 'Is it flooding the road or a drainage issue?',
        keywords: ['flood', 'road', 'drain', 'overflow', 'sewage'],
      },
      {
        department: 'electricity',
        reason: 'Water near electric lines (shock risk)',
        question: 'Is water near electric lines or poles?',
        keywords: ['electric', 'pole', 'wire', 'current', 'shock'],
      },
    ],
  },
  garbage: {
    id: 'garbage',
    name: 'Sanitation / Garbage',
    description: 'Uncollected garbage, blocked drain or open sewage.',
    icon: Trash2,
    color: '#00897b',
    emergency: false,
    core: ['municipal'],
    conditional: [
      {
        department: 'water',
        reason: 'A blocked drain or sewage overflow',
        question: 'Is a drain blocked or sewage overflowing?',
        keywords: ['drain', 'sewage', 'overflow', 'water'],
      },
      {
        department: 'animal',
        reason: 'Stray animals or a dead animal / carcass',
        question: 'Are stray or dead animals involved?',
        keywords: ['stray', 'dog', 'animal', 'dead animal', 'carcass', 'cattle'],
      },
    ],
  },
}

export const CATEGORY_LIST: Category[] = Object.values(CATEGORIES)

/** Runtime guard for values read from untyped sources (DB rows, API responses). */
export function isCategoryId(v: unknown): v is CategoryId {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(CATEGORIES, v)
}

/** Every department that could ever be involved in a category (core + conditional). */
export function possibleDepartments(catId: CategoryId): DepartmentId[] {
  const c = CATEGORIES[catId]
  return Array.from(new Set([...c.core, ...c.conditional.map((x) => x.department)]))
}

/** The departments alerted by default before any context is applied (core + defaultOn). */
export function defaultDepartments(catId: CategoryId): DepartmentId[] {
  const c = CATEGORIES[catId]
  return Array.from(
    new Set([
      ...c.core,
      ...c.conditional.filter((x) => x.defaultOn).map((x) => x.department),
    ])
  )
}

/** Which categories a department could be responsible for (reverse lookup). */
export function categoriesForDepartment(dept: DepartmentId): Category[] {
  return CATEGORY_LIST.filter((c) => possibleDepartments(c.id).includes(dept))
}

export interface ResolvedConditional {
  department: DepartmentId
  reason: string
  question: string
  /** A signal (AI or keyword) suggested this department applies. */
  matched: boolean
  /** Initial checkbox state in the wizard. */
  selected: boolean
}

export interface RoutingDecision {
  core: DepartmentId[]
  conditional: ResolvedConditional[]
}

/**
 * Decide routing for an incident. `core` is always included; each conditional
 * department is pre-selected when the AI suggested it or a keyword matched the
 * description. The citizen then confirms/toggles in the wizard, so only
 * approved departments are ever alerted.
 */
export function resolveRouting(
  catId: CategoryId,
  opts: { text?: string; aiDepartments?: DepartmentId[] } = {}
): RoutingDecision {
  const cat = CATEGORIES[catId]
  const text = (opts.text ?? '').toLowerCase()
  const ai = new Set(opts.aiDepartments ?? [])
  const conditional: ResolvedConditional[] = cat.conditional.map((c) => {
    const matched = ai.has(c.department) || c.keywords.some((k) => text.includes(k))
    return {
      department: c.department,
      reason: c.reason,
      question: c.question,
      matched,
      selected: matched || !!c.defaultOn,
    }
  })
  return { core: [...cat.core], conditional }
}

export type Severity = 'critical' | 'high' | 'moderate' | 'low'

export const SEVERITIES: Record<
  Severity,
  { label: string; color: string; rank: number }
> = {
  critical: { label: 'Critical', color: '#dc2626', rank: 4 },
  high: { label: 'High', color: '#ea580c', rank: 3 },
  moderate: { label: 'Moderate', color: '#ca8a04', rank: 2 },
  low: { label: 'Low', color: '#0f8a4f', rank: 1 },
}

export type IssueStatus = 'reported' | 'acknowledged' | 'in_progress' | 'resolved'

export const STATUS_FLOW: IssueStatus[] = [
  'reported',
  'acknowledged',
  'in_progress',
  'resolved',
]

export const STATUS_META: Record<
  IssueStatus,
  { label: string; color: string; bg: string }
> = {
  reported: { label: 'Reported', color: '#475569', bg: '#f1f5f9' },
  acknowledged: { label: 'Acknowledged', color: '#1d4ed8', bg: '#dbeafe' },
  in_progress: { label: 'In Progress', color: '#b45309', bg: '#fef3c7' },
  resolved: { label: 'Resolved', color: '#0f8a4f', bg: '#dcfce7' },
}

/**
 * Per-department action state. On a multi-department issue each routed
 * department progresses independently, so one department finishing does not
 * remove the issue from another that is still working.
 */
export type DeptStatus = 'notified' | 'acknowledged' | 'responding' | 'done'

export const DEPT_STATUS_FLOW: DeptStatus[] = [
  'notified',
  'acknowledged',
  'responding',
  'done',
]

export const DEPT_STATUS_META: Record<
  DeptStatus,
  { label: string; color: string; bg: string }
> = {
  notified: { label: 'Notified', color: '#475569', bg: '#f1f5f9' },
  acknowledged: { label: 'Acknowledged', color: '#1d4ed8', bg: '#dbeafe' },
  responding: { label: 'Responding', color: '#b45309', bg: '#fef3c7' },
  done: { label: 'Completed', color: '#0f8a4f', bg: '#dcfce7' },
}

/** Map a per-department status to the equivalent overall issue status. */
const DEPT_TO_ISSUE: Record<DeptStatus, IssueStatus> = {
  notified: 'reported',
  acknowledged: 'acknowledged',
  responding: 'in_progress',
  done: 'resolved',
}

/**
 * Derive the overall issue status from every department's progress:
 * resolved only when ALL departments are done; otherwise the least-advanced
 * department's stage governs (so an issue stays "open" until everyone finishes).
 */
export function deriveIssueStatus(deptStatuses: { status: DeptStatus }[]): IssueStatus {
  if (deptStatuses.length === 0) return 'reported'
  if (deptStatuses.every((d) => d.status === 'done')) return 'resolved'
  // Rank by flow position; the minimum (least advanced) drives the headline,
  // but if some have started we surface "in progress".
  const ranks = deptStatuses.map((d) => DEPT_STATUS_FLOW.indexOf(d.status))
  const anyStarted = ranks.some((r) => r >= 2)
  const anyAck = ranks.some((r) => r >= 1)
  if (anyStarted) return 'in_progress'
  if (anyAck) return 'acknowledged'
  return DEPT_TO_ISSUE[DEPT_STATUS_FLOW[Math.min(...ranks)]]
}
