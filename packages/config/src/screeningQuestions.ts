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
    category: 'work_style',
    sortOrder: 10,
  },
  {
    slug: 'interpersonal_relationships',
    type: 'yes_no',
    prompt: 'Do you value inter-personal relationships with co-workers?',
    category: 'work_style',
    sortOrder: 20,
  },
  {
    slug: 'team_setting',
    type: 'yes_no',
    prompt:
      'Do you thrive in a team setting where everyone helps each other to make the day a success?',
    category: 'work_style',
    sortOrder: 30,
  },
  {
    slug: 'accountability',
    type: 'yes_no',
    prompt: 'Do you hold yourself accountable to perform every task as best you can?',
    category: 'work_style',
    sortOrder: 40,
  },
  {
    slug: 'respectful_communication',
    type: 'yes_no',
    prompt:
      "Are you able to respectfully communicate to your coworkers when something they're doing isn't quite right, or at least address it with the manager?",
    category: 'communication',
    sortOrder: 50,
  },
  {
    slug: 'open_conversations',
    type: 'yes_no',
    prompt: 'Are you willing to have open and honest conversations about workplace behaviour?',
    category: 'communication',
    sortOrder: 60,
  },
  {
    slug: 'pride_in_work',
    type: 'yes_no',
    prompt: 'Do you take pride in your work and hold yourself to a high standard?',
    category: 'standards',
    sortOrder: 70,
  },
  {
    slug: 'patient_care',
    type: 'yes_no',
    prompt: 'Is patient standard of care of utmost importance to you?',
    category: 'standards',
    sortOrder: 80,
  },
  {
    slug: 'ipac_standards',
    type: 'yes_no',
    prompt: 'Do you agree that IPAC standards are to be adhered to at all times, no matter what?',
    category: 'standards',
    sortOrder: 90,
  },
  {
    slug: 'honesty',
    type: 'yes_no',
    prompt:
      'Do you believe honesty is always the best policy no matter what the ramifications might be?',
    category: 'standards',
    sortOrder: 100,
  },
  {
    slug: 'clean_workspace',
    type: 'yes_no',
    prompt: 'Do you like a clean and organized workspace?',
    category: 'workspace',
    sortOrder: 110,
  },
  {
    slug: 'contribute_clean_workspace',
    type: 'yes_no',
    prompt: 'Are you willing to contribute to a clean and organized workspace?',
    category: 'workspace',
    sortOrder: 120,
  },
  {
    slug: 'years_experience_in_role',
    type: 'number',
    prompt: 'How many years of experience do you have in this role?',
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
    category: 'qualifications',
    sortOrder: 140,
  },
  {
    slug: 'currently_employed_dental',
    type: 'yes_no',
    prompt: 'Are you currently working in a dental practice?',
    category: 'qualifications',
    sortOrder: 150,
  },
  {
    slug: 'weeks_notice_to_start',
    type: 'number',
    prompt: 'If hired, how many weeks of notice do you need before you can start?',
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
    category: 'qualifications',
    sortOrder: 170,
  },
  { slug: 'attr_honest', type: 'rating_1_5', prompt: 'Honest', category: 'attributes', sortOrder: 200 },
  {
    slug: 'attr_conscientious',
    type: 'rating_1_5',
    prompt: 'Conscientious',
    category: 'attributes',
    sortOrder: 210,
  },
  {
    slug: 'attr_hardworking',
    type: 'rating_1_5',
    prompt: 'Hardworking',
    category: 'attributes',
    sortOrder: 220,
  },
  {
    slug: 'attr_collaborative',
    type: 'rating_1_5',
    prompt: 'Collaborative',
    category: 'attributes',
    sortOrder: 230,
  },
  { slug: 'attr_grateful', type: 'rating_1_5', prompt: 'Grateful', category: 'attributes', sortOrder: 240 },
  {
    slug: 'attr_empathetic',
    type: 'rating_1_5',
    prompt: 'Empathetic',
    category: 'attributes',
    sortOrder: 250,
  },
  { slug: 'attr_integrity', type: 'rating_1_5', prompt: 'Integrity', category: 'attributes', sortOrder: 260 },
  { slug: 'attr_thankful', type: 'rating_1_5', prompt: 'Thankful', category: 'attributes', sortOrder: 270 },
  { slug: 'attr_genuine', type: 'rating_1_5', prompt: 'Genuine', category: 'attributes', sortOrder: 280 },
  { slug: 'attr_happy', type: 'rating_1_5', prompt: 'Happy', category: 'attributes', sortOrder: 290 },
  {
    slug: 'attr_optimistic',
    type: 'rating_1_5',
    prompt: 'Optimistic',
    category: 'attributes',
    sortOrder: 300,
  },
  { slug: 'attr_loyal', type: 'rating_1_5', prompt: 'Loyal', category: 'attributes', sortOrder: 310 },
  {
    slug: 'attr_pessimistic',
    type: 'rating_1_5',
    prompt: 'Pessimistic',
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

export function getDefaultScreeningSelection(): string[] {
  return [...ALL_SCREENING_CATALOG_SLUGS];
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
