"use client";

import { useAppStore } from "@/store/useAppStore";
import LoginScreen from "./LoginScreen";
import { Box, CircularProgress } from "@mui/material";

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const isInitialized = useAppStore((state) => state.isInitialized);

  if (!isInitialized) {
    return (
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
