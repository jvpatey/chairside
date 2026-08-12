import { getJobPostScreeningQuestions } from '@chairside/api';

import type { ApplicationPdfPacketOptions } from '@/lib/applicationPdfPacketContent';

export async function withPacketScreeningQuestions(
  options: ApplicationPdfPacketOptions,
): Promise<ApplicationPdfPacketOptions> {
  if (options.screeningQuestions || !options.application.job_post_id) {
    return options;
  }

  try {
    return {
      ...options,
      screeningQuestions: await getJobPostScreeningQuestions(options.application.job_post_id),
    };
  } catch {
    return options;
  }
}
