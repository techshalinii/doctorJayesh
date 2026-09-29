alter table public.categories
  add column if not exists sort_order integer not null default 1000;

create index if not exists categories_sort_order_idx on public.categories (sort_order, name);

insert into public.categories (slug, name, description, sort_order) values
  ('brain',      'Brain',      'The brain itself — anatomy, function, and what goes wrong.', 10),
  ('spine',      'Spine',      'The spinal column and spinal cord.', 20),
  ('stroke',     'Stroke',     'Warning signs, emergency care and recovery after a stroke.', 30),
  ('paralysis',  'Paralysis',  'Loss of movement — causes, treatment and regaining function.', 40),
  ('tumour',     'Tumour',     'Brain and spinal tumours: diagnosis, surgery and outcomes.', 50),
  ('migraine',   'Migraine',   'Headache disorders, triggers and when they need investigating.', 60),
  ('back',       'Back',       'Back pain — what causes it and what actually helps.', 70),
  ('neck',       'Neck',       'Neck pain, cervical spine problems and referred symptoms.', 80),
  ('disc',       'Disc',       'Bulging, herniated and degenerating spinal discs.', 90),
  ('surgery',    'Surgery',    'What an operation involves, from consent to discharge.', 100),
  ('children',   'Children',   'Paediatric neurosurgery and neurological conditions in children.', 110),
  ('rehab',      'Rehab',      'Rehabilitation, physiotherapy and the road back to normal.', 120),
  ('nutrition',  'Nutrition',  'Diet and its effect on brain, nerve and bone health.', 130),
  ('sleep',      'Sleep',      'Sleep, its disorders, and what they mean neurologically.', 140),
  ('parkinson',  'Parkinson',  'Parkinson''s disease, its management and deep brain stimulation.', 150),
  ('memory',     'Memory',     'Memory loss, cognitive change and when to seek help.', 160),
  ('epilepsy',   'Epilepsy',   'Seizures, their investigation and surgical options.', 170),
  ('arthritis',  'Arthritis',  'Arthritis of the spine and joints, and the pain it refers.', 180),
  ('genetic',    'Genetic',    'Inherited and genetic conditions affecting the nervous system.', 190)
on conflict (slug) do update
  set name        = excluded.name,
      description = excluded.description,
      sort_order  = excluded.sort_order;

delete from public.categories
 where slug in ('brain-surgery', 'spine-surgery', 'patient-guides', 'neurology')
   and name not in (select distinct category from public.blogs where category <> '');
