import type { AppProps } from "next/app";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "@/hooks/useAuth";
import Head from 'next/head';

const theme = createTheme({ palette: { mode: "light", primary: { main: "#0ea5e9" } } });

export default function App({ Component, pageProps }: AppProps) {
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
