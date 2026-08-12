import { getProvinceLabel } from './clinicOptions';

export type ScreeningQuestionType = 'yes_no' | 'rating_1_5' | 'number' | 'text';

export type ScreeningQuestionCategory =
  | 'work_style'
  | 'communication'
  | 'standards'
  | 'workspace'
  | 'attributes'
  | 'qualifications';

export type ScreeningCatalogQuestion = {
  slug: string;
  type: ScreeningQuestionType;
  prompt: string;
  /** Short label for clinic triage chips / dense UI. */
  shortLabel: string;
  category: ScreeningQuestionCategory;
  sortOrder: number;
  reverseScored?: boolean;
  min?: number;
  max?: number;
  unitLabel?: string;
};

export type ScreeningPromptContext = {
  province?: string | null;
};

/** Knockout / must-pass rule for yes/no and number questions. */
export type ScreeningKnockoutRule = {
  enabled: boolean;
  /** Expected answer for yes_no questions. */
  expectedBool?: boolean | null;
  /** Inclusive minimum for number answers. */
  min?: number | null;
  /** Inclusive maximum for number answers. */
  max?: number | null;
};

export type ScreeningOutcome = 'pass' | 'flagged' | 'incomplete';

export const SCREENING_CATEGORY_LABELS: Record<ScreeningQuestionCategory, string> = {
  work_style: 'Work style',
  communication: 'Communication',
  standards: 'Standards',
  workspace: 'Workspace',
  attributes: 'Attributes (1–5)',
  qualifications: 'Qualifications',
};

