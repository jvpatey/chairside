import {
  evaluateScreeningAnswers,
  getScreeningCatalogQuestion,
  resolveScreeningPrompt,
  type ScreeningKnockoutRule,
  type ScreeningOutcome,
  type ScreeningPromptContext,
  type ScreeningQuestionType,
} from '@chairside/config';
import { getSupabaseClient } from './client';

export type { ScreeningQuestionType };

export type JobPostScreeningQuestionRow = {
  id: string;
  job_post_id: string;
  catalog_slug: string | null;
  custom_prompt: string | null;
  question_type: ScreeningQuestionType;
  sort_order: number;
  knockout_enabled?: boolean | null;
  knockout_expected_bool?: boolean | null;
  knockout_min?: number | null;
  knockout_max?: number | null;
};

export type ScreeningQuestion = {
  id: string;
  catalogSlug: string | null;
  customPrompt: string | null;
  type: ScreeningQuestionType;
  prompt: string;
  sortOrder: number;
  reverseScored: boolean;
  min?: number;
  max?: number;
  unitLabel?: string;
  knockout: ScreeningKnockoutRule | null;
};

export type ScreeningQuestionInput = {
  catalogSlug?: string;
  customPrompt?: string;
  type: ScreeningQuestionType;
  sortOrder: number;
  knockout?: ScreeningKnockoutRule | null;
};

export type ScreeningAnswerItem = {
  id: string;
  prompt: string;
  type: ScreeningQuestionType;
  answer: boolean | number | string;
  reverseScored?: boolean;
  knockout?: ScreeningKnockoutRule | null;
};

export type ScreeningAnswersPayload = {
  questions: ScreeningAnswerItem[];
};

export type ScreeningSubmissionInput = {
  status: 'completed' | 'skipped';
  answers?: ScreeningAnswersPayload;
  outcome?: ScreeningOutcome | null;
  failedQuestionIds?: string[];
};

export type ApplicationScreening = {
  status: 'completed' | 'skipped';
  answers: ScreeningAnswersPayload | null;
  createdAt: string;
  outcome: ScreeningOutcome | null;
  failedQuestionIds: string[];
};

function mapKnockoutFromRow(row: JobPostScreeningQuestionRow): ScreeningKnockoutRule | null {
  if (!row.knockout_enabled) return null;
  return {
    enabled: true,
    expectedBool: row.knockout_expected_bool ?? null,
    min: row.knockout_min ?? null,
    max: row.knockout_max ?? null,
  };
}

function mapScreeningQuestionRow(
  row: JobPostScreeningQuestionRow,
  context?: ScreeningPromptContext,
): ScreeningQuestion {
  const catalog = row.catalog_slug ? getScreeningCatalogQuestion(row.catalog_slug) : undefined;
  return {
    id: row.id,
    catalogSlug: row.catalog_slug,
    customPrompt: row.custom_prompt,
    type: row.question_type,
    prompt: resolveScreeningPrompt(row.catalog_slug, row.custom_prompt, context),
    sortOrder: row.sort_order,
    reverseScored: catalog?.reverseScored ?? false,
    min: catalog?.min,
    max: catalog?.max,
    unitLabel: catalog?.unitLabel,
    knockout: mapKnockoutFromRow(row),
  };
}

async function getJobPostProvince(jobPostId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('job_posts')
    .select('clinic_id')
    .eq('id', jobPostId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.clinic_id) return null;

  const { data: clinic, error: clinicError } = await supabase
    .from('clinic_profiles')
    .select('province')
    .eq('id', data.clinic_id)
    .maybeSingle();

  if (clinicError) throw clinicError;
  return clinic?.province ?? null;
}

export async function getJobPostScreeningQuestions(
  jobPostId: string,
  promptContext?: ScreeningPromptContext,
): Promise<ScreeningQuestion[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('job_post_screening_questions')
    .select('*')
    .eq('job_post_id', jobPostId)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  const context =
    promptContext ??
    ({
      province: await getJobPostProvince(jobPostId),
    } satisfies ScreeningPromptContext);

  return ((data ?? []) as JobPostScreeningQuestionRow[]).map((row) =>
    mapScreeningQuestionRow(row, context),
  );
}

export async function replaceJobPostScreeningQuestions(
  clinicId: string,
  jobPostId: string,
  screeningEnabled: boolean,
  questions: ScreeningQuestionInput[],
): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: job, error: jobError } = await supabase
    .from('job_posts')
    .select('id')
    .eq('id', jobPostId)
    .eq('clinic_id', clinicId)
    .maybeSingle();

  if (jobError) throw jobError;
  if (!job) throw new Error('Job post not found');

  const { error: updateError } = await supabase
    .from('job_posts')
    .update({
      screening_enabled: screeningEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobPostId)
    .eq('clinic_id', clinicId);

  if (updateError) throw updateError;

  const { error: deleteError } = await supabase
    .from('job_post_screening_questions')
    .delete()
    .eq('job_post_id', jobPostId);

  if (deleteError) throw deleteError;

  if (!screeningEnabled || questions.length === 0) return;

  const rows = questions.map((question, index) => {
    const knockout = question.knockout?.enabled ? question.knockout : null;
    return {
      job_post_id: jobPostId,
      catalog_slug: question.catalogSlug ?? null,
      custom_prompt: question.customPrompt?.trim() || null,
      question_type: question.type,
      sort_order: question.sortOrder ?? index,
      knockout_enabled: Boolean(knockout?.enabled),
      knockout_expected_bool: knockout?.enabled ? (knockout.expectedBool ?? null) : null,
      knockout_min: knockout?.enabled ? (knockout.min ?? null) : null,
      knockout_max: knockout?.enabled ? (knockout.max ?? null) : null,
    };
  });

  const { error: insertError } = await supabase
    .from('job_post_screening_questions')
    .insert(rows as never);

  if (insertError) throw insertError;
}

