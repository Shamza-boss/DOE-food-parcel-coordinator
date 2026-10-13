"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: { main: "#1E4D3A", contrastText: "#F7F3EA" },
    secondary: { main: "#8C4A22" },
    background: { default: "#F4F1EA", paper: "#FFFDF8" },
    text: { primary: "#1C2416", secondary: "#5C6556" },
    error: { main: "#8E2F2F" },
    success: { main: "#2F6B45" },
    divider: "#E3DCCA",
  },
  typography: {
    fontFamily: "var(--font-plex), Helvetica, Arial, sans-serif",
    h4: { fontWeight: 600, letterSpacing: "-0.03em", fontSize: "1.75rem" },
    h5: { fontWeight: 600, letterSpacing: "-0.02em" },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: "#E3DCCA", padding: "8px 10px" },
        head: { fontWeight: 600, backgroundColor: "#E7EFEA", color: "#1C2416" },
      },
    },
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
