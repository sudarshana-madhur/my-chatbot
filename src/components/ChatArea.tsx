"use client";

import { useEffect, useRef } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import MessageBubble from "./MessageBubble";

interface Message {
  text: string;
  sender: string;
}

export default function ChatArea({
  messages,
  isLoading,
  isWindowLoading,
}: {
  messages: Message[];
  isLoading: boolean;
  isWindowLoading: boolean;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll automatically when a new message is added
    if (messages.length > prevMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];

      // Small delay to ensure DOM is updated before scrolling
      setTimeout(() => {
        if (lastMessage.sender === "user") {
          // For user messages, scroll to the bottom
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } else {
          // For AI responses, scroll to the start of the message
          lastMessageRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 50);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, messages]);

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflowY: "auto",
        overflowX: "hidden",
        p: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {!isWindowLoading &&
        messages.map((msg, index) => (
          <Box
            key={index}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            <MessageBubble
              message={msg}
              isLoading={messages.length === index + 1 && isLoading}
            />
          </Box>
        ))}
      {messages.length === 0 && !isWindowLoading ? (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <Box
            component="img"
            src="/icons/round/android-chrome-192x192.png"
            alt="Logo"
            sx={{
              width: { xs: 80, md: 120 },
              height: { xs: 80, md: 120 },
              mb: 2,
              opacity: 0.5,
            }}
          />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2rem", md: "3.5rem" },
              opacity: 0.2,
              textAlign: "center",
            }}
          >
            HI!
          </Typography>
        </Box>
      ) : null}
      {isWindowLoading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <div ref={messagesEndRef} />
    </Box>
  );
}
