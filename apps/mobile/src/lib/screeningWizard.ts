import type { ScreeningQuestion } from '@chairside/api';
import type { RatingScaleValue } from '@chairside/config';

export type ScreeningAnswerValue = boolean | RatingScaleValue | number | string;

export type ScreeningWizardPage =
  | { kind: 'intro' }
  | { kind: 'questions'; questions: ScreeningQuestion[] }
  | { kind: 'review' };

const YES_NO_PAGE_SIZE = 4;

export function buildScreeningWizardPages(questions: ScreeningQuestion[]): ScreeningWizardPage[] {
  const sorted = [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
  const pages: ScreeningWizardPage[] = [{ kind: 'intro' }];

  let yesNoBuffer: ScreeningQuestion[] = [];
  let ratingBuffer: ScreeningQuestion[] = [];

  const flushYesNo = () => {
    for (let index = 0; index < yesNoBuffer.length; index += YES_NO_PAGE_SIZE) {
      pages.push({
        kind: 'questions',
        questions: yesNoBuffer.slice(index, index + YES_NO_PAGE_SIZE),
      });
    }
    yesNoBuffer = [];
  };

  const flushRating = () => {
    if (ratingBuffer.length > 0) {
      pages.push({ kind: 'questions', questions: ratingBuffer });
      ratingBuffer = [];
    }
  };

  for (const question of sorted) {
    if (question.type === 'yes_no') {
      flushRating();
      yesNoBuffer.push(question);
    } else if (question.type === 'rating_1_5') {
      flushYesNo();
      ratingBuffer.push(question);
    } else if (question.type === 'number' || question.type === 'text') {
      flushYesNo();
      flushRating();
      pages.push({ kind: 'questions', questions: [question] });
    }
  }

  flushYesNo();
  flushRating();

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
  answers: Record<string, ScreeningAnswerValue | undefined>,
): boolean {
  if (page.kind !== 'questions') return true;

  return page.questions.every((question) => {
    const key = getScreeningQuestionKey(question);
    const answer = answers[key];
    if (answer === undefined) return false;
    if (question.type === 'number') {
      return typeof answer === 'number' && !Number.isNaN(answer);
    }
    if (question.type === 'text') {
      return typeof answer === 'string' && answer.trim().length > 0;
    }
    return true;
  });
}

export function countAnsweredQuestions(
  questions: ScreeningQuestion[],
  answers: Record<string, ScreeningAnswerValue | undefined>,
): number {
  return questions.filter((question) => {
    const answer = answers[getScreeningQuestionKey(question)];
    return answer !== undefined;
  }).length;
}
