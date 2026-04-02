"use client";

import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import MessageInput from "../components/MessageInput";
import { useAppStore } from "@/store/useAppStore";

import { fetchWithAuth } from "@/lib/api-client";
import Image from "next/image";

const initialMessages: { sender: string; text: string }[] = [];

export default function Home() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isWindowLoading, setIsWindowLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [chatUpdateTrigger, setChatUpdateTrigger] = useState(0);
  const [usagePercentage, setUsagePercentage] = useState<number | null>(null);
  const selectedModel = useAppStore((state) => state.selectedModel);
  const logout = useAppStore((state) => state.logout);
  const isTemporaryChat = useAppStore((state) => state.isTemporaryChat);
  const setTemporaryChat = useAppStore((state) => state.setTemporaryChat);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleHistoryNav = () => {
    handleMenuClose();
    router.push("/history");
  };
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleDeleteChat = async () => {
    handleMenuClose();
    if (chatId) {
      try {
        setIsLoading(true);
        setIsWindowLoading(true);
        const response = await fetchWithAuth("/api/chats", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [chatId] }),
        });

        if (response.ok) {
          setChatUpdateTrigger((prev) => prev + 1);
        } else {
          console.error("Failed to delete chat");
        }
      } catch (error) {
        console.error("Error deleting chat:", error);
      } finally {
        setIsLoading(false);
        setIsWindowLoading(false);
      }
    }

    setChatId(null);
    setMessages(initialMessages);
    setChatUpdateTrigger((prev) => prev + 1);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNewChat = () => {
    setChatId(null);
    setMessages(initialMessages);
    setTemporaryChat(false);
    if (mobileOpen) setMobileOpen(false);
  };

  const handleSelectChat = async (id: string) => {
    setChatId(id);
    setMessages(initialMessages);
    setTemporaryChat(false);
    if (mobileOpen) setMobileOpen(false);

    try {
      setIsLoading(true);
      setIsWindowLoading(true);
      const response = await fetchWithAuth(`/api/chats/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else {
        console.error("Failed to fetch chat messages");
      }
    } catch (error) {
      console.error("Error fetching chat messages:", error);
    } finally {
      setIsLoading(false);
      setIsWindowLoading(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setIsLoading(true);

    let isNewChat = false;
    let currentChatId = chatId;
    if (!currentChatId && !isTemporaryChat) {
      currentChatId = crypto.randomUUID();
      setChatId(currentChatId);
      isNewChat = true;
    }

    // Add a placeholder for the AI's response that we'll append to
    setMessages((prev) => [...prev, { sender: "model", text: "" }]);

    try {
      const aiResponse = await fetchWithAuth("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          history: messages,
          chatId: isTemporaryChat ? null : currentChatId,
          model: selectedModel,
          isTemporaryChat,
        }),
      });

      if (!aiResponse.ok) {
        console.error("ERROR");
        setIsLoading(false);
        return;
      }

      if (!aiResponse.body) {
        setIsLoading(false);
        return;
      }

      const reader = aiResponse.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";

      setIsLoading(false); // Hide typing indicator once we start receiving chunks

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          let displayTag = fullText;
          if (fullText.includes("__USAGE__:")) {
            const parts = fullText.split("__USAGE__:");
            displayTag = parts[0];
            const tokenCount = parseInt(parts[1]);
            if (!isNaN(tokenCount)) {
              setUsagePercentage(Math.round((tokenCount / 100000) * 100));
            }
          }

          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessageIndex = newMessages.length - 1;
            newMessages[lastMessageIndex] = {
              ...newMessages[lastMessageIndex],
              text: displayTag,
            };
            return newMessages;
          });
        }
      }

      if (isNewChat) {
        setChatUpdateTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        bgcolor: "background.default",
      }}
    >
      <Sidebar
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        chatUpdateTrigger={chatUpdateTrigger}
        chatId={chatId}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          width: { md: `calc(100% - 260px)` },
          minWidth: 0,
        }}
      >
        <AppBar
          position="static"
          sx={{
            display: { xs: "block", md: "none" },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Box
              sx={{
                flexGrow: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src="/icons/round/android-chrome-192x192.png"
                alt="Logo"
                width={32}
                height={32}
              />
            </Box>
            <IconButton color="inherit" onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleDeleteChat} disabled={!chatId}>
                Delete chat
              </MenuItem>
              <MenuItem onClick={handleHistoryNav}>Chat history</MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <ChatArea
          messages={messages}
          isLoading={isLoading}
          isWindowLoading={isWindowLoading}
        />
        <MessageInput
          onSendMessage={handleSendMessage}
          usagePercentage={usagePercentage}
        />
      </Box>
    </Box>
  );
}
