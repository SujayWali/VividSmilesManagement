import { useAuth } from "@/hooks/useAuth";
import { Appointment } from "@/types/models";
import {
  AppBar,
  Box,
  Container,
  Toolbar,
  Typography,
  Paper,
  IconButton,
  Stack,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider
} from "@mui/material";
import {
  CalendarToday,
  ArrowBack,
  ArrowForward,
  Today,
  AccessTime,
  Person,
  Phone,
  DateRange,
  ViewWeek
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const statusColors = {
  "Scheduled": "#2196F3",
  "Confirmed": "#4CAF50",
  "Completed": "#FF9800",
  "Cancelled": "#F44336",
  "No Show": "#9E9E9E"
};

export default function CalendarView() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week'); // Default to week view
  const [customDateRange, setCustomDateRange] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week
    return startOfWeek.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() - today.getDay() + 6); // End of current week
    return endOfWeek.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user, currentDate, viewMode, startDate, endDate]);

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      let queryStartDate: string;
      let queryEndDate: string;

      if (customDateRange) {
        queryStartDate = startDate;
        queryEndDate = endDate;
      } else if (viewMode === 'week') {
        // Calculate current week
        const today = new Date(currentDate);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() - today.getDay() + 6);
        
        queryStartDate = startOfWeek.toISOString().split('T')[0];
        queryEndDate = endOfWeek.toISOString().split('T')[0];
      } else {
        // Month view
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        queryStartDate = startOfMonth.toISOString().split('T')[0];
        queryEndDate = endOfMonth.toISOString().split('T')[0];
      }
      
      const appointmentsRef = collection(db, "appointments");
      const q = query(
        appointmentsRef,
        where("date", ">=", queryStartDate),
        where("date", "<=", queryEndDate),
        orderBy("date"),
        orderBy("time")
      );
      
      const snapshot = await getDocs(q);
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoadingAppointments(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    for (let i = 0; i < 42; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments.filter(apt => apt.date === dateStr);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      // Navigate by week
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    } else {
      // Navigate by month
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setCustomDateRange(false);
  };

  const getDaysToDisplay = () => {
    if (customDateRange) {
      const days = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
      return days;
    } else if (viewMode === 'week') {
      const days = [];
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        days.push(day);
      }
      return days;
    } else {
      return getDaysInMonth(currentDate);
    }
  };

  const days = getDaysToDisplay();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDateRangeText = () => {
    if (customDateRange) {
      return `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`;
    } else if (viewMode === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(currentDate.getDate() - currentDate.getDay() + 6);
      return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    } else {
      return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  if (loading || !user) return null;

  return (
    <>
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar>
          <IconButton
            component={Link}
            href="/appointments"
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <CalendarToday sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Appointment Calendar
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              color="inherit"
              startIcon={<ViewWeek />}
              onClick={() => {
                setViewMode(viewMode === 'week' ? 'month' : 'week');
                setCustomDateRange(false);
              }}
              sx={{ 
                background: 'rgba(255,255,255,0.1)',
                '&:hover': { background: 'rgba(255,255,255,0.2)' },
                borderRadius: 2
              }}
            >
              {viewMode === 'week' ? 'Month View' : 'Week View'}
            </Button>
            <Button
              color="inherit"
              startIcon={<Today />}
              onClick={goToToday}
              sx={{ 
                background: 'rgba(255,255,255,0.1)',
                '&:hover': { background: 'rgba(255,255,255,0.2)' },
                borderRadius: 2
              }}
            >
              Today
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 3
      }}>
        <Container maxWidth="xl">
          {/* Date Range Controls */}
          <Paper elevation={4} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Stack spacing={3}>
              {/* Custom Date Range Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={customDateRange}
                    onChange={(e) => {
                      setCustomDateRange(e.target.checked);
                      if (!e.target.checked) {
                        // Reset to current view mode
                        setCurrentDate(new Date());
                      }
                    }}
                    color="primary"
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <DateRange />
                    <Typography variant="body2">
                      Custom Date Range
                    </Typography>
                  </Stack>
                }
              />

              {customDateRange ? (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  <TextField
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const today = new Date();
                      const nextWeek = new Date();
                      nextWeek.setDate(today.getDate() + 6);
                      setStartDate(today.toISOString().split('T')[0]);
                      setEndDate(nextWeek.toISOString().split('T')[0]);
                    }}
                  >
                    Next 7 Days
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const today = new Date();
                      const nextMonth = new Date();
                      nextMonth.setDate(today.getDate() + 29);
                      setStartDate(today.toISOString().split('T')[0]);
                      setEndDate(nextMonth.toISOString().split('T')[0]);
                    }}
                  >
                    Next 30 Days
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <IconButton onClick={() => navigateMonth('prev')} size="large">
                    <ArrowBack />
                  </IconButton>
                  
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                    {getDateRangeText()}
                  </Typography>
                  
                  <IconButton onClick={() => navigateMonth('next')} size="large">
                    <ArrowForward />
                  </IconButton>
                </Stack>
              )}
            </Stack>
          </Paper>

          {/* Calendar Grid */}
          <Paper elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {/* Day Headers */}
            <Grid container sx={{ backgroundColor: '#f5f5f5' }}>
              {(customDateRange || viewMode === 'week' ? dayNames.slice(0, Math.min(7, days.length)) : dayNames).map((day, index) => (
                <Grid item xs={customDateRange ? (12/Math.min(7, days.length)) : (viewMode === 'week' ? 12/7 : 12/7)} key={`${day}-${index}`}>
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#333' }}>
                      {customDateRange && days[index] ? 
                        `${day.slice(0,3)} ${days[index].getDate()}` : 
                        day
                      }
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Calendar Days */}
            <Grid container>
              {days.map((day, index) => {
                const isCurrentMonth = viewMode === 'month' ? day.getMonth() === currentDate.getMonth() : true;
                const isToday = day.toDateString() === new Date().toDateString();
                const dayAppointments = getAppointmentsForDate(day);
                const gridSize = customDateRange ? (12/Math.min(7, days.length)) : (viewMode === 'week' ? 12/7 : 12/7);

                return (
                  <Grid item xs={gridSize} key={index}>
                    <Box
                      sx={{
                        minHeight: viewMode === 'week' || customDateRange ? 150 : 120,
                        p: 1,
                        borderRight: '1px solid #e0e0e0',
                        borderBottom: '1px solid #e0e0e0',
                        backgroundColor: isCurrentMonth ? 'white' : '#f9f9f9',
                        position: 'relative'
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: isToday ? 'bold' : 'normal',
                          color: isCurrentMonth ? (isToday ? '#1976d2' : '#333') : '#999',
                          mb: 1
                        }}
                      >
                        {customDateRange ? day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : day.getDate()}
                      </Typography>

                      {/* Today indicator */}
                      {isToday && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#1976d2'
                          }}
                        />
                      )}

                      {/* Appointments */}
                      {dayAppointments.slice(0, viewMode === 'week' || customDateRange ? 5 : 3).map((appointment, idx) => (
                        <Chip
                          key={appointment.id}
                          label={`${appointment.time} - ${appointment.patientName}`}
                          size="small"
                          sx={{
                            display: 'block',
                            mb: 0.5,
                            backgroundColor: statusColors[appointment.status],
                            color: 'white',
                            fontSize: '0.7rem',
                            height: 20,
                            '& .MuiChip-label': {
                              px: 1,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }
                          }}
                        />
                      ))}
                      
                      {dayAppointments.length > (viewMode === 'week' || customDateRange ? 5 : 3) && (
                        <Typography variant="caption" color="text.secondary">
                          +{dayAppointments.length - (viewMode === 'week' || customDateRange ? 5 : 3)} more
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>

          {/* Today's Appointments Detail */}
          <Paper elevation={4} sx={{ mt: 3, p: 3, borderRadius: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
              Today's Appointments ({new Date().toLocaleDateString()})
            </Typography>
            
            {loadingAppointments ? (
              <Typography>Loading appointments...</Typography>
            ) : (
              <Grid container spacing={2}>
                {getAppointmentsForDate(new Date()).map((appointment) => (
                  <Grid item xs={12} md={6} lg={4} key={appointment.id}>
                    <Card elevation={2} sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Chip
                              label={appointment.status}
                              size="small"
                              sx={{
                                backgroundColor: statusColors[appointment.status],
                                color: 'white',
                                fontWeight: 'bold'
                              }}
                            />
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {appointment.time}
                              </Typography>
                            </Stack>
                          </Stack>
                          
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
                              <Person sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {appointment.patientName}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={0.5}>
                                <Phone sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {appointment.patientPhone}
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                          
                          {appointment.treatmentType && (
                            <Typography variant="body2" color="text.secondary">
                              Treatment: {appointment.treatmentType}
                            </Typography>
                          )}
                          
                          {appointment.notes && (
                            <Typography variant="caption" color="text.secondary">
                              Notes: {appointment.notes}
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                
                {getAppointmentsForDate(new Date()).length === 0 && (
                  <Grid item xs={12}>
                    <Typography color="text.secondary" textAlign="center">
                      No appointments scheduled for today.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>
        </Container>
      </Box>
    </>
  );
}
