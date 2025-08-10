import { useRole } from "@/hooks/useRole";
import { db } from "@/lib/firebase";
import { 
  AppBar, 
  Box, 
  Button, 
  Container, 
  LinearProgress, 
  Paper, 
  Stack, 
  Toolbar, 
  Typography 
} from "@mui/material";
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  updateDoc, 
  writeBatch 
} from "firebase/firestore";
import { useState } from "react";

export default function FirestoreMigration() {
  const role = useRole();
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  if (role !== "admin") {
    return (
      <Container sx={{ py: 4 }}>
        <Typography 
          variant="h6" 
          textAlign="center"
          sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
        >
          You must be admin to access this page.
        </Typography>
      </Container>
    );
  }

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const runMigration = async () => {
    setIsRunning(true);
    setIsDone(false);
    setProgress(0);
    setLogs([]);
    
    try {
      addLog("Starting Firestore migration...");
      
      // Get all patients
      const patientsQuery = query(collection(db, "patients"));
      const patientsSnapshot = await getDocs(patientsQuery);
      const totalPatients = patientsSnapshot.docs.length;
      
      addLog(`Found ${totalPatients} patients to process`);
      
      let processedPatients = 0;
      
      for (const patientDoc of patientsSnapshot.docs) {
        const patientId = patientDoc.id;
        const patientData = patientDoc.data();
        const patientChanges: any = {};
        let hasPatientChanges = false;
        
        addLog(`Processing patient: ${patientId} (${patientData.name || 'Unknown'})`);
        
        // Migration 1: sex -> gender
        if (patientData.sex && !patientData.gender) {
          patientChanges.gender = patientData.sex;
          hasPatientChanges = true;
          addLog(`  - Migrated sex "${patientData.sex}" to gender`);
        }
        
        // Migration 2: history -> dentalHistory
        if (patientData.history && !patientData.dentalHistory) {
          patientChanges.dentalHistory = patientData.history;
          hasPatientChanges = true;
          addLog(`  - Migrated history to dentalHistory`);
        }
        
        // Migration 3: allergies -> medicalHistory
        if (patientData.allergies && !patientData.medicalHistory) {
          patientChanges.medicalHistory = patientData.allergies;
          hasPatientChanges = true;
          addLog(`  - Migrated allergies to medicalHistory`);
        }
        
        // Ensure required fields exist
        if (!patientData.gender && !patientChanges.gender) {
          patientChanges.gender = "Other";
          hasPatientChanges = true;
          addLog(`  - Set default gender: Other`);
        }
        
        if (!patientData.dentalHistory && !patientChanges.dentalHistory) {
          patientChanges.dentalHistory = "None";
          hasPatientChanges = true;
          addLog(`  - Set default dentalHistory: None`);
        }
        
        if (!patientData.medicalHistory && !patientChanges.medicalHistory) {
          patientChanges.medicalHistory = "None";
          hasPatientChanges = true;
          addLog(`  - Set default medicalHistory: None`);
        }
        
        // Update patient if changes exist
        if (hasPatientChanges) {
          patientChanges.updatedAt = Date.now();
          await updateDoc(doc(db, "patients", patientId), patientChanges);
          addLog(`  - Updated patient with changes: ${Object.keys(patientChanges).join(', ')}`);
        } else {
          addLog(`  - No patient changes needed`);
        }
        
        // Process visits subcollection
        const visitsQuery = query(collection(db, "patients", patientId, "visits"));
        const visitsSnapshot = await getDocs(visitsQuery);
        
        addLog(`  - Processing ${visitsSnapshot.docs.length} visits`);
        
        for (const visitDoc of visitsSnapshot.docs) {
          const visitId = visitDoc.id;
          const visitData = visitDoc.data();
          const visitChanges: any = {};
          let hasVisitChanges = false;
          
          // Migration 4: Date handling
          if (!visitData.dateISO && visitData.date && /^\d{4}-\d{2}-\d{2}$/.test(visitData.date)) {
            visitChanges.dateISO = visitData.date;
            visitChanges.dateDisplay = formatDate(visitData.date);
            hasVisitChanges = true;
            addLog(`    - Created dateISO and dateDisplay from date: ${visitData.date}`);
          }
          
          if (visitData.dateISO && !visitData.dateDisplay) {
            visitChanges.dateDisplay = formatDate(visitData.dateISO);
            hasVisitChanges = true;
            addLog(`    - Created dateDisplay from dateISO: ${visitData.dateISO}`);
          }
          
          // Migration 5: Medicines string to array
          if (visitData.medicines && typeof visitData.medicines === 'string') {
            visitChanges.medicines = visitData.medicines
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s.length > 0);
            hasVisitChanges = true;
            addLog(`    - Converted medicines string to array`);
          }
          
          // Migration 6: Ensure treatment exists
          if (!visitData.treatment) {
            visitChanges.treatment = "-";
            hasVisitChanges = true;
            addLog(`    - Set default treatment: -`);
          }
          
          // Migration 7: Ensure payment exists
          if (visitData.payment === undefined || visitData.payment === null) {
            visitChanges.payment = 0;
            hasVisitChanges = true;
            addLog(`    - Set default payment: 0`);
          }
          
          // Migration 8: Create prescribed field
          const medicines = visitChanges.medicines || visitData.medicines || [];
          const prescribedValue = Array.isArray(medicines) && medicines.length > 0 
            ? medicines.join(", ") 
            : "-";
          
          if (!visitData.prescribed || visitData.prescribed !== prescribedValue) {
            visitChanges.prescribed = prescribedValue;
            hasVisitChanges = true;
            addLog(`    - Updated prescribed field: ${prescribedValue}`);
          }
          
          // Migration 9: Ensure paymentStatus exists
          if (!visitData.paymentStatus) {
            visitChanges.paymentStatus = "Pending";
            hasVisitChanges = true;
            addLog(`    - Set default paymentStatus: Pending`);
          }
          
          // Update visit if changes exist
          if (hasVisitChanges) {
            await updateDoc(doc(db, "patients", patientId, "visits", visitId), visitChanges);
            addLog(`    - Updated visit ${visitId} with: ${Object.keys(visitChanges).join(', ')}`);
          }
        }
        
        processedPatients++;
        setProgress((processedPatients / totalPatients) * 100);
      }
      
      addLog(`Migration completed! Processed ${totalPatients} patients.`);
      setIsDone(true);
      
    } catch (error) {
      addLog(`Error during migration: ${error}`);
      console.error("Migration error:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar sx={{ px: { xs: 1, sm: 3 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            🔧 Firestore Migration
          </Typography>
          <Button 
            color="inherit" 
            href="/"
            sx={{ 
              textTransform: 'none',
              fontSize: { xs: '0.8rem', sm: '1rem' }
            }}
          >
            🏠 Home
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2', 
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Database Migration Tool
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              mb: 2
            }}
          >
            This tool will migrate patient and visit data to the new schema:
          </Typography>
          
          <Box component="ul" sx={{ pl: 3, color: 'text.secondary' }}>
            <li>Migrate <code>sex</code> → <code>gender</code></li>
            <li>Migrate <code>history</code> → <code>dentalHistory</code></li>
            <li>Migrate <code>allergies</code> → <code>medicalHistory</code></li>
            <li>Create date fields for visits (<code>dateISO</code>, <code>dateDisplay</code>)</li>
            <li>Convert medicines strings to arrays</li>
            <li>Ensure payment field exists in visits (default: 0)</li>
            <li>Add payment status field to visits (default: "Pending")</li>
            <li>Ensure required fields have defaults</li>
          </Box>
        </Paper>

        {/* Controls */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Migration Controls</Typography>
            <Button 
              variant="contained" 
              onClick={runMigration}
              disabled={isRunning}
              sx={{ 
                textTransform: 'none',
                minWidth: 150
              }}
            >
              {isRunning ? "Running..." : isDone ? "✅ Done" : "🚀 Run Migration"}
            </Button>
          </Stack>
          
          {isRunning && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Progress: {Math.round(progress)}%
              </Typography>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          )}
        </Paper>

        {/* Logs */}
        {logs.length > 0 && (
          <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Migration Log
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                backgroundColor: '#000',
                color: '#00ff00',
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              <Box 
                component="pre" 
                sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {logs.join('\n')}
              </Box>
            </Paper>
          </Paper>
        )}
      </Container>
    </>
  );
}
