-- Culture fit screening for open roles (optional questionnaire during apply).

alter table public.job_posts
  add column screening_enabled boolean not null default false;

create table public.screening_question_catalog (
  slug text primary key,
  question_type text not null check (question_type in ('yes_no', 'rating_1_5')),
  prompt text not null,
  category text not null,
  sort_order int not null default 0,
  reverse_scored boolean not null default false,
  active boolean not null default true
);

create table public.job_post_screening_questions (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts(id) on delete cascade,
  catalog_slug text references public.screening_question_catalog(slug) on delete set null,
  custom_prompt text,
  question_type text not null check (question_type in ('yes_no', 'rating_1_5')),
  sort_order int not null default 0,
  constraint job_post_screening_questions_source_check check (
    catalog_slug is not null or (custom_prompt is not null and length(trim(custom_prompt)) > 0)
  )
);

create index job_post_screening_questions_job_post_id_idx
  on public.job_post_screening_questions (job_post_id, sort_order);

create table public.application_screening_answers (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete cascade,
  status text not null check (status in ('completed', 'skipped')),
  answers jsonb,
  created_at timestamptz not null default now()
);

alter table public.screening_question_catalog enable row level security;
alter table public.job_post_screening_questions enable row level security;
alter table public.application_screening_answers enable row level security;

-- Catalog is readable by authenticated users (clinic picker + worker apply).
create policy "Authenticated read screening catalog"
  on public.screening_question_catalog for select
  using (auth.uid() is not null and active = true);

-- Clinics manage screening questions on their own job posts.
create policy "Clinics read own job post screening questions"
  on public.job_post_screening_questions for select
  using (
    exists (
      select 1 from public.job_posts
      where job_posts.id = job_post_screening_questions.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  );

create policy "Workers read live job post screening questions"
  on public.job_post_screening_questions for select
  using (
    exists (
      select 1 from public.job_posts
      where job_posts.id = job_post_screening_questions.job_post_id
        and job_posts.status = 'live'
    )
  );

create policy "Clinics insert own job post screening questions"
  on public.job_post_screening_questions for insert
  with check (
    exists (
      select 1 from public.job_posts
      where job_posts.id = job_post_screening_questions.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  );

create policy "Clinics update own job post screening questions"
  on public.job_post_screening_questions for update
  using (
    exists (
      select 1 from public.job_posts
      where job_posts.id = job_post_screening_questions.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.job_posts
      where job_posts.id = job_post_screening_questions.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  );

create policy "Clinics delete own job post screening questions"
  on public.job_post_screening_questions for delete
  using (
    exists (
      select 1 from public.job_posts
      where job_posts.id = job_post_screening_questions.job_post_id
        and job_posts.clinic_id = auth.uid()
    )
  );

-- Workers read/write own screening answers tied to their application.
create policy "Workers read own screening answers"
  on public.application_screening_answers for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = application_screening_answers.application_id
        and applications.worker_id = auth.uid()
    )
  );

create policy "Workers insert own screening answers"
  on public.application_screening_answers for insert
  with check (
    exists (
      select 1 from public.applications
      where applications.id = application_screening_answers.application_id
        and applications.worker_id = auth.uid()
    )
  );

create policy "Clinics read screening answers for own posts"
  on public.application_screening_answers for select
  using (
    exists (
      select 1 from public.applications a
      join public.job_posts jp on jp.id = a.job_post_id
      where a.id = application_screening_answers.application_id
        and jp.clinic_id = auth.uid()
    )
  );

-- Seed preset culture fit questions.
insert into public.screening_question_catalog (slug, question_type, prompt, category, sort_order, reverse_scored) values
  ('transactional_environment', 'yes_no', 'Do you want to work in an environment that is transactional — do your job, leave, get paid?', 'work_style', 10, false),
  ('interpersonal_relationships', 'yes_no', 'Do you value inter-personal relationships with co-workers?', 'work_style', 20, false),
  ('team_setting', 'yes_no', 'Do you thrive in a team setting where everyone helps each other to make the day a success?', 'work_style', 30, false),
  ('accountability', 'yes_no', 'Do you hold yourself accountable to perform every task as best you can?', 'work_style', 40, false),
  ('respectful_communication', 'yes_no', 'Are you able to respectfully communicate to your coworkers when something they''re doing isn''t quite right, or at least address it with the manager?', 'communication', 50, false),
  ('open_conversations', 'yes_no', 'Are you willing to have open and honest conversations about workplace behaviour?', 'communication', 60, false),
  ('pride_in_work', 'yes_no', 'Do you take pride in your work and hold yourself to a high standard?', 'standards', 70, false),
  ('patient_care', 'yes_no', 'Is patient standard of care of utmost importance to you?', 'standards', 80, false),
  ('ipac_standards', 'yes_no', 'Do you agree that IPAC standards are to be adhered to at all times, no matter what?', 'standards', 90, false),
  ('honesty', 'yes_no', 'Do you believe honesty is always the best policy no matter what the ramifications might be?', 'standards', 100, false),
  ('clean_workspace', 'yes_no', 'Do you like a clean and organized workspace?', 'workspace', 110, false),
  ('contribute_clean_workspace', 'yes_no', 'Are you willing to contribute to a clean and organized workspace?', 'workspace', 120, false),
  ('attr_honest', 'rating_1_5', 'Honest', 'attributes', 200, false),
  ('attr_conscientious', 'rating_1_5', 'Conscientious', 'attributes', 210, false),
  ('attr_hardworking', 'rating_1_5', 'Hardworking', 'attributes', 220, false),
  ('attr_collaborative', 'rating_1_5', 'Collaborative', 'attributes', 230, false),
  ('attr_grateful', 'rating_1_5', 'Grateful', 'attributes', 240, false),
  ('attr_empathetic', 'rating_1_5', 'Empathetic', 'attributes', 250, false),
  ('attr_integrity', 'rating_1_5', 'Integrity', 'attributes', 260, false),
  ('attr_thankful', 'rating_1_5', 'Thankful', 'attributes', 270, false),
  ('attr_genuine', 'rating_1_5', 'Genuine', 'attributes', 280, false),
  ('attr_happy', 'rating_1_5', 'Happy', 'attributes', 290, false),
  ('attr_optimistic', 'rating_1_5', 'Optimistic', 'attributes', 300, false),
  ('attr_loyal', 'rating_1_5', 'Loyal', 'attributes', 310, false),
  ('attr_pessimistic', 'rating_1_5', 'Pessimistic', 'attributes', 320, true);
