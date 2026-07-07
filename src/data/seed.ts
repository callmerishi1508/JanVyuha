import {
  CATEGORIES,
  defaultDepartments,
  type CategoryId,
  type DepartmentId,
  type DeptStatus,
  type IssueStatus,
} from './categories'
import type { DepartmentStatus, Issue, MediaItem } from './types'

/** Map a seed issue's headline status to a per-department status. */
const ISSUE_TO_DEPT: Record<IssueStatus, DeptStatus> = {
  reported: 'notified',
  acknowledged: 'acknowledged',
  in_progress: 'responding',
  resolved: 'done',
}

/** Gradient placeholder "media" so seeds render without external images. */
function placeholder(category: CategoryId, label: string): MediaItem {
  return {
    id: 'm_' + Math.random().toString(36).slice(2, 8),
    type: 'image',
    url: `gradient:${CATEGORIES[category].color}`,
    label,
  }
}

function minsAgo(mins: number): string {
  return new Date(Date.now() - mins * 60000).toISOString()
}

interface SeedSpec {
  title: string
  category: CategoryId
  description: string
  severity: Issue['severity']
  status: Issue['status']
  lat: number
  lng: number
  address: string
  city: string
  state: string
  reporter: string
  minsAgo: number
  upvotes: number
  /** Extra conditional departments this incident warrants beyond the defaults. */
  extraDepartments?: DepartmentId[]
}

const SPECS: SeedSpec[] = [
  {
    title: 'Fire in commercial complex near Ameerpet',
    category: 'fire',
    description:
      'Thick smoke and flames on the 2nd floor of a garment showroom near Ameerpet metro. Several shops on the same floor. People evacuating.',
    severity: 'critical',
    status: 'in_progress',
    lat: 17.4375,
    lng: 78.4483,
    address: 'Ameerpet, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    reporter: 'Anitha Rao',
    minsAgo: 12,
    upvotes: 34,
  },
  {
    title: 'Two-wheeler and car collision at Benz Circle',
    category: 'road_accident',
    description:
      'A bike rider is injured after colliding with a car at Benz Circle junction. Traffic building up towards the bypass.',
    severity: 'high',
    status: 'acknowledged',
    lat: 16.4977,
    lng: 80.6563,
    address: 'Benz Circle, Vijayawada',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    reporter: 'Mohan Krishna',
    minsAgo: 28,
    upvotes: 12,
  },
  {
    title: 'Elderly man missing since morning',
    category: 'missing_person',
    description:
      '72-year-old with memory loss left home around 7 AM wearing a white shirt. Last seen near Chennai Central station.',
    severity: 'high',
    status: 'reported',
    lat: 13.0827,
    lng: 80.2757,
    address: 'Chennai Central, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    reporter: 'Family member',
    minsAgo: 95,
    upvotes: 47,
  },
  {
    title: 'Large tree fallen across the road after rain',
    category: 'tree_fall',
    description:
      'A big rain tree has fallen and is completely blocking both lanes near KBR Park. Two-wheelers unable to pass.',
    severity: 'moderate',
    status: 'acknowledged',
    lat: 17.4239,
    lng: 78.43,
    address: 'KBR Park, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    reporter: 'Suresh Reddy',
    minsAgo: 140,
    upvotes: 20,
  },
  {
    title: 'Deep pothole causing accidents on the highway',
    category: 'road_damage',
    description:
      'A large pothole near Gajuwaka junction has caused several two-wheeler riders to skid. Needs urgent repair.',
    severity: 'moderate',
    status: 'reported',
    lat: 17.6868,
    lng: 83.2185,
    address: 'Gajuwaka, Visakhapatnam',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    reporter: 'Divya Sri',
    minsAgo: 220,
    upvotes: 63,
  },
  {
    title: 'Sparking electric pole near school',
    category: 'electricity',
    description:
      'An electric pole is sparking dangerously near a primary school entrance. Wires are hanging low. Very unsafe for children.',
    severity: 'high',
    status: 'in_progress',
    lat: 13.085,
    lng: 80.2101,
    address: 'Anna Nagar, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    reporter: 'Rajesh Kumar',
    minsAgo: 55,
    upvotes: 18,
  },
  {
    title: 'Water pipeline burst flooding the street',
    category: 'water',
    description:
      'A main pipeline has burst and clean water is being wasted, flooding the entire lane in Kukatpally.',
    severity: 'moderate',
    status: 'acknowledged',
    lat: 17.4849,
    lng: 78.4138,
    address: 'Kukatpally, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    reporter: 'Farhan Ahmed',
    minsAgo: 180,
    upvotes: 9,
  },
  {
    title: 'Garbage not collected for a week',
    category: 'garbage',
    description:
      'Overflowing garbage near the market is causing a foul smell and stray dogs. Not cleared for over a week.',
    severity: 'low',
    status: 'reported',
    lat: 16.51,
    lng: 80.62,
    address: 'Governorpet, Vijayawada',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    reporter: 'Lakshmi Devi',
    minsAgo: 300,
    upvotes: 26,
  },
  {
    title: 'Illegal loudspeakers past midnight',
    category: 'public_nuisance',
    description:
      'An event is using loudspeakers well past permitted hours, disturbing the entire residential area. Repeated issue.',
    severity: 'low',
    status: 'resolved',
    lat: 13.0418,
    lng: 80.2341,
    address: 'T. Nagar, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    reporter: 'Resident Welfare Assoc.',
    minsAgo: 1500,
    upvotes: 15,
  },
  {
    title: 'Medical emergency — collapse at metro station',
    category: 'medical',
    description:
      'A commuter has collapsed on the platform and is unresponsive. Bystanders providing first aid. Ambulance needed urgently.',
    severity: 'critical',
    status: 'resolved',
    lat: 17.4374,
    lng: 78.4487,
    address: 'Ameerpet Metro, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    reporter: 'Metro staff',
    minsAgo: 900,
    upvotes: 8,
  },
  {
    title: 'Injured cow hit by a truck on the highway',
    category: 'road_accident',
    description:
      'A speeding truck hit a stray cow on the service road near the Outer Ring Road. The animal is badly injured and lying on the road, also blocking traffic. Needs a veterinary rescue team.',
    severity: 'high',
    status: 'acknowledged',
    lat: 17.4126,
    lng: 78.2751,
    address: 'Outer Ring Road, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    reporter: 'Kiran Deshmukh',
    minsAgo: 65,
    upvotes: 21,
    extraDepartments: ['animal'],
  },
]

