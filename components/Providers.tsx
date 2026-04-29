"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { useState } from "react";
import { LiffProvider } from "@/contexts/LiffContext";

const theme = createTheme({
  palette: {
    primary: {
      main: "#16a34a",
    },
    error: {
      main: "#dc2626",
    },
    background: {
      default: "#f0fdf4",
    },
  },
  typography: {
    fontFamily: "var(--font-prompt), sans-serif",
    fontSize: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "16px",
          fontSize: "1.1rem",
          fontWeight: 700,
          padding: "14px 24px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
        },
      },
    },
    MuiInputBase: {
      defaultProps: {
        inputProps: { suppressHydrationWarning: true },
      },
      styleOverrides: {
        input: {
          fontSize: "1.1rem",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: "1.05rem",
        },
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LiffProvider>
          {children}
        </LiffProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
