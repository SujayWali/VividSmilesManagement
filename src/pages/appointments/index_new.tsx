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
  Autocomplete
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
  CheckCircle
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
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [formData, setFormData] = useState<{
    patientName: string;
    patientPhone: string;
    date: string;
    time: string;
    treatmentType: string;
    notes: string;
    duration: number;
    status: "Scheduled" | "Confirmed" | "Completed" | "Cancelled" | "No Show";
  }>({
    patientName: "",
    patientPhone: "",
    date: new Date().toISOString().split('T')[0],
    time: "",
    treatmentType: "",
    notes: "",
    duration: 30,
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
      if (!selectedPatient || !formData.date || !formData.time) {
        setSnackbar({
          open: true,
          message: "Please select a patient and fill in all required fields",
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

      const appointmentData = {
        ...formData,
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientPhone: selectedPatient.phone,
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
          message: "Appointment created successfully",
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

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    
    // Find the patient for this appointment
    const patient = patients.find(p => p.id === appointment.patientId);
    setSelectedPatient(patient || null);
    
    setFormData({
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      date: appointment.date,
      time: appointment.time,
      treatmentType: appointment.treatmentType || "",
      notes: appointment.notes || "",
      duration: appointment.duration || 30,
      status: appointment.status
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      patientName: "",
      patientPhone: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
      treatmentType: "",
      notes: "",
      duration: 30,
      status: "Scheduled"
    });
    setSelectedPatient(null);
  };

  const filteredAppointments = appointments.filter(appointment => {
    const dateMatch = filterDate === "" || appointment.date === filterDate;
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
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label="Filter by Date"
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
                
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
                    setFilterDate("");
                    setFilterStatus("All");
                  }}
                >
                  Clear Filters
                </Button>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredAppointments.length} of {appointments.length} appointments
                </Typography>
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
                        <TableCell><strong>Duration</strong></TableCell>
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
                            <Typography variant="body2">
                              {appointment.duration || 30} min
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                onClick={() => handleEditAppointment(appointment)}
                                color="primary"
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                                color="error"
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
                      patientPhone: newValue.phone 
                    });
                  } else {
                    setFormData({ 
                      ...formData, 
                      patientName: "",
                      patientPhone: "" 
                    });
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Patient"
                    required
                    helperText="Search and select an existing patient"
                  />
                )}
                fullWidth
              />
            </Grid>
            
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
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                inputProps={{ min: 15, max: 180, step: 15 }}
              />
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
