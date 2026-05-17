import type { AppProps } from "next/app";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "@/hooks/useAuth";
import Head from 'next/head';

const theme = createTheme({ palette: { mode: "light", primary: { main: "#0ea5e9" } } });

function ensureMatchMediaCompatibility() {
  if (typeof window === "undefined") return;

  const fallbackMatchMedia = (query: string): MediaQueryList => {
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => true,
    };

    return mediaQueryList as MediaQueryList;
  };

  const originalMatchMedia = window.matchMedia?.bind(window);

  window.matchMedia = (query: string): MediaQueryList => {
    const media = originalMatchMedia?.(query) ?? fallbackMatchMedia(query);
    const compatibleMedia = media as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };

    if (!compatibleMedia.addListener) {
      compatibleMedia.addListener = (listener) =>
        compatibleMedia.addEventListener(
          "change",
          listener as EventListener
        );
    }
    if (!compatibleMedia.removeListener) {
      compatibleMedia.removeListener = (listener) =>
        compatibleMedia.removeEventListener(
          "change",
          listener as EventListener
        );
    }

    return compatibleMedia;
  };
}

ensureMatchMediaCompatibility();

export default function App({ Component, pageProps }: AppProps) {
  ensureMatchMediaCompatibility();

  return (
    <>
      <Head>
        <title>Vivid Smiles Management</title>
        <link rel="icon" href="/assets/images/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/assets/images/favicon.png" type="image/png" />
        <link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}
