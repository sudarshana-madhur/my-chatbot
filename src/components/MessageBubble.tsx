"use client";

import { Box, Typography, Link } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import TypingIndicator from "./TypingIndicator";

interface Message {
  text: string;
  sender: string;
}

export default function MessageBubble({
  message,
  isLoading,
}: {
  message: Message;
  isLoading: boolean;
}) {
  const isUser = message.sender === "user";

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 3,
        width: "100%",
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: "100%", sm: "95%", md: "85%" },
          minWidth: 0,
          overflowX: "auto",
          backgroundColor: isUser ? "background.paper" : "background.default",
          color: isUser ? "text.primary" : "text.primary",
          borderRadius: 2,
          p: 2,
          boxShadow: isUser ? 0 : 1,
          overflowWrap: "break-word",
          wordBreak: "break-word",
        }}
      >
        {isLoading ? (
          <TypingIndicator />
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            /* eslint-disable @typescript-eslint/no-unused-vars */
            components={{
              p: ({ node, ...props }) => (
                <Typography
                  variant="body1"
                  sx={{
                    mb: 1,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.6,
                  }}
                  {...props}
                />
              ),
              a: ({ node, ...props }) => (
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ wordBreak: "break-all" }}
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li style={{ marginBottom: "4px" }}>
                  <Typography
                    variant="body1"
                    component="span"
                    sx={{ lineHeight: 1.6, wordBreak: "break-word" }}
                    {...props}
                  />
                </li>
              ),
              ul: ({ node, ...props }) => (
                <ul
                  style={{ paddingLeft: "24px", margin: "8px 0" }}
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  style={{ paddingLeft: "24px", margin: "8px 0" }}
                  {...props}
                />
              ),
              table: ({ node, ...props }) => (
                <Box sx={{ overflowX: "auto", width: "100%", mb: 2 }}>
                  <table style={{ borderCollapse: "collapse", width: "100%" }} {...props} />
                </Box>
              ),
              th: ({ node, ...props }) => (
                <th style={{ border: "1px solid rgba(128, 128, 128, 0.3)", padding: "8px" }} {...props} />
              ),
              td: ({ node, ...props }) => (
                <td style={{ border: "1px solid rgba(128, 128, 128, 0.3)", padding: "8px" }} {...props} />
              ),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              code({ node, className, children, ...props }: any) {
                const inline = !className?.includes("language-");
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    style={vscDarkPlus as any}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      borderRadius: "8px",
                      margin: "12px 0",
                      maxWidth: "100%",
                      overflowX: "auto",
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className={className}
                    style={{
                      backgroundColor: "rgba(128, 128, 128, 0.2)",
                      padding: "2px 4px",
                      borderRadius: "4px",
                      fontFamily: "monospace",
                      overflowWrap: "anywhere",
                    }}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
            /* eslint-enable @typescript-eslint/no-unused-vars */
          >
            {message.text}
          </ReactMarkdown>
        )}
      </Box>
    </Box>
  );
}
