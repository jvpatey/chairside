import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { PDFDocument } from 'pdf-lib';
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

import {
  buildApplicationPdfPacketFileName,
  buildApplicationPdfPacketHtml,
  canGenerateApplicationPdfPacket,
  type ApplicationPdfPacketOptions,
} from '@/lib/applicationPdfPacketContent';
import {
  buildResumeFileName,
  downloadResumeToCache,
  sanitizeResumeFileName,
} from '@/lib/openResumePreview';

export type { ApplicationPdfPacketOptions } from '@/lib/applicationPdfPacketContent';
export {
  buildApplicationPdfPacketHtml,
  canGenerateApplicationPdfPacket,
} from '@/lib/applicationPdfPacketContent';

export type ApplicationPdfPacketResult = {
  uri: string;
  fileName: string;
  resumeAttached: boolean;
  resumeMergeWarning?: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function readPdfBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Could not read PDF (${response.status})`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function writePdfBytes(bytes: Uint8Array, fileName: string): Promise<string> {
  if (Platform.OS === 'web') {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }

  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory) {
    throw new Error('Device cache is unavailable');
  }

  const uri = `${cacheDirectory}${sanitizeResumeFileName(fileName)}-${Date.now()}.pdf`;
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

async function mergePdfDocuments(summaryUri: string, attachmentUri: string): Promise<Uint8Array> {
  const summaryBytes = await readPdfBytes(summaryUri);
  const attachmentBytes = await readPdfBytes(attachmentUri);

  const summaryPdf = await PDFDocument.load(summaryBytes);
  const attachmentPdf = await PDFDocument.load(attachmentBytes);
  const mergedPdf = await PDFDocument.create();

  const summaryPages = await mergedPdf.copyPages(summaryPdf, summaryPdf.getPageIndices());
  summaryPages.forEach((page) => mergedPdf.addPage(page));

  const attachmentPages = await mergedPdf.copyPages(
    attachmentPdf,
    attachmentPdf.getPageIndices(),
  );
  attachmentPages.forEach((page) => mergedPdf.addPage(page));

  return mergedPdf.save();
}

export async function generateApplicationPdfPacket(
  options: ApplicationPdfPacketOptions,
): Promise<ApplicationPdfPacketResult> {
  if (!canGenerateApplicationPdfPacket(options.application)) {
    throw new Error('Application kit must be submitted before generating a candidate packet.');
  }

  const fileName = buildApplicationPdfPacketFileName(options.application);
  const html = buildApplicationPdfPacketHtml(options);
  const { uri: summaryUri } = await Print.printToFileAsync({ html });

  let resumeAttached = false;
  let resumeMergeWarning: string | undefined;
  let packetUri = summaryUri;

  if (options.application.resume_storage_path) {
    try {
      const resumeFileName = buildResumeFileName({
        workerDisplayName: options.application.worker_display_name,
        postTitle: options.application.post_title,
      });
      const resumeUri = await downloadResumeToCache(
        options.application.resume_storage_path,
        resumeFileName,
      );
      const mergedBytes = await mergePdfDocuments(summaryUri, resumeUri);
      packetUri = await writePdfBytes(mergedBytes, fileName);
      resumeAttached = true;
    } catch (error) {
      resumeMergeWarning =
        error instanceof Error
          ? `Summary created, but the resume could not be attached: ${error.message}`
          : 'Summary created, but the resume could not be attached.';
    }
  }

  return {
    uri: packetUri,
    fileName,
    resumeAttached,
    resumeMergeWarning,
  };
}

export async function shareApplicationPdfPacket(result: ApplicationPdfPacketResult): Promise<void> {
  if (Platform.OS === 'web') {
    const link = document.createElement('a');
    link.href = result.uri;
    link.download = result.fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(result.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: result.fileName,
  });
}

export async function generateAndShareApplicationPdfPacket(
  options: ApplicationPdfPacketOptions,
): Promise<ApplicationPdfPacketResult> {
  const result = await generateApplicationPdfPacket(options);
  await shareApplicationPdfPacket(result);
  return result;
}

export { buildApplicationPdfPacketFileName };
