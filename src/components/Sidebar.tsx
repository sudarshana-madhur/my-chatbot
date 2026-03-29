"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";

import { fetchWithAuth } from "@/lib/api-client";
import Image from "next/image";

const drawerWidth = 260;

interface Chat {
  id: string;
  title: string;
}

export default function Sidebar({
  mobileOpen,
  handleDrawerToggle,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  chatUpdateTrigger = 0,
  chatId,
}: {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat?: () => void;
  chatUpdateTrigger?: number;
  chatId: string | null;
}) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const logout = useAppStore((state) => state.logout);

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
  const handleDeleteClick = () => {
    handleMenuClose();
    if (onDeleteChat) onDeleteChat();
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetchWithAuth("/api/chats");
        if (response.ok) {
          const data = await response.json();
          setChats(data.chats || []);
        }
      } catch (error) {
        console.error("Failed to fetch chats:", error);
      }
    };

    fetchChats();
  }, [chatUpdateTrigger]);

  const drawerContent = (
    <Box
      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Box
        sx={{
          mb: 3,
          px: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
        }}
      >
        <Image
          src="/icons/round/android-chrome-192x192.png"
          alt="Logo"
          width={40}
          height={40}
        />
      </Box>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{
          mb: 2,
          justifyContent: "flex-start",
          px: 2,
          py: 1,
          borderRadius: 2,
        }}
        disableElevation
        fullWidth
        onClick={onNewChat}
      >
        New Chat
      </Button>

      <Divider sx={{ mb: 2 }} />

      <List sx={{ flexGrow: 1, overflowY: "auto" }}>
        {chats.map((chat) => (
          <ListItem key={chat.id} disablePadding>
            <ListItemButton
              sx={{ borderRadius: 1, mb: 0.5 }}
              onClick={() => onSelectChat(chat.id)}
            >
              <ListItemText
                primary={chat.title}
                primaryTypographyProps={{
                  noWrap: true,
                  variant: "body2",
                  sx: { overflow: "hidden", textOverflow: "ellipsis" },
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box
        sx={{ mt: "auto", display: "flex", justifyContent: "flex-end", pt: 1 }}
      >
        <IconButton onClick={handleMenuClick}>
          <MoreVertIcon sx={{ display: { xs: "none", md: "block" } }} />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleDeleteClick} disabled={!chatId}>
            Delete chat
          </MenuItem>
          <MenuItem onClick={handleHistoryNav}>Chat history</MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
