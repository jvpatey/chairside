import * as FileSystem from 'expo-file-system/legacy';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { ResumePreviewModal } from '@/components/resume/ResumePreviewModal';
import {
  downloadResumeToCache,
  registerResumePreviewOpener,
} from '@/lib/openResumePreview';

type ResumePreviewContextValue = {
  openResumePreview: (storagePath: string, fileName?: string) => Promise<void>;
  closeResumePreview: () => void;
};

const ResumePreviewContext = createContext<ResumePreviewContextValue | null>(null);

type PreviewRequest = {
  storagePath: string;
  fileName: string;
};

export function ResumePreviewProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState('resume.pdf');
  const requestRef = useRef<PreviewRequest | null>(null);
  const cachedUriRef = useRef<string | null>(null);
  const loadRequestIdRef = useRef(0);

  const clearCachedFile = useCallback(async (uri: string | null) => {
    if (!uri) return;

    if (Platform.OS === 'web' && uri.startsWith('blob:')) {
      URL.revokeObjectURL(uri);
      return;
    }

    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }
    } catch {
      // Best-effort cache cleanup.
    }
  }, []);

  const closeResumePreview = useCallback(() => {
    loadRequestIdRef.current += 1;
    setVisible(false);
    setIsLoading(false);
    setError(null);
    setLocalUri(null);
    requestRef.current = null;

    void clearCachedFile(cachedUriRef.current);
    cachedUriRef.current = null;
  }, [clearCachedFile]);

  const loadPreview = useCallback(async (request: PreviewRequest) => {
    const requestId = ++loadRequestIdRef.current;
    requestRef.current = request;
    setVisible(true);
    setIsLoading(true);
    setError(null);
    setLocalUri(null);
    setFileName(request.fileName);

    if (cachedUriRef.current) {
      await clearCachedFile(cachedUriRef.current);
      cachedUriRef.current = null;
    }

    try {
      const uri = await downloadResumeToCache(request.storagePath, request.fileName);
      if (requestId !== loadRequestIdRef.current) {
        void clearCachedFile(uri);
        return;
      }

      cachedUriRef.current = uri;
      setLocalUri(uri);
    } catch (loadError) {
      if (requestId !== loadRequestIdRef.current) return;

      const message =
        loadError instanceof Error ? loadError.message : 'Could not open resume.';
      setError(message);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [clearCachedFile]);

  const openResumePreview = useCallback(
    async (storagePath: string, nextFileName = 'resume.pdf') => {
      await loadPreview({ storagePath, fileName: nextFileName });
    },
    [loadPreview],
  );

  useEffect(() => {
    registerResumePreviewOpener(openResumePreview);
    return () => registerResumePreviewOpener(null);
  }, [openResumePreview]);

  const handleRetry = useCallback(() => {
    const request = requestRef.current;
    if (!request) {
      closeResumePreview();
      return;
    }

    void loadPreview(request);
  }, [closeResumePreview, loadPreview]);

  const handlePdfError = useCallback((message: string) => {
    setError(message);
  }, []);

  const value = useMemo(
    () => ({
      openResumePreview,
      closeResumePreview,
    }),
    [closeResumePreview, openResumePreview],
  );

  return (
    <ResumePreviewContext.Provider value={value}>
      {children}
      <ResumePreviewModal
        visible={visible}
        fileName={fileName}
        localUri={localUri}
        isLoading={isLoading}
        error={error}
        onClose={closeResumePreview}
        onRetry={handleRetry}
        onPdfError={handlePdfError}
      />
    </ResumePreviewContext.Provider>
  );
}

export function useResumePreview() {
  const context = useContext(ResumePreviewContext);
  if (!context) {
    throw new Error('useResumePreview must be used within ResumePreviewProvider');
  }

  return context;
}
