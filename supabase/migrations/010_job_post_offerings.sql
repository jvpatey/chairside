alter table public.job_posts
  add column offerings text[] not null default '{}';
