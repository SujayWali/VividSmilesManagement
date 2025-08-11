import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { 
  Button, 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Stack, 
  Alert,
  CircularProgress
} from "@mui/material";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useState } from "react";

export default function TestAppointments() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  async function testFetchAppointments() {
    setIsLoading(true);
    setStatus("Fetching appointments...");
    setError("");
    
    try {
      console.log("User:", user);
      console.log("Auth state:", !!user);
      
      const appointmentsRef = collection(db, "appointments");
      const snapshot = await getDocs(appointmentsRef);
      
      console.log("Appointments snapshot:", snapshot);
      console.log("Number of documents:", snapshot.docs.length);
      
      const appointmentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAppointments(appointmentsData);
      setStatus(`Successfully fetched ${appointmentsData.length} appointments!`);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(`Fetch error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function testCreateAppointment() {
    setIsLoading(true);
    setStatus("Creating test appointment...");
    setError("");
    
    try {
      const testAppointment = {
        patientName: "Test Patient",
        patientPhone: "+1234567890",
        patientId: "",
        date: new Date().toISOString().split('T')[0],
        time: "14:30",
        status: "Scheduled",
        treatmentType: "Test Consultation",
        notes: "This is a test appointment",
        duration: 30,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      const docRef = await addDoc(collection(db, "appointments"), testAppointment);
      console.log("Test appointment created with ID:", docRef.id);
      setStatus(`Test appointment created successfully with ID: ${docRef.id}`);
      
      // Refresh the list
      await testFetchAppointments();
    } catch (err: any) {
      console.error("Error creating appointment:", err);
      setError(`Create error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="warning">
          Please log in to test appointments functionality.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: "100vh",
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="md">
        <Paper 
          elevation={3} 
          sx={{ 
            p: 4, 
            textAlign: "center",
            borderRadius: 2
          }}
        >
          <Stack spacing={4}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  mb: 2
                }}
              >
                🧪 Test Appointments
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
              >
                Test appointment creation and fetching functionality.
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                User Info:
              </Typography>
              <Typography variant="body2">
                Email: {user.email}
              </Typography>
              <Typography variant="body2">
                UID: {user.uid}
              </Typography>
            </Box>
            
            {status && (
              <Alert severity="success">
                {status}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
            
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button 
                variant="contained" 
                onClick={testFetchAppointments}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : "📋 Fetch Appointments"}
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={testCreateAppointment}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : "➕ Create Test Appointment"}
              </Button>
            </Stack>
            
            {appointments.length > 0 && (
              <Paper elevation={1} sx={{ p: 3, textAlign: 'left' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Appointments ({appointments.length}):
                </Typography>
                {appointments.map((apt, index) => (
                  <Box key={apt.id} sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2">
                      <strong>ID:</strong> {apt.id}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Patient:</strong> {apt.patientName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date:</strong> {apt.date} at {apt.time}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {apt.status}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}
            
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button 
                variant="outlined" 
                href="/"
              >
                🏠 Back to Home
              </Button>
              
              <Button 
                variant="outlined" 
                href="/appointments"
              >
                📅 Go to Appointments
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