export function evaluateScreeningSubmission(
  questions: ScreeningQuestion[],
  answers: ScreeningAnswersPayload | null | undefined,
): { outcome: ScreeningOutcome | null; failedQuestionIds: string[] } {
  const evaluation = evaluateScreeningAnswers(
    (answers?.questions ?? []).map((item) => ({
      id: item.id,
      type: item.type,
      answer: item.answer,
      prompt: item.prompt,
    })),
    questions.map((question) => ({
      id: question.catalogSlug ?? question.id,
      type: question.type,
      prompt: question.prompt,
      knockout: question.knockout,
    })),
  );
  return {
    outcome: evaluation.outcome,
    failedQuestionIds: evaluation.failedQuestionIds,
  };
}

export async function insertApplicationScreening(
  applicationId: string,
  submission: ScreeningSubmissionInput,
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('application_screening_answers').insert({
    application_id: applicationId,
    status: submission.status,
    answers: submission.status === 'completed' ? (submission.answers ?? null) : null,
    outcome: submission.status === 'completed' ? (submission.outcome ?? null) : null,
    failed_question_ids:
      submission.status === 'completed' ? (submission.failedQuestionIds ?? []) : [],
  } as never);

  if (error) throw error;
}

function mapApplicationScreeningRow(data: {
  status: string;
  answers: unknown;
  created_at: string;
  outcome?: string | null;
  failed_question_ids?: string[] | null;
}): ApplicationScreening {
  return {
    status: data.status as ApplicationScreening['status'],
    answers: (data.answers as ScreeningAnswersPayload | null) ?? null,
    createdAt: data.created_at,
    outcome: (data.outcome as ScreeningOutcome | null) ?? null,
    failedQuestionIds: data.failed_question_ids ?? [],
  };
}

export async function getApplicationScreening(
  applicationId: string,
): Promise<ApplicationScreening | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('application_screening_answers')
    .select('status, answers, created_at, outcome, failed_question_ids')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapApplicationScreeningRow(data);
}

export async function getApplicationScreeningMap(
  applicationIds: string[],
): Promise<Map<string, ApplicationScreening>> {
  if (applicationIds.length === 0) return new Map();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('application_screening_answers')
    .select('application_id, status, answers, created_at, outcome, failed_question_ids')
    .in('application_id', applicationIds);

  if (error) throw error;

  const map = new Map<string, ApplicationScreening>();
  for (const row of data ?? []) {
    const typed = row as {
      application_id: string;
      status: string;
      answers: unknown;
      created_at: string;
      outcome?: string | null;
      failed_question_ids?: string[] | null;
    };
    map.set(typed.application_id, mapApplicationScreeningRow(typed));
  }
  return map;
}

export function buildScreeningAnswersPayload(
  questions: ScreeningQuestion[],
  answers: Record<string, boolean | number | string | undefined>,
): ScreeningAnswersPayload {
  const items: ScreeningAnswerItem[] = [];
  for (const question of questions) {
    const answerKey = question.catalogSlug ?? question.id;
    const answer = answers[answerKey];
    if (answer === undefined) continue;
    if (question.type === 'text' && typeof answer === 'string' && !answer.trim()) {
      continue;
    }
    items.push({
      id: answerKey,
      prompt: question.prompt,
      type: question.type,
      answer: question.type === 'text' && typeof answer === 'string' ? answer.trim() : answer,
      reverseScored: question.reverseScored || undefined,
      knockout: question.knockout?.enabled ? question.knockout : undefined,
    });
  }
  return { questions: items };
}

export function screeningQuestionInputFromSelection(
  selectedCatalogSlugs: string[],
  customQuestions: Array<{ id: string; prompt: string; type: ScreeningQuestionType }>,
  knockouts: Record<string, ScreeningKnockoutRule | undefined> = {},
): ScreeningQuestionInput[] {
  const catalogInputs: ScreeningQuestionInput[] = selectedCatalogSlugs.map((slug, index) => {
    const preset = getScreeningCatalogQuestion(slug);
    return {
      catalogSlug: slug,
      type: preset?.type ?? 'yes_no',
      sortOrder: preset?.sortOrder ?? index,
      knockout: knockouts[slug] ?? null,
    };
  });

  const customInputs: ScreeningQuestionInput[] = customQuestions.map((question, index) => ({
    customPrompt: question.prompt,
    type: question.type,
    sortOrder: 1000 + index,
    knockout: knockouts[question.id] ?? null,
  }));

  return [...catalogInputs, ...customInputs].sort((a, b) => a.sortOrder - b.sortOrder);
}
