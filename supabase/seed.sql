-- ============================================================================
-- JanVyuha — optional demo data.
-- Run AFTER schema.sql. Safe to re-run (it clears prior demo rows first).
-- These rows have reporter_id = NULL (system-seeded); stakeholders see them
-- via routed_departments, and the public feed view exposes them read-only.
-- ============================================================================

-- Clear previous demo issues (ref ids JV-1000..JV-1009)
delete from public.issues where ref_id like 'JV-10%';

with demo(ref_id, title, category, description, severity, status,
          lat, lng, address, city, state, reporter_name, mins_ago, upvotes) as (
  values
  ('JV-1000','Fire in commercial complex near Ameerpet','fire',
   'Thick smoke and flames on the 2nd floor of a garment showroom near Ameerpet metro. People evacuating.',
   'critical','in_progress',17.4375,78.4483,'Ameerpet, Hyderabad','Hyderabad','Telangana','Anitha Rao',12,34),
  ('JV-1001','Two-wheeler and car collision at Benz Circle','road_accident',
   'A bike rider is injured after colliding with a car at Benz Circle junction. Traffic building up.',
   'high','acknowledged',16.4977,80.6563,'Benz Circle, Vijayawada','Vijayawada','Andhra Pradesh','Mohan Krishna',28,12),
  ('JV-1002','Elderly man missing since morning','missing_person',
   '72-year-old with memory loss left home at 7 AM in a white shirt. Last seen near Chennai Central.',
   'high','reported',13.0827,80.2757,'Chennai Central, Chennai','Chennai','Tamil Nadu','Family member',95,47),
  ('JV-1003','Large tree fallen across the road after rain','tree_fall',
   'A big rain tree has fallen and is blocking both lanes near KBR Park.',
   'moderate','acknowledged',17.4239,78.4300,'KBR Park, Hyderabad','Hyderabad','Telangana','Suresh Reddy',140,20),
  ('JV-1004','Deep pothole causing accidents on the highway','road_damage',
   'A large pothole near Gajuwaka junction has caused several two-wheeler riders to skid.',
   'moderate','reported',17.6868,83.2185,'Gajuwaka, Visakhapatnam','Visakhapatnam','Andhra Pradesh','Divya Sri',220,63),
  ('JV-1005','Sparking electric pole near school','electricity',
   'An electric pole is sparking near a primary school entrance. Wires hanging low.',
   'high','in_progress',13.0850,80.2101,'Anna Nagar, Chennai','Chennai','Tamil Nadu','Rajesh Kumar',55,18),
  ('JV-1006','Water pipeline burst flooding the street','water',
   'A main pipeline has burst and clean water is flooding the entire lane in Kukatpally.',
   'moderate','acknowledged',17.4849,78.4138,'Kukatpally, Hyderabad','Hyderabad','Telangana','Farhan Ahmed',180,9),
  ('JV-1007','Garbage not collected for a week','garbage',
   'Overflowing garbage near the market is causing a foul smell and stray dogs.',
   'low','reported',16.5100,80.6200,'Governorpet, Vijayawada','Vijayawada','Andhra Pradesh','Lakshmi Devi',300,26),
  ('JV-1008','Illegal loudspeakers past midnight','public_nuisance',
   'An event is using loudspeakers past permitted hours, disturbing the residential area.',
   'low','resolved',13.0418,80.2341,'T. Nagar, Chennai','Chennai','Tamil Nadu','RWA',1500,15),
  ('JV-1009','Medical emergency — collapse at metro station','medical',
   'A commuter has collapsed on the platform and is unresponsive. Ambulance needed urgently.',
   'critical','resolved',17.4374,78.4487,'Ameerpet Metro, Hyderabad','Hyderabad','Telangana','Metro staff',900,8)
),
routing(category, depts) as (
  values
  ('fire', array['fire','ambulance']),
  ('road_accident', array['police','ambulance']),
  ('missing_person', array['police']),
  ('tree_fall', array['municipal','fire']),
  ('road_damage', array['municipal']),
  ('public_nuisance', array['police','municipal']),
  ('electricity', array['electricity']),
  ('water', array['water']),
  ('medical', array['ambulance']),
  ('garbage', array['municipal'])
),
inserted as (
  insert into public.issues
    (ref_id, title, category, description, severity, status, lat, lng, address,
     city, state, reporter_name, routed_departments, upvotes, created_at, updated_at)
  select d.ref_id, d.title, d.category, d.description, d.severity, d.status,
         d.lat, d.lng, d.address, d.city, d.state, d.reporter_name,
         r.depts, d.upvotes,
         now() - (d.mins_ago || ' minutes')::interval,
         now() - (d.mins_ago || ' minutes')::interval
  from demo d join routing r on r.category = d.category
  returning id, category, status, created_at
)
-- Seed one media placeholder + an initial timeline entry per issue.
insert into public.issue_updates (issue_id, status, note, by_name, created_at)
select id, 'reported',
       'Issue reported by citizen and routed to the concerned department(s).',
       'JanVyuha System', created_at
