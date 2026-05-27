import { getWorkerResumeDownloadRequest } from '@chairside/api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Linking, Platform } from 'react-native';

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

async function downloadResumeToCache(storagePath: string, fileName: string): Promise<string> {
  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error('Device cache is unavailable');
  }

  const localUri = `${cacheDirectory}${sanitizeResumeFileName(fileName)}-${Date.now()}.pdf`;
  const { url, headers } = await getWorkerResumeDownloadRequest(storagePath);
  const download = await FileSystem.downloadAsync(url, localUri, { headers });

  if (download.status !== 200) {
    throw new Error(`Could not download resume (${download.status})`);
  }

  const info = await FileSystem.getInfoAsync(localUri);
  if (!info.exists) {
    throw new Error('Could not save resume preview');
  }
  if ('size' in info && info.size === 0) {
    throw new Error('Resume file is empty. Upload your resume again.');
  }

  return localUri;
}

export async function openResumePreview(storagePath: string, fileName = 'resume.pdf') {
  const localUri = await downloadResumeToCache(storagePath, fileName);

  if (Platform.OS === 'ios') {
    try {
      await Linking.openURL(localUri);
      return;
    } catch {
      // Fall back to share sheet below.
    }
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Could not open resume on this device');
  }

  await Sharing.shareAsync(localUri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: fileName,
  });
}
