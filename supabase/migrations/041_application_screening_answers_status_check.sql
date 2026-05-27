-- Enforce answers nullability by screening status (Copilot review on 037).

alter table public.application_screening_answers
  add constraint application_screening_answers_status_answers_check check (
    (status = 'skipped' and answers is null)
    or (status = 'completed' and answers is not null)
  );
