import { downloadWorkerResume } from '@chairside/api';
import { PDFDocument } from 'pdf-lib';

import {
  buildApplicationPdfPacketFileName,
  buildApplicationPdfPacketHtml,
  canGenerateApplicationPdfPacket,
  type ApplicationPdfPacketOptions,
  type ApplicationPdfPacketResult,
} from '@/lib/applicationPdfPacketContent';
import { withPacketScreeningQuestions } from '@/lib/applicationPdfPacketQuestions';

export type { ApplicationPdfPacketOptions, ApplicationPdfPacketResult } from '@/lib/applicationPdfPacketContent';
export {
  buildApplicationPdfPacketHtml,
  canGenerateApplicationPdfPacket,
} from '@/lib/applicationPdfPacketContent';

function mountHtmlForCapture(html: string): HTMLElement {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '816px';
  container.style.background = '#ffffff';
  container.style.pointerEvents = 'none';

  const styleEl = document.createElement('style');
  styleEl.textContent = parsed.querySelector('style')?.textContent ?? '';
  container.appendChild(styleEl);

  const pageEl = parsed.querySelector('.page');
  const pageClone = (pageEl ? pageEl.cloneNode(true) : parsed.body.cloneNode(true)) as HTMLElement;
  if (pageClone instanceof HTMLElement) {
    pageClone.style.padding = '0';
  }
  container.appendChild(pageClone);

  document.body.appendChild(container);
  return container;
}

const PAGE_MARGIN_X_PT = 40;
const PAGE_MARGIN_TOP_PT = 36;
const PAGE_MARGIN_BOTTOM_PT = 32;

async function htmlToPdfBytes(html: string): Promise<Uint8Array> {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);
  const html2canvas = html2canvasModule.default;

  const container = mountHtmlForCapture(html);

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: 816,
      height: container.scrollHeight,
      windowWidth: 816,
      windowHeight: container.scrollHeight,
    });

    const pdf = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pdfWidth - PAGE_MARGIN_X_PT * 2;
    const contentHeight = pdfHeight - PAGE_MARGIN_TOP_PT - PAGE_MARGIN_BOTTOM_PT;
    const scale = contentWidth / canvas.width;
    const pageSliceHeightPx = contentHeight / scale;

    let sourceY = 0;
    let pageIndex = 0;
    while (sourceY < canvas.height - 0.5) {
      const sliceHeightPx = Math.min(pageSliceHeightPx, canvas.height - sourceY);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.max(1, Math.ceil(sliceHeightPx));
      const ctx = sliceCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not prepare candidate packet page.');
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      );

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        sliceCanvas.toDataURL('image/jpeg', 0.92),
        'JPEG',
        PAGE_MARGIN_X_PT,
        PAGE_MARGIN_TOP_PT,
        contentWidth,
        sliceHeightPx * scale,
      );
      sourceY += sliceHeightPx;
      pageIndex += 1;
    }

    return new Uint8Array(pdf.output('arraybuffer'));
  } finally {
    document.body.removeChild(container);
  }
}

function createHtmlPreviewUri(html: string): string {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  return URL.createObjectURL(blob);
}

async function writePdfBytes(bytes: Uint8Array): Promise<string> {
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
}

async function mergePdfBytes(
  summaryBytes: Uint8Array,
  attachmentBytes: Uint8Array,
): Promise<Uint8Array> {
  const summaryPdf = await PDFDocument.load(summaryBytes, { ignoreEncryption: true });
  const attachmentPdf = await PDFDocument.load(attachmentBytes, { ignoreEncryption: true });
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

async function buildPdfPacketUri(
  options: ApplicationPdfPacketOptions,
  html: string,
): Promise<{ uri: string; resumeAttached: boolean; resumeMergeWarning?: string }> {
  const summaryBytes = await htmlToPdfBytes(html);

  if (!options.application.resume_storage_path) {
    return { uri: await writePdfBytes(summaryBytes), resumeAttached: false };
  }

  try {
    const resumeBuffer = await downloadWorkerResume(options.application.resume_storage_path);
    const mergedBytes = await mergePdfBytes(summaryBytes, new Uint8Array(resumeBuffer));
    return {
      uri: await writePdfBytes(mergedBytes),
      resumeAttached: true,
    };
  } catch (error) {
    return {
      uri: await writePdfBytes(summaryBytes),
      resumeAttached: false,
      resumeMergeWarning:
        error instanceof Error
          ? `Summary created, but the resume could not be attached: ${error.message}`
          : 'Summary created, but the resume could not be attached.',
    };
  }
}

export async function generateApplicationPdfPacket(
  options: ApplicationPdfPacketOptions,
): Promise<ApplicationPdfPacketResult> {
  if (!canGenerateApplicationPdfPacket(options.application)) {
    throw new Error('Full application must be submitted before generating a candidate packet.');
  }

  const resolved = await withPacketScreeningQuestions(options);
  const fileName = buildApplicationPdfPacketFileName(resolved.application);
  const html = buildApplicationPdfPacketHtml(resolved);

  return {
    uri: createHtmlPreviewUri(html),
    previewKind: 'html',
    sourceHtml: html,
    exportOptions: resolved,
    fileName,
    resumeAttached: Boolean(resolved.application.resume_storage_path),
  };
}

export async function resolveApplicationPdfDownloadUri(
  result: ApplicationPdfPacketResult,
): Promise<{ uri: string; resumeMergeWarning?: string }> {
  if (result.exportPdfUri) {
    return {
      uri: result.exportPdfUri,
      resumeMergeWarning: result.resumeMergeWarning,
    };
  }

  if (result.previewKind !== 'html' || !result.exportOptions) {
    return { uri: result.uri, resumeMergeWarning: result.resumeMergeWarning };
  }

  const packet = await buildPdfPacketUri(
    result.exportOptions,
    result.sourceHtml ?? buildApplicationPdfPacketHtml(result.exportOptions),
  );

  result.exportPdfUri = packet.uri;
  result.resumeAttached = packet.resumeAttached;
  result.resumeMergeWarning = packet.resumeMergeWarning;

  return {
    uri: packet.uri,
    resumeMergeWarning: packet.resumeMergeWarning,
  };
}

function printPdfUri(pdfUri: string): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '0';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.border = '0';
  iframe.src = pdfUri;

  let didPrint = false;
  const triggerPrint = () => {
    if (didPrint) return;
    didPrint = true;
    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      window.setTimeout(() => {
        iframe.remove();
      }, 1000);
    }, 300);
  };

  iframe.onload = triggerPrint;
  document.body.appendChild(iframe);
  window.setTimeout(triggerPrint, 1500);
}

export async function shareApplicationPdfPacket(result: ApplicationPdfPacketResult): Promise<void> {
  const { uri } = await resolveApplicationPdfDownloadUri(result);
  const link = document.createElement('a');
  link.href = uri;
  link.download = result.fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printApplicationPdfPacket(
  result: ApplicationPdfPacketResult,
): Promise<{ resumeMergeWarning?: string }> {
  return resolveApplicationPdfDownloadUri(result).then(({ uri, resumeMergeWarning }) => {
    printPdfUri(uri);
    return { resumeMergeWarning };
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
