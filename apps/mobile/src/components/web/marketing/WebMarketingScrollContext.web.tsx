import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type { ScrollView, View } from 'react-native';

/** Matches sticky marketing nav height + breathing room. */
export const MARKETING_SECTION_SCROLL_OFFSET = 88;

type WebMarketingScrollContextValue = {
  registerSection: (id: string, node: View | null) => void;
  scrollToSection: (id: string) => void;
  setScrollRef: (ref: ScrollView | null) => void;
  setContentRef: (ref: View | null) => void;
};

const WebMarketingScrollContext = createContext<WebMarketingScrollContextValue | null>(null);

export function useWebMarketingScroll() {
  return useContext(WebMarketingScrollContext);
}

export function WebMarketingScrollProvider({ children }: { children: ReactNode }) {
  const sectionRefs = useRef<Record<string, View | null>>({});
  const scrollRef = useRef<ScrollView | null>(null);
  const contentRef = useRef<View | null>(null);

  const registerSection = useCallback((id: string, node: View | null) => {
    if (node) {
      sectionRefs.current[id] = node;
      return;
    }
    delete sectionRefs.current[id];
  }, []);

  const setScrollRef = useCallback((ref: ScrollView | null) => {
    scrollRef.current = ref;
  }, []);

  const setContentRef = useCallback((ref: View | null) => {
    contentRef.current = ref;
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const section = sectionRefs.current[id];
    const content = contentRef.current;
    if (section && content) {
      section.measureLayout(
        content,
        (_x, y) => {
          scrollRef.current?.scrollTo({
            y: Math.max(0, y - MARKETING_SECTION_SCROLL_OFFSET),
            animated: true,
          });
        },
        () => {
          if (typeof document !== 'undefined') {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        },
      );
      return;
    }

    if (typeof document !== 'undefined') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const value = useMemo(
    () => ({
      registerSection,
      scrollToSection,
      setScrollRef,
      setContentRef,
    }),
    [registerSection, scrollToSection, setScrollRef, setContentRef],
  );

  return (
    <WebMarketingScrollContext.Provider value={value}>{children}</WebMarketingScrollContext.Provider>
  );
}
