"use client";
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0f0f0f",
      paper: "#1e1e1e",
    },
    primary: {
      main: "#90caf9",
      contrastText: "#0f0f0f",
    },
    secondary: {
      main: "#f48fb1",
      contrastText: "#0f0f0f",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b3b3b3",
    },
  },
  typography: {
    fontFamily: "var(--font-roboto)",
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#171717",
          borderRight: "1px solid #2e2e2e",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#0f0f0f",
          borderBottom: "1px solid #2e2e2e",
          boxShadow: "none",
        },
      },
    },
  },
});

export default theme;
