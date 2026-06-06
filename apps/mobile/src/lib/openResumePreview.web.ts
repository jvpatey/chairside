import { getWorkerResumeDownloadRequest } from '@chairside/api';

export function sanitizeResumeFileName(fileName: string) {
  return fileName.replace(/[^\w.-]+/g, '_') || 'resume.pdf';
}

export function buildResumeFileName(options: {
  workerDisplayName?: string | null;
  postTitle?: string | null;
  resumeFileName?: string | null;
}): string {
  if (options.resumeFileName?.trim()) {
    return sanitizeResumeFileName(options.resumeFileName);
  }
  const base = options.workerDisplayName?.trim() || options.postTitle?.trim() || 'resume';
  return `${sanitizeResumeFileName(base)}-resume.pdf`;
}

export async function downloadResumeToCache(storagePath: string, _fileName: string): Promise<string> {
  const { url, headers } = await getWorkerResumeDownloadRequest(storagePath);
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`Could not download resume (${response.status})`);
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error('Resume file is empty. Upload your resume again.');
  }

  return URL.createObjectURL(blob);
}

type ResumePreviewOpener = (storagePath: string, fileName: string) => Promise<void>;

let resumePreviewOpener: ResumePreviewOpener | null = null;

export function registerResumePreviewOpener(opener: ResumePreviewOpener | null) {
  resumePreviewOpener = opener;
}

export async function openResumePreview(storagePath: string, fileName = 'resume.pdf') {
  if (!resumePreviewOpener) {
    throw new Error('Resume preview is not available');
  }

  await resumePreviewOpener(storagePath, fileName);
}
