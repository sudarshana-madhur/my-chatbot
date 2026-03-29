"use client";

import {
  Box,
  TextField,
  IconButton,
  Paper,
  Button,
  Menu,
  MenuItem,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState, KeyboardEvent, MouseEvent } from "react";
import { useAppStore } from "@/store/useAppStore";
import { GEMINI_MODELS } from "@/lib/constants";

export default function MessageInput({
  onSendMessage,
}: {
  onSendMessage: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const { selectedModel, setModel } = useAppStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={6}
            placeholder="Message..."
            variant="outlined"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "& fieldset": {
                  border: "none",
                },
              },
            }}
          />
        </Box>
        <Box sx={{ ml: 1, mb: 0.5 }}>
          <IconButton
            onClick={handleSend}
            disabled={!text.trim()}
            sx={{
              backgroundColor: text.trim() ? "primary.main" : "transparent",
              color: text.trim() ? "primary.contrastText" : "text.secondary",
              "&:hover": {
                backgroundColor: text.trim() ? "primary.dark" : "transparent",
              },
              width: 40,
              height: 40,
              "&.Mui-disabled": {
                backgroundColor: "transparent",
                color: "text.disabled",
              },
            }}
          >
            <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Actions Tab */}
      <Box sx={{ display: "flex", mt: 1 }}>
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
    </Paper>
  );
}
