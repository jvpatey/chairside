import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

const SITE_TITLE = 'Chairside — Dental staffing, simplified';
const SITE_DESCRIPTION =
  'One platform for Canadian dental clinics hiring and professionals finding work.';
const THEME_COLOR_LIGHT = '#F2F2F7';
const THEME_COLOR_DARK = '#0C0C0E';
const PRIMARY_COLOR = '#1A6FD4';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <title>{SITE_TITLE}</title>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta name="theme-color" content={THEME_COLOR_LIGHT} media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content={THEME_COLOR_DARK} media="(prefers-color-scheme: dark)" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Chairside" />
        <meta property="og:title" content={SITE_TITLE} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:url" content="https://chairside.app" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={SITE_TITLE} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />

        <link rel="icon" href="/assets/images/favicon.png" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const globalStyles = `
html {
  scroll-behavior: smooth;
}

html,
body,
#root {
  background-color: ${THEME_COLOR_LIGHT};
  min-height: 100%;
}

@media (prefers-color-scheme: dark) {
  html,
  body,
  #root {
    background-color: ${THEME_COLOR_DARK};
  }
}

::selection {
  background-color: rgba(26, 111, 212, 0.2);
  color: inherit;
}

@media (prefers-color-scheme: dark) {
  ::selection {
    background-color: rgba(74, 154, 255, 0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@keyframes chairside-headline-shimmer {
  0% {
    background-position: 120% 0;
  }
  100% {
    background-position: -20% 0;
  }
}

*:focus {
  outline: none;
}

*:focus-visible {
  outline: 2px solid ${PRIMARY_COLOR};
  outline-offset: 2px;
}

@media (prefers-color-scheme: dark) {
  *:focus-visible {
    outline-color: #4A9AFF;
  }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(120, 120, 128, 0.35);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(120, 120, 128, 0.55);
}

textarea:focus,
input:focus {
  outline: none;
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active,
textarea:-webkit-autofill,
textarea:-webkit-autofill:hover,
textarea:-webkit-autofill:focus,
textarea:-webkit-autofill:active {
  border-radius: 12px;
  -webkit-box-shadow: 0 0 0 1000px #FFFFFF inset !important;
  box-shadow: 0 0 0 1000px #FFFFFF inset !important;
  -webkit-text-fill-color: #1C1C1E !important;
  caret-color: #1C1C1E;
  transition: background-color 5000s ease-in-out 0s;
}

@media (prefers-color-scheme: dark) {
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active,
  textarea:-webkit-autofill,
  textarea:-webkit-autofill:hover,
  textarea:-webkit-autofill:focus,
  textarea:-webkit-autofill:active {
    border-radius: 12px;
    -webkit-box-shadow: 0 0 0 1000px #1C1C1E inset !important;
    box-shadow: 0 0 0 1000px #1C1C1E inset !important;
    -webkit-text-fill-color: #FFFFFF !important;
    caret-color: #FFFFFF;
  }
}`;
