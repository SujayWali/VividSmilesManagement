import { auth, db } from "@/lib/firebase";
import { Button, Container, Typography, Paper, Box, Stack, Alert } from "@mui/material";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";

export default function TestFirebase() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function testConnection() {
    setStatus("Testing Firebase connection...");
    setError("");
    
    try {
      // Test Firebase config
      console.log("Firebase Auth:", auth);
      console.log("Firebase DB:", db);
      console.log("Auth domain:", auth.app.options.authDomain);
      console.log("Project ID:", auth.app.options.projectId);
      
      setStatus("Firebase configuration loaded successfully!");
    } catch (err: any) {
      setError(`Firebase connection error: ${err.message}`);
      console.error("Firebase test error:", err);
    }
  }

  return (
    <Box sx={{ 
      minHeight: "100vh",
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      px: { xs: 1, sm: 2 },
      py: { xs: 2, sm: 4 }
    }}>
      <Container maxWidth="sm">
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, sm: 4 }, 
            textAlign: "center",
            borderRadius: 2
          }}
        >
          <Stack spacing={{ xs: 3, sm: 4 }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  mb: 2
                }}
              >
                🔧 Test Firebase Connection
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.6
                }}
              >
                Test the Firebase configuration and authentication setup.
              </Typography>
            </Box>
            
            {status && (
              <Alert severity="info">
                {status}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
            
            <Button 
              variant="contained" 
              size="large"
              onClick={testConnection}
              sx={{ 
                py: { xs: 1.5, sm: 2 },
                px: { xs: 3, sm: 4 },
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 'bold'
              }}
            >
              🧪 Test Firebase Connection
            </Button>
            
            <Button 
              variant="outlined" 
              href="/"
              sx={{ 
                textTransform: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              🏠 Back to Home
            </Button>
            
            <Button 
              variant="outlined" 
              href="/seed-admin"
              sx={{ 
                textTransform: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              👤 Go to Seed Admin
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
