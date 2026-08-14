import type { ScreeningQuestion } from '@chairside/api';
import type { RatingScaleValue } from '@chairside/config';

export type ScreeningAnswerValue = boolean | RatingScaleValue | number | string;

export function getScreeningQuestionKey(question: ScreeningQuestion): string {
  return question.catalogSlug ?? question.id;
}

export function isScreeningAnswerComplete(
  question: ScreeningQuestion,
  answer: ScreeningAnswerValue | undefined,
): boolean {
  if (answer === undefined) return false;
  if (question.type === 'number') {
    return typeof answer === 'number' && !Number.isNaN(answer);
  }
  if (question.type === 'text') {
    return typeof answer === 'string' && answer.trim().length > 0;
  }
  if (question.type === 'yes_no') {
    return typeof answer === 'boolean';
  }
  if (question.type === 'rating_1_5') {
    return typeof answer === 'number' && answer >= 1 && answer <= 5;
  }
  return true;
}

export function isScreeningFormComplete(
  questions: ScreeningQuestion[],
  answers: Record<string, ScreeningAnswerValue | undefined>,
): boolean {
  return questions.every((question) =>
    isScreeningAnswerComplete(question, answers[getScreeningQuestionKey(question)]),
  );
}

export function countAnsweredQuestions(
  questions: ScreeningQuestion[],
  answers: Record<string, ScreeningAnswerValue | undefined>,
): number {
  return questions.filter((question) =>
    isScreeningAnswerComplete(question, answers[getScreeningQuestionKey(question)]),
  ).length;
}

export function sortScreeningQuestions(questions: ScreeningQuestion[]): ScreeningQuestion[] {
  return [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
}
