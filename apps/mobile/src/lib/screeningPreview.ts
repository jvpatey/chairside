import type { ScreeningQuestion } from '@chairside/api';
import {
  formatScreeningPromptTemplate,
  getScreeningCatalogQuestion,
  type ScreeningPromptContext,
  type ScreeningQuestionType,
} from '@chairside/config';

type PreviewCustomQuestion = {
  id: string;
  prompt: string;
  type: ScreeningQuestionType;
};

export function buildPreviewScreeningQuestions(
  selectedCatalogSlugs: string[],
  customQuestions: PreviewCustomQuestion[],
  promptContext?: ScreeningPromptContext,
): ScreeningQuestion[] {
  const catalogQuestions: ScreeningQuestion[] = selectedCatalogSlugs.flatMap((slug) => {
    const preset = getScreeningCatalogQuestion(slug);
    if (!preset) return [];

    return [
      {
        id: slug,
        catalogSlug: slug,
        customPrompt: null,
        type: preset.type,
        prompt: formatScreeningPromptTemplate(preset.prompt, promptContext),
        sortOrder: preset.sortOrder,
        reverseScored: preset.reverseScored ?? false,
        min: preset.min,
        max: preset.max,
        unitLabel: preset.unitLabel,
      },
    ];
  });

  const custom: ScreeningQuestion[] = customQuestions.map((question, index) => ({
    id: question.id,
    catalogSlug: null,
    customPrompt: question.prompt,
    type: question.type,
    prompt: question.prompt,
    sortOrder: 1000 + index,
    reverseScored: false,
  }));

  return [...catalogQuestions, ...custom].sort((a, b) => a.sortOrder - b.sortOrder);
}