export function buildSeedIssues(): Issue[] {
  return SPECS.map((s, i) => {
    const created = minsAgo(s.minsAgo)
    const routed = Array.from(
      new Set([...defaultDepartments(s.category), ...(s.extraDepartments ?? [])])
    )
    const departmentStatus: DepartmentStatus[] = routed.map((department) => ({
      department,
      status: ISSUE_TO_DEPT[s.status],
      updatedBy:
        s.status === 'reported' ? undefined : 'Department Control Room',
      at: minsAgo(Math.max(1, s.minsAgo - 8)),
    }))
    const updates: Issue['updates'] = [
      {
        id: 'u_' + i + '_0',
        status: 'reported',
        note: 'Issue reported by citizen and routed to the concerned department(s).',
        by: 'JanVyuha System',
        at: created,
      },
    ]
    if (s.status !== 'reported') {
      updates.push({
        id: 'u_' + i + '_1',
        status: 'acknowledged',
        note: 'Report received and acknowledged by the department control room.',
        by: 'Department Control Room',
        at: minsAgo(Math.max(1, s.minsAgo - 8)),
      })
    }
    if (s.status === 'in_progress' || s.status === 'resolved') {
      updates.push({
        id: 'u_' + i + '_2',
        status: 'in_progress',
        note: 'Field team dispatched to the location.',
        by: 'Field Unit',
        at: minsAgo(Math.max(1, s.minsAgo - 15)),
      })
    }
    if (s.status === 'resolved') {
      updates.push({
        id: 'u_' + i + '_3',
        status: 'resolved',
        note: 'Issue resolved on ground and closed. Thank you for reporting.',
        by: 'Field Unit',
        at: minsAgo(Math.max(1, s.minsAgo - 40)),
      })
    }
    return {
      id: 'seed_' + i,
      refId: 'JV-' + (1000 + i),
      title: s.title,
      category: s.category,
      description: s.description,
      severity: s.severity,
      status: s.status,
      location: {
        lat: s.lat,
        lng: s.lng,
        address: s.address,
        city: s.city,
        state: s.state,
      },
      media: [placeholder(s.category, 'Reported photo')],
      reporterName: s.reporter,
      anonymous: false,
      routedDepartments: routed,
      departmentStatus,
      upvotes: s.upvotes,
      createdAt: created,
      updatedAt: updates[updates.length - 1].at,
      updates,
    }
  })
}
