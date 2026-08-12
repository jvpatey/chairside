import type { ApplicationScreening, ScreeningAnswerItem } from '@chairside/api';
import {
  formatScreeningAnswerValue,
  formatScreeningRequirementLabel,
  getScreeningCatalogQuestion,
  isCultureFitCategory,
  type ScreeningKnockoutRule,
  type ScreeningOutcome,
} from '@chairside/config';

export type ScreeningTriageChip = {
  id: string;
  label: string;
  value: string;
  required?: string | null;
  kind: 'qualification' | 'culture';
  failed?: boolean;
};

function isQualificationAnswer(item: ScreeningAnswerItem): boolean {
  const catalog = getScreeningCatalogQuestion(item.id);
  if (!catalog) return item.type === 'yes_no' || item.type === 'number';
  return catalog.category === 'qualifications';
}

export function partitionScreeningAnswers(questions: ScreeningAnswerItem[]): {
  qualifications: ScreeningAnswerItem[];
  culture: ScreeningAnswerItem[];
} {
  const qualifications: ScreeningAnswerItem[] = [];
  const culture: ScreeningAnswerItem[] = [];
  for (const item of questions) {
    const catalog = getScreeningCatalogQuestion(item.id);
    if (catalog ? catalog.category === 'qualifications' : isQualificationAnswer(item)) {
      qualifications.push(item);
    } else if (catalog ? isCultureFitCategory(catalog.category) : true) {
      culture.push(item);
    } else {
      culture.push(item);
    }
  }
  return { qualifications, culture };
}

export function resolveScreeningKnockout(
  item: ScreeningAnswerItem,
  questions?: Array<{ id: string; catalogSlug?: string | null; knockout?: ScreeningKnockoutRule | null }>,
): ScreeningKnockoutRule | null | undefined {
  if (item.knockout?.enabled) return item.knockout;
  const match = questions?.find(
    (question) => question.catalogSlug === item.id || question.id === item.id,
  );
  return match?.knockout;
}

export function getScreeningListChips(
  screening: ApplicationScreening | null | undefined,
): { chips: ScreeningTriageChip[]; cultureCount: number; outcome: ScreeningOutcome | null } {
  if (!screening || screening.status !== 'completed') {
    return { chips: [], cultureCount: 0, outcome: null };
  }

  const questions = screening.answers?.questions ?? [];
  const { qualifications, culture } = partitionScreeningAnswers(questions);
  const failed = new Set(screening.failedQuestionIds ?? []);
  const outcome = screening.outcome ?? null;

  const chips: ScreeningTriageChip[] =
    outcome === 'flagged'
      ? [...qualifications, ...culture]
          .filter((item) => failed.has(item.id))
          .map((item) => {
            const catalog = getScreeningCatalogQuestion(item.id);
            return {
              id: item.id,
              label: catalog?.shortLabel ?? 'Must pass',
              value: formatScreeningAnswerValue(item.type, item.answer, catalog?.unitLabel, true),
              required: formatScreeningRequirementLabel(
                item.type,
                resolveScreeningKnockout(item),
                catalog?.unitLabel,
                true,
              ),
              kind: catalog?.category === 'qualifications' || isQualificationAnswer(item)
                ? 'qualification'
                : 'culture',
              failed: true,
            };
          })
      : [];

  return {
    chips,
    cultureCount: culture.length,
    outcome,
  };
}

export function getScreeningOutcomeLabel(outcome: ScreeningOutcome | null | undefined): string | null {
  if (outcome === 'pass') return 'Qualified';
  if (outcome === 'flagged') return 'Flagged';
  if (outcome === 'incomplete') return 'Incomplete';
  return null;
}
