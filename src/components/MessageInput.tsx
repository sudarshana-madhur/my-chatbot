"use client";

import {
  Box,
  TextField,
  IconButton,
  Paper,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Typography,
  Snackbar,
  Alert,
  Fade,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import ClearIcon from "@mui/icons-material/Clear";
import { useState, KeyboardEvent, MouseEvent, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { GEMINI_MODELS } from "@/lib/constants";

export default function MessageInput({
  onSendMessage,
  usagePercentage,
}: {
  onSendMessage: (text: string) => void;
  usagePercentage: number | null;
}) {
  const [text, setText] = useState("");
  const { selectedModel, setModel } = useAppStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (isCancelledRef.current) {
          // Stop all tracks to release the microphone
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/aac",
        });
        const formData = new FormData();
        formData.append("audio", audioBlob);

        try {
          const response = await fetch("/api/audio/save", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Failed to save audio");
          }

          const data = await response.json();
          onSendMessage(data.transcribedText);
        } catch (err) {
          setErrorMsg("Failed to save recording. Please try again.");
          setShowError(true);
        } finally {
          setIsProcessing(false);
        }

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMsg("Could not access microphone. Please check permissions.");
      setShowError(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text);
      setText("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleModelClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleModelClose = () => {
    setAnchorEl(null);
  };

  const handleModelSelect = (model: string) => {
    setModel(model);
    handleModelClose();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: "background.default",
        borderTop: "1px solid",
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "flex-end", width: "100%" }}>
        <Box
          sx={{
            flexGrow: 1,
            backgroundColor: "background.paper",
            borderRadius: 2,
            minHeight: 56,
            display: "flex",
            alignItems: "center",
            px: 1,
          }}
        >
          {isRecording ? (
            <Fade in={isRecording}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  width: "100%",
                  px: 1,
                }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "error.main",
                    animation: "pulse 1.5s infinite",
                    "@keyframes pulse": {
                      "0%": { opacity: 1 },
                      "50%": { opacity: 0.3 },
                      "100%": { opacity: 1 },
                    },
                  }}
                />
                <Typography sx={{ color: "text.secondary", fontWeight: 500 }}>
                  Recording: {formatTime(recordingTime)}
                </Typography>
              </Box>
            </Fade>
          ) : (
            <TextField
              fullWidth
              multiline
              maxRows={6}
              placeholder="Message..."
              variant="outlined"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "& fieldset": {
                    border: "none",
                  },
                },
              }}
            />
          )}
        </Box>
        <Box sx={{ ml: 1, mb: 0.5, display: "flex", gap: 0.5 }}>
          {isProcessing ? (
            <Box
              sx={{
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={24} />
            </Box>
          ) : isRecording ? (
            <>
              <IconButton
                onClick={cancelRecording}
                sx={{
                  color: "text.secondary",
                  width: 40,
                  height: 40,
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={stopRecording}
                sx={{
                  backgroundColor: "error.main",
                  color: "white",
                  "&:hover": { backgroundColor: "error.dark" },
                  width: 40,
                  height: 40,
                }}
              >
                <StopIcon fontSize="small" />
              </IconButton>
            </>
          ) : (
            <>
              {!text.trim() && (
                <IconButton
                  onClick={startRecording}
                  sx={{
                    color: "text.secondary",
                    width: 40,
                    height: 40,
                  }}
                >
                  <MicIcon fontSize="small" />
                </IconButton>
              )}
              {text.trim() && (
                <IconButton
                  onClick={handleSend}
                  sx={{
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": { backgroundColor: "primary.dark" },
                    width: 40,
                    height: 40,
                  }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Actions Tab */}
      <Box sx={{ display: "flex", mt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<SmartToyIcon fontSize="small" />}
            endIcon={<ExpandMoreIcon />}
            onClick={handleModelClick}
            sx={{
              borderRadius: 4,
              textTransform: "none",
              color: "text.secondary",
              borderColor: "divider",
              "&:hover": {
                borderColor: "text.secondary",
                backgroundColor: "action.hover",
              },
            }}
          >
            {selectedModel}
          </Button>

          {usagePercentage !== null && (
            <Box
              sx={{
                fontSize: "0.75rem",
                color: "text.secondary",
                bgcolor: "action.selected",
                px: 1,
                py: 0.5,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              {usagePercentage}%
            </Box>
          )}
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleModelClose}
          anchorOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
        >
          {GEMINI_MODELS.map((model) => (
            <MenuItem
              key={model}
              onClick={() => handleModelSelect(model)}
              selected={model === selectedModel}
            >
              {model}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {errorMsg}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
