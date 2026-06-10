import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Tabs, Tab, Card, CardContent, 
  Chip, Button, Select, MenuItem, FormControl, InputLabel, 
  Pagination, CircularProgress, Alert
} from '@mui/material';
import axios from 'axios';

// Live API provided in instructions
const LIVE_API_URL = 'http://4.224.186.213/evaluation-service/notifications';
// Fallback local API
const LOCAL_API_URL = 'http://localhost:5000/api/notifications';

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [typeFilter, setTypeFilter] = useState('');
  const [readState, setReadState] = useState({});
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit);
      if (page) params.append('page', page);
      if (typeFilter) params.append('notification_type', typeFilter);
      
      let response;
      try {
        response = await axios.get(`${LIVE_API_URL}?${params.toString()}`);
      } catch (err) {
        console.warn('Live API failed, falling back to local utility server.');
        response = await axios.get(`${LOCAL_API_URL}?${params.toString()}`);
      }

      let fetchedData = [];
      if (response.data && response.data.notifications) {
        fetchedData = response.data.notifications;
      } else if (Array.isArray(response.data)) {
        fetchedData = response.data;
      }

      // Priority Inbox View (Stage 1 Logic) applied on frontend if it wasn't pre-sorted
      if (tabValue === 1) {
        const categoryWeights = { 'Placement': 3, 'Result': 2, 'Event': 1 };
        fetchedData.sort((a, b) => {
            const weightA = categoryWeights[a.Type] || 0;
            const weightB = categoryWeights[b.Type] || 0;
            if (weightA !== weightB) {
                return weightB - weightA;
            }
            const timeA = new Date(a.Timestamp).getTime();
            const timeB = new Date(b.Timestamp).getTime();
            return timeB - timeA;
        });
      }
      
      setNotifications(fetchedData);

      // Determine total pages. If external API doesn't send 'total', default to 10 (total notifications from mockup).
      let totalItems = response.data && response.data.total ? response.data.total : 10;
      setTotalPages(Math.ceil(totalItems / limit) || 1);
    } catch (err) {
      setError('Failed to fetch notifications. Ensure the backend utility server is running if the live API is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, [page, limit, typeFilter, tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1); // Reset pagination
  };

  const handleMarkRead = (id) => {
    setReadState(prev => ({ ...prev, [id]: true }));
  };

  const getChipColor = (type) => {
    switch (type) {
      case 'Placement': return 'success';
      case 'Result': return 'primary';
      case 'Event': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
        Notification Control Panel
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Notifications" />
          <Tab label="Priority Inbox View" />
        </Tabs>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select
            value={typeFilter}
            label="Filter by Type"
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <MenuItem value=""><em>All</em></MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Items per page</InputLabel>
          <Select
            value={limit}
            label="Items per page"
            onChange={(e) => { setLimit(e.target.value); setPage(1); }}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {notifications.length === 0 ? (
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
              No notifications found.
            </Typography>
          ) : (
            notifications.map(notif => (
              <Card 
                key={notif.ID} 
                sx={{ 
                  mb: 2, 
                  backgroundColor: readState[notif.ID] ? '#f5f5f5' : '#ffffff',
                  borderLeft: readState[notif.ID] ? 'none' : '4px solid #1976d2',
                  transition: 'background-color 0.3s, border-left 0.3s',
                  boxShadow: readState[notif.ID] ? 1 : 3
                }}
              >
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip label={notif.Type} color={getChipColor(notif.Type)} size="small" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notif.Timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body1" 
                      fontWeight={readState[notif.ID] ? 'normal' : 'bold'}
                      color={readState[notif.ID] ? 'text.secondary' : 'text.primary'}
                    >
                      {notif.Message}
                    </Typography>
                  </Box>
                  <Box>
                    {!readState[notif.ID] && (
                      <Button variant="outlined" size="small" onClick={() => handleMarkRead(notif.ID)}>
                        Mark Read
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={(e, val) => setPage(val)} 
              color="primary" 
            />
          </Box>
        </Box>
      )}
    </Container>
  );
}

export default App;
