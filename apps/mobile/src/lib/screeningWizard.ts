import type { ScreeningQuestion } from '@chairside/api';
import type { RatingScaleValue } from '@chairside/config';

export type ScreeningWizardPage =
  | { kind: 'intro' }
  | { kind: 'questions'; questions: ScreeningQuestion[] }
  | { kind: 'review' };

const YES_NO_PAGE_SIZE = 4;

export function buildScreeningWizardPages(questions: ScreeningQuestion[]): ScreeningWizardPage[] {
  const yesNoQuestions = questions.filter((question) => question.type === 'yes_no');
  const ratingQuestions = questions.filter((question) => question.type === 'rating_1_5');

  const pages: ScreeningWizardPage[] = [{ kind: 'intro' }];

  for (let index = 0; index < yesNoQuestions.length; index += YES_NO_PAGE_SIZE) {
    pages.push({
      kind: 'questions',
      questions: yesNoQuestions.slice(index, index + YES_NO_PAGE_SIZE),
    });
  }

  if (ratingQuestions.length > 0) {
    pages.push({
      kind: 'questions',
      questions: ratingQuestions,
    });
  }

  if (questions.length > 0) {
    pages.push({ kind: 'review' });
  }

  return pages;
}

export function getScreeningQuestionKey(question: ScreeningQuestion): string {
  return question.catalogSlug ?? question.id;
}

export function isScreeningPageComplete(
  page: ScreeningWizardPage,
  answers: Record<string, boolean | RatingScaleValue | undefined>,
): boolean {
  if (page.kind !== 'questions') return true;

  return page.questions.every((question) => {
    const key = getScreeningQuestionKey(question);
    return answers[key] !== undefined;
  });
}

export function countAnsweredQuestions(
  questions: ScreeningQuestion[],
  answers: Record<string, boolean | RatingScaleValue | undefined>,
): number {
  return questions.filter((question) => answers[getScreeningQuestionKey(question)] !== undefined)
    .length;
}