export const RATING_SCALE_OPTIONS = [
  { value: 1, label: 'Not at all' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neither' },
  { value: 4, label: 'Somewhat agree' },
  { value: 5, label: 'Strongly agree' },
] as const;

export type RatingScaleValue = (typeof RATING_SCALE_OPTIONS)[number]['value'];

export const SCREENING_CATALOG: ScreeningCatalogQuestion[] = [
  {
    slug: 'transactional_environment',
    type: 'yes_no',
    prompt:
      'Do you want to work in an environment that is transactional — do your job, leave, get paid?',
    shortLabel: 'Transactional',
    category: 'work_style',
    sortOrder: 10,
  },
  {
    slug: 'interpersonal_relationships',
    type: 'yes_no',
    prompt: 'Do you value inter-personal relationships with co-workers?',
    shortLabel: 'Relationships',
    category: 'work_style',
    sortOrder: 20,
  },
  {
    slug: 'team_setting',
    type: 'yes_no',
    prompt:
      'Do you thrive in a team setting where everyone helps each other to make the day a success?',
    shortLabel: 'Team',
    category: 'work_style',
    sortOrder: 30,
  },
  {
    slug: 'accountability',
    type: 'yes_no',
    prompt: 'Do you hold yourself accountable to perform every task as best you can?',
    shortLabel: 'Accountable',
    category: 'work_style',
    sortOrder: 40,
  },
  {
    slug: 'respectful_communication',
    type: 'yes_no',
    prompt:
      "Are you able to respectfully communicate to your coworkers when something they're doing isn't quite right, or at least address it with the manager?",
    shortLabel: 'Feedback',
    category: 'communication',
    sortOrder: 50,
  },
  {
    slug: 'open_conversations',
    type: 'yes_no',
    prompt: 'Are you willing to have open and honest conversations about workplace behaviour?',
    shortLabel: 'Open talks',
    category: 'communication',
    sortOrder: 60,
  },
  {
    slug: 'pride_in_work',
    type: 'yes_no',
    prompt: 'Do you take pride in your work and hold yourself to a high standard?',
    shortLabel: 'High standard',
    category: 'standards',
    sortOrder: 70,
  },
  {
    slug: 'patient_care',
    type: 'yes_no',
    prompt: 'Is patient standard of care of utmost importance to you?',
    shortLabel: 'Patient care',
    category: 'standards',
    sortOrder: 80,
  },
  {
    slug: 'ipac_standards',
    type: 'yes_no',
    prompt: 'Do you agree that IPAC standards are to be adhered to at all times, no matter what?',
    shortLabel: 'IPAC',
    category: 'standards',
    sortOrder: 90,
  },
  {
    slug: 'honesty',
    type: 'yes_no',
    prompt:
      'Do you believe honesty is always the best policy no matter what the ramifications might be?',
    shortLabel: 'Honesty',
    category: 'standards',
    sortOrder: 100,
  },
  {
    slug: 'clean_workspace',
    type: 'yes_no',
    prompt: 'Do you like a clean and organized workspace?',
    shortLabel: 'Clean space',
    category: 'workspace',
    sortOrder: 110,
  },
  {
    slug: 'contribute_clean_workspace',
    type: 'yes_no',
    prompt: 'Are you willing to contribute to a clean and organized workspace?',
    shortLabel: 'Keep clean',
    category: 'workspace',
    sortOrder: 120,
  },
  {
    slug: 'years_experience_in_role',
    type: 'number',
    prompt: 'How many years of experience do you have in this role?',
    shortLabel: 'Experience',
    category: 'qualifications',
    sortOrder: 130,
    min: 0,
    max: 50,
    unitLabel: 'years',
  },
  {
    slug: 'provincial_certification_training',
    type: 'yes_no',
    prompt:
      'Do you have the proper certification or training required for this role in {{province}}?',
    shortLabel: 'Licensed',
    category: 'qualifications',
    sortOrder: 140,
  },
  {
    slug: 'currently_employed_dental',
    type: 'yes_no',
    prompt: 'Are you currently working in a dental practice?',
    shortLabel: 'Employed',
    category: 'qualifications',
    sortOrder: 150,
  },
  {
    slug: 'weeks_notice_to_start',
    type: 'number',
    prompt: 'If hired, how many weeks of notice do you need before you can start?',
    shortLabel: 'Notice',
    category: 'qualifications',
    sortOrder: 160,
    min: 0,
    max: 52,
    unitLabel: 'weeks',
  },
  {
    slug: 'reliable_schedule',
    type: 'yes_no',
    prompt: 'Can you reliably maintain the schedule required for this role?',
    shortLabel: 'Schedule',
    category: 'qualifications',
    sortOrder: 170,
  },
  {
    slug: 'attr_honest',
    type: 'rating_1_5',
    prompt: 'Honest',
    shortLabel: 'Honest',
    category: 'attributes',
    sortOrder: 200,
  },
  {
    slug: 'attr_conscientious',
    type: 'rating_1_5',
    prompt: 'Conscientious',
    shortLabel: 'Conscientious',
    category: 'attributes',
    sortOrder: 210,
  },
  {
    slug: 'attr_hardworking',
    type: 'rating_1_5',
    prompt: 'Hardworking',
    shortLabel: 'Hardworking',
    category: 'attributes',
    sortOrder: 220,
  },
  {
    slug: 'attr_collaborative',
    type: 'rating_1_5',
    prompt: 'Collaborative',
    shortLabel: 'Collaborative',
    category: 'attributes',
    sortOrder: 230,
  },
  {
    slug: 'attr_grateful',
    type: 'rating_1_5',
    prompt: 'Grateful',
    shortLabel: 'Grateful',
    category: 'attributes',
    sortOrder: 240,
  },
  {
    slug: 'attr_empathetic',
    type: 'rating_1_5',
    prompt: 'Empathetic',
    shortLabel: 'Empathetic',
    category: 'attributes',
    sortOrder: 250,
  },
  {
    slug: 'attr_integrity',
    type: 'rating_1_5',
    prompt: 'Integrity',
    shortLabel: 'Integrity',
    category: 'attributes',
    sortOrder: 260,
  },
  {
    slug: 'attr_thankful',
    type: 'rating_1_5',
    prompt: 'Thankful',
    shortLabel: 'Thankful',
    category: 'attributes',
    sortOrder: 270,
  },
  {
    slug: 'attr_genuine',
    type: 'rating_1_5',
    prompt: 'Genuine',
    shortLabel: 'Genuine',
    category: 'attributes',
    sortOrder: 280,
  },
  {
    slug: 'attr_happy',
    type: 'rating_1_5',
    prompt: 'Happy',
    shortLabel: 'Happy',
    category: 'attributes',
    sortOrder: 290,
  },
  {
    slug: 'attr_optimistic',
    type: 'rating_1_5',
    prompt: 'Optimistic',
    shortLabel: 'Optimistic',
    category: 'attributes',
    sortOrder: 300,
  },
  {
    slug: 'attr_loyal',
    type: 'rating_1_5',
    prompt: 'Loyal',
    shortLabel: 'Loyal',
    category: 'attributes',
    sortOrder: 310,
  },
  {
    slug: 'attr_pessimistic',
    type: 'rating_1_5',
    prompt: 'Pessimistic',
    shortLabel: 'Pessimistic',
    category: 'attributes',
    sortOrder: 320,
    reverseScored: true,
  },
];

export const ALL_SCREENING_CATALOG_SLUGS = SCREENING_CATALOG.map((question) => question.slug);

export function getScreeningCatalogQuestion(slug: string): ScreeningCatalogQuestion | undefined {
  return SCREENING_CATALOG.find((question) => question.slug === slug);
}

export function getScreeningQuestionsByCategory(
  category: ScreeningQuestionCategory,
): ScreeningCatalogQuestion[] {
  return SCREENING_CATALOG.filter((question) => question.category === category);
}

export const SCREENING_CATEGORIES: ScreeningQuestionCategory[] = [
  'qualifications',
  'work_style',
  'communication',
  'standards',
  'workspace',
  'attributes',
];

export const CULTURE_FIT_CATEGORIES: ScreeningQuestionCategory[] = [
  'work_style',
  'communication',
  'standards',
  'workspace',
  'attributes',
];

export function isCultureFitCategory(category: ScreeningQuestionCategory): boolean {
  return category !== 'qualifications';
}

/** Default when enabling screening: qualifications only (not the full catalog). */
export function getDefaultScreeningSelection(): string[] {
  return getScreeningQuestionsByCategory('qualifications').map((question) => question.slug);
}

/** Short culture pack: one signal from each yes/no category. 1–5 attributes stay optional. */
export const RECOMMENDED_CULTURE_FIT_SLUGS = [
  'team_setting',
  'respectful_communication',
  'pride_in_work',
  'contribute_clean_workspace',
] as const;

export function getRecommendedCultureFitSelection(): string[] {
  return [...RECOMMENDED_CULTURE_FIT_SLUGS];
}

export function supportsScreeningKnockout(type: ScreeningQuestionType): boolean {
  return type === 'yes_no' || type === 'number';
}

export function answerPassesKnockout(
  type: ScreeningQuestionType,
  answer: boolean | number | string,
  rule: ScreeningKnockoutRule | null | undefined,
): boolean {
  if (!rule?.enabled || !supportsScreeningKnockout(type)) return true;

  if (type === 'yes_no') {
    if (rule.expectedBool == null) return true;
    return answer === rule.expectedBool;
  }

  if (type === 'number' && typeof answer === 'number' && !Number.isNaN(answer)) {
    if (rule.min != null && answer < rule.min) return false;
    if (rule.max != null && answer > rule.max) return false;
    return true;
  }

  return true;
}

export type ScreeningAnswerForEvaluation = {
  id: string;
  type: ScreeningQuestionType;
  answer: boolean | number | string;
  prompt?: string;
};

export type ScreeningKnockoutQuestionForEvaluation = {
  /** Catalog slug or question id matching answer.id */
  id: string;
  type: ScreeningQuestionType;
  prompt: string;
  knockout?: ScreeningKnockoutRule | null;
};

export type ScreeningEvaluationResult = {
  outcome: ScreeningOutcome | null;
  failedQuestionIds: string[];
  failedLabels: string[];
};

export function evaluateScreeningAnswers(
  answers: ScreeningAnswerForEvaluation[],
  questions: ScreeningKnockoutQuestionForEvaluation[],
): ScreeningEvaluationResult {
  const answerById = new Map(answers.map((item) => [item.id, item]));
  const knockoutQuestions = questions.filter((question) => question.knockout?.enabled);
  if (knockoutQuestions.length === 0) {
    return { outcome: null, failedQuestionIds: [], failedLabels: [] };
  }

  const failedQuestionIds: string[] = [];
  const failedLabels: string[] = [];

  for (const question of knockoutQuestions) {
    const answered = answerById.get(question.id);
    if (!answered) {
      return {
        outcome: 'incomplete',
        failedQuestionIds: [question.id],
        failedLabels: [getScreeningCatalogQuestion(question.id)?.shortLabel ?? question.prompt],
      };
    }
    if (!answerPassesKnockout(question.type, answered.answer, question.knockout)) {
      failedQuestionIds.push(question.id);
      failedLabels.push(getScreeningCatalogQuestion(question.id)?.shortLabel ?? question.prompt);
    }
  }

  if (failedQuestionIds.length > 0) {
    return { outcome: 'flagged', failedQuestionIds, failedLabels };
  }
  return { outcome: 'pass', failedQuestionIds: [], failedLabels: [] };
}

export function formatScreeningUnitLabel(
  unitLabel?: string | null,
  compact = false,
): string {
  if (!unitLabel) return '';
  if (!compact) return unitLabel;
  if (unitLabel === 'years') return 'yrs';
  if (unitLabel === 'weeks') return 'wks';
  return unitLabel;
}

export function formatScreeningAnswerValue(
  type: ScreeningQuestionType,
  answer: boolean | number | string,
  unitLabel?: string,
  compact = false,
): string {
  if (type === 'yes_no') return answer ? 'Yes' : 'No';
  if (type === 'text') return String(answer).trim();
  if (type === 'number') {
    const value = String(answer);
    const unit = formatScreeningUnitLabel(unitLabel, compact);
    return unit ? `${value} ${unit}` : value;
  }
  const option = RATING_SCALE_OPTIONS.find((item) => item.value === answer);
  return option ? `${answer} · ${option.label}` : String(answer);
}

/** Human-readable must-pass requirement, e.g. "Yes" or "5+ years". */
export function formatScreeningRequirementLabel(
  type: ScreeningQuestionType,
  knockout: ScreeningKnockoutRule | null | undefined,
  unitLabel?: string | null,
  compact = false,
): string | null {
  if (!knockout?.enabled) return null;
  const unit = formatScreeningUnitLabel(unitLabel, compact);

  if (type === 'yes_no' && knockout.expectedBool != null) {
    return knockout.expectedBool ? 'Yes' : 'No';
  }

  if (type === 'number') {
    const withUnit = (value: string) => (unit ? `${value} ${unit}` : value);
    if (knockout.min != null && knockout.max != null) {
      return withUnit(`${knockout.min}–${knockout.max}`);
    }
    if (knockout.min != null) {
      return withUnit(`${knockout.min}+`);
    }
    if (knockout.max != null) {
      return withUnit(`≤${knockout.max}`);
    }
  }

  return null;
}

export function formatScreeningChipLabel(
  questionId: string,
  type: ScreeningQuestionType,
  answer: boolean | number | string,
): string {
  const catalog = getScreeningCatalogQuestion(questionId);
  const short = catalog?.shortLabel ?? 'Answer';
  const unit = catalog?.unitLabel;
  if (type === 'yes_no') return `${short}: ${answer ? 'Yes' : 'No'}`;
  if (type === 'number') {
    const compactUnit =
      unit === 'years' ? 'yrs' : unit === 'weeks' ? 'wks' : unit ? unit : '';
    return compactUnit ? `${answer} ${compactUnit}` : `${short}: ${answer}`;
  }
  if (type === 'rating_1_5') return `${short} ${answer}/5`;
  const text = String(answer).trim();
  return text.length > 24 ? `${short}: ${text.slice(0, 22)}…` : `${short}: ${text}`;
}

export function resolveScreeningPrompt(
  catalogSlug: string | null,
  customPrompt: string | null,
  context?: ScreeningPromptContext,
): string {
  if (customPrompt?.trim()) return customPrompt.trim();
  if (catalogSlug) {
    const preset = getScreeningCatalogQuestion(catalogSlug);
    if (preset) {
      return formatScreeningPromptTemplate(preset.prompt, context);
    }
  }
  return 'Question';
}

export function formatScreeningQuestionTypeLabel(type: ScreeningQuestionType): string {
  switch (type) {
    case 'yes_no':
      return 'Yes / No';
    case 'number':
      return 'Number';
    case 'text':
      return 'Text answer';
    case 'rating_1_5':
      return '1–5 rating';
  }
}

export function formatScreeningPromptTemplate(
  prompt: string,
  context?: ScreeningPromptContext,
): string {
  if (!prompt.includes('{{province}}')) return prompt;

  const provinceLabel = context?.province?.trim()
    ? getProvinceLabel(context.province.trim())
    : 'your province';

  return prompt.replace(/\{\{province\}\}/g, provinceLabel);
}
