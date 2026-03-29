'use client';

import { useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, IconButton, Typography, List, ListItem, ListItemText, Checkbox, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

import { fetchWithAuth } from '@/lib/api-client';

interface Chat {
  id: string;
  title: string;
  updatedAt: string;
}

export default function ChatHistory() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('/api/chats');
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedChats);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedChats(newSelected);
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedChats(new Set(chats.map(chat => chat.id)));
    } else {
      setSelectedChats(new Set());
    }
  };

  const handleDeleteClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (selectedChats.size === 0) return;

    try {
      setIsDeleting(true);
      const response = await fetchWithAuth('/api/chats', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedChats) }),
      });

      if (response.ok) {
        setChats(chats.filter(chat => !selectedChats.has(chat.id)));
        setSelectedChats(new Set());
      } else {
        console.error('Failed to delete chats');
      }
    } catch (error) {
      console.error('Error deleting chats:', error);
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  };

  const isAllSelected = chats.length > 0 && selectedChats.size === chats.length;
  const isIndeterminate = selectedChats.size > 0 && selectedChats.size < chats.length;

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => router.push('/')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Chat History
          </Typography>
          <IconButton 
            color="inherit" 
            onClick={handleDeleteClick} 
            disabled={selectedChats.size === 0 || isDeleting}
          >
            <DeleteIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flexGrow: 1, overflowY: 'auto', py: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : chats.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary' }}>
            <Typography variant="body1">No saved chats available.</Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={handleSelectAll}
              />
              <Typography variant="body2" color="text.secondary">
                {selectedChats.size > 0 ? `${selectedChats.size} selected` : 'Select All'}
              </Typography>
            </Box>
            <List>
              {chats.map((chat) => {
                const isSelected = selectedChats.has(chat.id);
                return (
                  <ListItem 
                    key={chat.id} 
                    disablePadding 
                    onClick={() => handleToggle(chat.id)}
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <Checkbox
                      checked={isSelected}
                      tabIndex={-1}
                      disableRipple
                    />
                    <ListItemText 
                      primary={chat.title} 
                      secondary={new Date(chat.updatedAt).toLocaleString()} 
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </Container>

      <Dialog open={confirmOpen} onClose={handleConfirmClose}>
        <DialogTitle>Delete Chats</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedChats.size} selected chat{selectedChats.size > 1 ? 's' : ''}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmClose} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
