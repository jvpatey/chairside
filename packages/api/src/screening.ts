import {
  getScreeningCatalogQuestion,
  resolveScreeningPrompt,
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
};

export type ScreeningQuestionInput = {
  catalogSlug?: string;
  customPrompt?: string;
  type: ScreeningQuestionType;
  sortOrder: number;
};

export type ScreeningAnswerItem = {
  id: string;
  prompt: string;
  type: ScreeningQuestionType;
  answer: boolean | number | string;
  reverseScored?: boolean;
};

export type ScreeningAnswersPayload = {
  questions: ScreeningAnswerItem[];
};

export type ScreeningSubmissionInput = {
  status: 'completed' | 'skipped';
  answers?: ScreeningAnswersPayload;
};

export type ApplicationScreening = {
  status: 'completed' | 'skipped';
  answers: ScreeningAnswersPayload | null;
  createdAt: string;
};

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

  const rows = questions.map((question, index) => ({
    job_post_id: jobPostId,
    catalog_slug: question.catalogSlug ?? null,
    custom_prompt: question.customPrompt?.trim() || null,
    question_type: question.type,
    sort_order: question.sortOrder ?? index,
  }));

  const { error: insertError } = await supabase.from('job_post_screening_questions').insert(rows);

  if (insertError) throw insertError;
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
  });

  if (error) throw error;
}

export async function getApplicationScreening(
  applicationId: string,
): Promise<ApplicationScreening | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('application_screening_answers')
    .select('status, answers, created_at')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    status: data.status as ApplicationScreening['status'],
    answers: (data.answers as ScreeningAnswersPayload | null) ?? null,
    createdAt: data.created_at,
  };
}

export async function getApplicationScreeningMap(
  applicationIds: string[],
): Promise<Map<string, ApplicationScreening>> {
  if (applicationIds.length === 0) return new Map();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('application_screening_answers')
    .select('application_id, status, answers, created_at')
    .in('application_id', applicationIds);

  if (error) throw error;

  const map = new Map<string, ApplicationScreening>();
  for (const row of data ?? []) {
    map.set(row.application_id, {
      status: row.status as ApplicationScreening['status'],
      answers: (row.answers as ScreeningAnswersPayload | null) ?? null,
      createdAt: row.created_at,
    });
  }
  return map;
}

export function buildScreeningAnswersPayload(
  questions: ScreeningQuestion[],
  answers: Record<string, boolean | number | string | undefined>,
): ScreeningAnswersPayload {
  return {
    questions: questions
      .map((question) => {
        const answerKey = question.catalogSlug ?? question.id;
        const answer = answers[answerKey];
        if (answer === undefined) return null;
        if (question.type === 'text' && typeof answer === 'string' && !answer.trim()) {
          return null;
        }
        return {
          id: answerKey,
          prompt: question.prompt,
          type: question.type,
          answer: question.type === 'text' && typeof answer === 'string' ? answer.trim() : answer,
          reverseScored: question.reverseScored || undefined,
        };
      })
      .filter((item): item is ScreeningAnswerItem => item != null),
  };
}

export function screeningQuestionInputFromSelection(
  selectedCatalogSlugs: string[],
  customQuestions: Array<{ id: string; prompt: string; type: ScreeningQuestionType }>,
): ScreeningQuestionInput[] {
  const catalogInputs: ScreeningQuestionInput[] = selectedCatalogSlugs.map((slug, index) => {
    const preset = getScreeningCatalogQuestion(slug);
    return {
      catalogSlug: slug,
      type: preset?.type ?? 'yes_no',
      sortOrder: preset?.sortOrder ?? index,
    };
  });

  const customInputs: ScreeningQuestionInput[] = customQuestions.map((question, index) => ({
    customPrompt: question.prompt,
    type: question.type,
    sortOrder: 1000 + index,
  }));

  return [...catalogInputs, ...customInputs].sort((a, b) => a.sortOrder - b.sortOrder);
}