from inserted;

-- Coloured placeholder media (MediaThumb renders the "gradient:" scheme).
insert into public.issue_media (issue_id, type, url, label)
select i.id, 'image',
       'gradient:' || case i.category
         when 'fire' then '#e0392b' when 'road_accident' then '#d81b60'
         when 'missing_person' then '#5e35b1' when 'tree_fall' then '#2e7d32'
         when 'road_damage' then '#6d4c41' when 'public_nuisance' then '#455a64'
         when 'electricity' then '#f2a007' when 'water' then '#0277bd'
         when 'medical' then '#c2185b' else '#00897b' end,
       'Reported photo'
from public.issues i where i.ref_id like 'JV-10%';

-- ----------------------------------------------------------------------------
-- Animal Welfare demo issue (the 7th department). Kept separate because it needs
-- per-issue routing — a road accident where the injured party is an animal, so it
-- reaches Police + Ambulance AND Animal Welfare (via the road_accident → animal
-- conditional). Without this row the Animal Welfare dashboard would seed empty.
-- ----------------------------------------------------------------------------
with ins as (
  insert into public.issues
    (ref_id, title, category, description, severity, status, lat, lng, address,
     city, state, reporter_name, routed_departments, upvotes, created_at, updated_at)
  values
    ('JV-1010','Injured cow hit by a truck on the highway','road_accident',
     'A speeding truck hit a stray cow on the service road near the Outer Ring Road. '
     || 'The animal is badly injured and lying on the road, also blocking traffic. '
     || 'Needs a veterinary rescue team.',
     'high','acknowledged',17.4126,78.2751,'Outer Ring Road, Hyderabad',
     'Hyderabad','Telangana','Kiran Deshmukh',
     array['police','ambulance','animal'], 21,
     now() - interval '65 minutes', now() - interval '65 minutes')
  returning id, created_at
)
insert into public.issue_updates (issue_id, status, note, by_name, created_at)
select id, 'reported',
       'Issue reported by citizen and routed to the concerned department(s).',
       'JanVyuha System', created_at
from ins;

insert into public.issue_media (issue_id, type, url, label)
select id, 'image', 'gradient:#d81b60', 'Reported photo'
from public.issues where ref_id = 'JV-1010';

-- ----------------------------------------------------------------------------
-- Fill the district (jurisdiction) for all demo rows, and seed per-department
-- status so department dashboards show independent progress out of the box.
-- ----------------------------------------------------------------------------
update public.issues
  set district = coalesce(district, city)
  where ref_id like 'JV-10%' and district is null;

insert into public.issue_department_status (issue_id, department, status, updated_by)
select i.id, d.department,
       case i.status
         when 'reported'    then 'notified'
         when 'acknowledged' then 'acknowledged'
         when 'in_progress' then 'responding'
         when 'resolved'    then 'done'
         else 'notified'
       end,
       'Department Control Room'
from public.issues i
cross join lateral unnest(i.routed_departments) as d(department)
where i.ref_id like 'JV-10%'
on conflict (issue_id, department) do nothing;
