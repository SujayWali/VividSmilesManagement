import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { db } from "@/lib/firebase";
import { Appointment, Patient } from "@/types/models";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Box,
  Container,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Fab,
  Alert,
  Snackbar,
  Autocomplete,
  Switch,
  FormControlLabel
} from "@mui/material";
import {
  CalendarToday,
  Add,
  Edit,
  Delete,
  ArrowBack,
  Schedule,
  Person,
  Assessment,
  CheckCircle,
  WhatsApp,
  DateRange
} from "@mui/icons-material";

const STATUS_COLORS = {
  "Scheduled": "primary",
  "Confirmed": "success", 
  "Completed": "default",
  "Cancelled": "error",
  "No Show": "warning"
} as const;

const TREATMENT_TYPES = [
  "Consultation",
  "Cleaning", 
  "Filling",
  "Root Canal",
  "Crown",
  "Extraction",
  "Orthodontics",
  "Whitening",
  "Implant",
  "Surgery",
  "Emergency",
  "Follow-up"
];

const TIME_SLOTS = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
  "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

export default function AppointmentsPage() {
  const { user, loading } = useAuth();
  const role = useRole();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" | "info" | "warning" });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isAddingNewPatient, setIsAddingNewPatient] = useState(false);
  const [dateRangeMode, setDateRangeMode] = useState(true); // true for range, false for single date
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 6); // Default 7-day range
    return date.toISOString().split('T')[0];
  });

  const [formData, setFormData] = useState<{
    patientName: string;
    patientPhone: string;
    patientEmail: string;
    patientAddress: string;
    patientAge: string;
    patientGender: string;
    date: string;
    time: string;
    treatmentType: string;
    notes: string;
    status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled" | "No Show";
  }>({
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    patientAddress: "",
    patientAge: "",
    patientGender: "",
    date: new Date().toISOString().split('T')[0],
    time: "",
    treatmentType: "",
    notes: "",
    status: "Scheduled"
  });

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchAppointments();
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      const patientsRef = collection(db, "patients");
      const snapshot = await getDocs(patientsRef);
      
      const patientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      
      setPatients(patientsData);
    } catch (error) {
      console.error("Error fetching patients:", error);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoadingAppointments(true);
      const appointmentsRef = collection(db, "appointments");
      const snapshot = await getDocs(appointmentsRef);
      
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setSnackbar({
        open: true,
        message: `Error fetching appointments: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: "error"
      });
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleSaveAppointment = async () => {
    try {
      // Validate required fields
      if (!formData.patientName || !formData.patientPhone || !formData.date || !formData.time) {
        setSnackbar({
          open: true,
          message: "Please fill in all required fields (patient name, phone, date, and time)",
          severity: "error"
        });
        return;
      }

      // If adding a new patient, validate additional fields
      if (isAddingNewPatient) {
        // Email validation only if provided
        if (formData.patientEmail && formData.patientEmail.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.patientEmail)) {
            setSnackbar({
              open: true,
              message: "Please enter a valid email address",
              severity: "error"
            });
            return;
          }
        }

        // Age validation only if provided
        if (formData.patientAge && formData.patientAge.trim() !== "") {
          const age = parseInt(formData.patientAge);
          if (isNaN(age) || age < 0 || age > 150) {
            setSnackbar({
              open: true,
              message: "Please enter a valid age (0-150)",
              severity: "error"
            });
            return;
          }
        }
      }

      // Validate phone number format
      const phoneRegex = /^[+]?[\d\s-()]{7,15}$/;
      if (!phoneRegex.test(formData.patientPhone)) {
        setSnackbar({
          open: true,
          message: "Please enter a valid phone number",
          severity: "error"
        });
        return;
      }

      // Validate date is not in the past (optional check)
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today && !editingAppointment) {
        const confirm = window.confirm("The selected date is in the past. Do you want to continue?");
        if (!confirm) return;
      }

      let patientId = selectedPatient?.id || "";
      
      // If adding a new patient, create the patient first
      if (isAddingNewPatient && !selectedPatient) {
        const newPatientData = {
          name: formData.patientName,
          phone: formData.patientPhone,
          email: formData.patientEmail || "",
          address: formData.patientAddress || "",
          age: formData.patientAge ? parseInt(formData.patientAge) : null,
          gender: formData.patientGender || "",
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        const patientDocRef = await addDoc(collection(db, "patients"), newPatientData);
        patientId = patientDocRef.id;
        
        // Refresh patients list
        await fetchPatients();
      }

      const appointmentData = {
        patientId: patientId,
        patientName: formData.patientName,
        patientPhone: formData.patientPhone,
        date: formData.date,
        time: formData.time,
        treatmentType: formData.treatmentType,
        notes: formData.notes,
        status: formData.status,
        createdAt: editingAppointment ? editingAppointment.createdAt : Date.now(),
        updatedAt: Date.now()
      };

      if (editingAppointment) {
        const appointmentRef = doc(db, "appointments", editingAppointment.id);
        await updateDoc(appointmentRef, appointmentData);
        setSnackbar({
          open: true,
          message: "Appointment updated successfully",
          severity: "success"
        });
      } else {
        await addDoc(collection(db, "appointments"), appointmentData);
        setSnackbar({
          open: true,
          message: isAddingNewPatient ? "New patient and appointment created successfully" : "Appointment created successfully",
          severity: "success"
        });
      }

      setOpenDialog(false);
      setEditingAppointment(null);
      resetForm();
      fetchAppointments();
    } catch (error) {
      console.error("Error saving appointment:", error);
      setSnackbar({
        open: true,
        message: `Error saving appointment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: "error"
      });
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    
    try {
      await deleteDoc(doc(db, "appointments", appointmentId));
      setSnackbar({
        open: true,
        message: "Appointment deleted successfully",
        severity: "success"
      });
      fetchAppointments();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setSnackbar({
        open: true,
        message: `Error deleting appointment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: "error"
      });
    }
  };

  const sendWhatsAppReminder = async (appointment: Appointment) => {
    try {
      // Format patient's phone number (remove any spaces, dashes, and ensure it starts with country code)
      let patientPhone = appointment.patientPhone.replace(/[\s-]/g, '');
      if (!patientPhone.startsWith('+')) {
        patientPhone = patientPhone.startsWith('91') ? `+${patientPhone}` : `+91${patientPhone}`;
      }
      
      const message = `🦷 Appointment Reminder\n\nHello ${appointment.patientName},\n\nThis is a friendly reminder about your upcoming dental appointment:\n\n📅 Date: ${new Date(appointment.date).toLocaleDateString()}\n⏰ Time: ${appointment.time}\n🏥 Treatment: ${appointment.treatmentType || 'Consultation'}\n\nPlease arrive 15 minutes early for check-in.\n\nIf you need to reschedule, please contact us as soon as possible.\n\nThank you!\nVivid Smiles Complete Dental Care`;
      
      const whatsappUrl = `https://wa.me/${patientPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
      
      // Open WhatsApp - this will open on YOUR device/WhatsApp with the patient's number selected and the message pre-filled
      window.open(whatsappUrl, '_blank');
      
      setSnackbar({
        open: true,
        message: `WhatsApp opened for ${appointment.patientName}`,
        severity: "success"
      });
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      setSnackbar({
        open: true,
        message: `Failed to open WhatsApp: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: "error"
      });
    }
  };

  const sendTodayReminders = async () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(apt => 
      apt.date === today && 
      (apt.status === 'Scheduled' || apt.status === 'Confirmed')
    );

    if (todayAppointments.length === 0) {
      setSnackbar({
        open: true,
        message: "No scheduled appointments for today",
        severity: "info"
      });
      return;
    }

    const confirm = window.confirm(
      `Open WhatsApp for ${todayAppointments.length} patients with appointments today? This will open multiple WhatsApp windows.`
    );
    
    if (!confirm) return;

    try {
      for (const appointment of todayAppointments) {
        // Format patient's phone number (remove any spaces, dashes, and ensure it starts with country code)
        let patientPhone = appointment.patientPhone.replace(/[\s-]/g, '');
        if (!patientPhone.startsWith('+')) {
          patientPhone = patientPhone.startsWith('91') ? `+${patientPhone}` : `+91${patientPhone}`;
        }
        
        const message = `🦷 Appointment Reminder\n\nHello ${appointment.patientName},\n\nThis is a friendly reminder about your dental appointment TODAY:\n\n📅 Date: ${new Date(appointment.date).toLocaleDateString()}\n⏰ Time: ${appointment.time}\n🏥 Treatment: ${appointment.treatmentType || 'Consultation'}\n\nIf you need to reschedule, please contact us immediately on +91 8920851141.\n\nThank you!\nVivid Smiles Dental Clinic`;
        
        const whatsappUrl = `https://wa.me/${patientPhone.replace('+', '')}?text=${encodeURIComponent(message)}`;
        
        // Open WhatsApp in a new window with a small delay between each
        window.open(whatsappUrl, '_blank');
        
        // Add a small delay between opening windows to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSnackbar({
        open: true,
        message: `WhatsApp opened for ${todayAppointments.length} patients`,
        severity: "success"
      });
    } catch (error) {
      console.error('Error opening WhatsApp for bulk reminders:', error);
      setSnackbar({
        open: true,
        message: `Failed to open WhatsApp: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: "error"
      });
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    
    // Find the patient for this appointment
    const patient = patients.find(p => p.id === appointment.patientId);
    setSelectedPatient(patient || null);
    
    setFormData({
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      patientEmail: patient?.email || "",
      patientAddress: patient?.address || "",
      patientAge: patient?.age ? patient.age.toString() : "",
      patientGender: patient?.gender || "",
      date: appointment.date,
      time: appointment.time,
      treatmentType: appointment.treatmentType || "",
      notes: appointment.notes || "",
      status: appointment.status
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      patientAddress: "",
      patientAge: "",
      patientGender: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
      treatmentType: "",
      notes: "",
      status: "Scheduled"
    });
    setSelectedPatient(null);
    setIsAddingNewPatient(false);
  };

  const filteredAppointments = appointments.filter(appointment => {
    // Date filtering logic
    let dateMatch = true;
    if (dateRangeMode) {
      // Date range filtering
      if (startDate && endDate) {
        dateMatch = appointment.date >= startDate && appointment.date <= endDate;
      } else if (startDate) {
        dateMatch = appointment.date >= startDate;
      } else if (endDate) {
        dateMatch = appointment.date <= endDate;
      }
    } else {
      // Single date filtering
      dateMatch = filterDate === "" || appointment.date === filterDate;
    }
    
    const statusMatch = filterStatus === "All" || appointment.status === filterStatus;
    return dateMatch && statusMatch;
  });

  const todaysAppointments = appointments.filter(apt => 
    apt.date === new Date().toISOString().split('T')[0]
  );

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
            href="/"
            edge="start"
            color="inherit"
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <CalendarToday sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Appointment Management
          </Typography>
          
          <Stack direction="row" spacing={2}>
            <Button
              component={Link}
              href="/appointments/calendar"
              color="inherit"
              variant="outlined"
              sx={{ 
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              📅 Calendar View
            </Button>
            <Button
              color="inherit"
              variant="outlined"
              onClick={() => sendTodayReminders()}
              sx={{ 
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              📱 Send Today's Reminders
            </Button>
            <Button
              color="inherit"
              variant="contained"
              sx={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
              }}
              onClick={() => {
                setEditingAppointment(null);
                resetForm();
                setOpenDialog(true);
              }}
            >
              New Appointment
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
          {/* Today's Summary */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={4}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: '#4CAF50' }}>
                      <CalendarToday />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {todaysAppointments.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Today's Appointments
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={4}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: '#2196F3' }}>
                      <Schedule />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {appointments.filter(apt => apt.status === 'Scheduled').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Scheduled
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={4}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: '#FF9800' }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {new Set(appointments.map(apt => apt.patientId)).size}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Unique Patients
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={4}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: '#9C27B0' }}>
                      <Assessment />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {appointments.filter(apt => apt.status === 'Completed').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={3}>
                {/* Date Filter Mode Toggle */}
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={dateRangeMode}
                        onChange={(e) => {
                          setDateRangeMode(e.target.checked);
                          if (!e.target.checked) {
                            // Reset to single date mode
                            setFilterDate(new Date().toISOString().split('T')[0]);
                          }
                        }}
                        color="primary"
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <DateRange />
                        <Typography variant="body2">
                          {dateRangeMode ? "Date Range Filter" : "Single Date Filter"}
                        </Typography>
                      </Stack>
                    }
                  />
                </Box>

                {/* Date Filters */}
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                  {dateRangeMode ? (
                    <>
                      <TextField
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ minWidth: 160 }}
                      />
                      <TextField
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ minWidth: 160 }}
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
                    </>
                  ) : (
                    <TextField
                      label="Filter by Date"
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      sx={{ minWidth: 160 }}
                    />
                  )}
                  
                  <TextField
                    label="Filter by Status"
                    select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    size="small"
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="All">All Status</MenuItem>
                    <MenuItem value="Scheduled">Scheduled</MenuItem>
                    <MenuItem value="Confirmed">Confirmed</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                    <MenuItem value="No Show">No Show</MenuItem>
                  </TextField>
                  
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (dateRangeMode) {
                        const today = new Date();
                        const nextWeek = new Date();
                        nextWeek.setDate(today.getDate() + 6);
                        setStartDate(today.toISOString().split('T')[0]);
                        setEndDate(nextWeek.toISOString().split('T')[0]);
                      } else {
                        setFilterDate("");
                      }
                      setFilterStatus("All");
                    }}
                  >
                    Reset Filters
                  </Button>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredAppointments.length} of {appointments.length} appointments
                    {dateRangeMode && startDate && endDate && (
                      <span style={{ display: 'block', fontSize: '0.75rem' }}>
                        ({new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()})
                      </span>
                    )}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {/* Appointments Table */}
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <CalendarToday sx={{ mr: 1 }} />
                Appointments
              </Typography>
              
              {loadingAppointments ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography>Loading appointments...</Typography>
                </Box>
              ) : filteredAppointments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No appointments found matching your criteria.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setEditingAppointment(null);
                      resetForm();
                      setOpenDialog(true);
                    }}
                  >
                    Create First Appointment
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell><strong>Patient</strong></TableCell>
                        <TableCell><strong>Date & Time</strong></TableCell>
                        <TableCell><strong>Treatment</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {appointment.patientName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.patientPhone}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {new Date(appointment.date).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {appointment.time}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {appointment.treatmentType || 'Not specified'}
                            </Typography>
                            {appointment.notes && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                {appointment.notes.substring(0, 50)}
                                {appointment.notes.length > 50 ? '...' : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={appointment.status}
                              color={STATUS_COLORS[appointment.status]}
                              size="small"
                              icon={appointment.status === 'Completed' ? <CheckCircle /> : undefined}
                            />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditAppointment(appointment)}
                                color="primary"
                                title="Edit Appointment"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => sendWhatsAppReminder(appointment)}
                                sx={{ color: '#25D366' }}
                                title="Send WhatsApp Reminder"
                              >
                                <WhatsApp fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                color="error"
                                title="Delete Appointment"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Add/Edit Appointment Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingAppointment ? "Edit Appointment" : "New Appointment"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Toggle between existing and new patient */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAddingNewPatient}
                    onChange={(e) => {
                      setIsAddingNewPatient(e.target.checked);
                      if (e.target.checked) {
                        setSelectedPatient(null);
                        setFormData({ 
                          ...formData, 
                          patientName: "",
                          patientPhone: "",
                          patientEmail: "",
                          patientAddress: "",
                          patientAge: "",
                          patientGender: ""
                        });
                      }
                    }}
                  />
                }
                label="Add New Patient"
              />
            </Grid>

            {/* Patient Selection - Existing or New */}
            {!isAddingNewPatient ? (
              <Grid item xs={12}>
                <Autocomplete
                  options={patients}
                  getOptionLabel={(option) => `${option.name} (${option.phone})`}
                  value={selectedPatient}
                  onChange={(event, newValue) => {
                    setSelectedPatient(newValue);
                    if (newValue) {
                      setFormData({ 
                        ...formData, 
                        patientName: newValue.name,
                        patientPhone: newValue.phone,
                        patientEmail: newValue.email || "",
                        patientAddress: newValue.address || "",
                        patientAge: newValue.age ? newValue.age.toString() : "",
                        patientGender: newValue.gender || ""
                      });
                    } else {
                      setFormData({ 
                        ...formData, 
                        patientName: "",
                        patientPhone: "",
                        patientEmail: "",
                        patientAddress: "",
                        patientAge: "",
                        patientGender: ""
                      });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Existing Patient"
                      required
                      helperText="Search and select an existing patient"
                    />
                  )}
                  fullWidth
                />
              </Grid>
            ) : (
              <>
                {/* New Patient Fields */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Patient Name"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Patient Phone"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    required
                    helperText="Format: +1234567890"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Patient Email"
                    type="email"
                    value={formData.patientEmail}
                    onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                    helperText="Optional"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Age"
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => setFormData({ ...formData, patientAge: e.target.value })}
                    inputProps={{ min: 0, max: 150 }}
                    helperText="Patient age in years (optional)"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Gender"
                    select
                    value={formData.patientGender}
                    onChange={(e) => setFormData({ ...formData, patientGender: e.target.value })}
                    helperText="Optional"
                  >
                    <MenuItem value="">Not specified</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                    <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Patient Address"
                    multiline
                    rows={2}
                    value={formData.patientAddress}
                    onChange={(e) => setFormData({ ...formData, patientAddress: e.target.value })}
                    placeholder="Full address (optional)"
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Time"
                select
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              >
                {TIME_SLOTS.map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Treatment Type"
                select
                value={formData.treatmentType}
                onChange={(e) => setFormData({ ...formData, treatmentType: e.target.value })}
              >
                {TREATMENT_TYPES.map((treatment) => (
                  <MenuItem key={treatment} value={treatment}>
                    {treatment}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Status"
                select
                value={formData.status}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  status: e.target.value as "Scheduled" | "Confirmed" | "Completed" | "Cancelled" | "No Show"
                })}
                required
              >
                <MenuItem value="Scheduled">Scheduled</MenuItem>
                <MenuItem value="Confirmed">Confirmed</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
                <MenuItem value="No Show">No Show</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about the appointment..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveAppointment} variant="contained">
            {editingAppointment ? "Update" : "Create"} Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add appointment"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'block', md: 'none' },
        }}
        onClick={() => {
          setEditingAppointment(null);
          resetForm();
          setOpenDialog(true);
        }}
      >
        <Add />
      </Fab>
    </>
  );
}
