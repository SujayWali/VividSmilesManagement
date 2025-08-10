import { auth, db } from "@/lib/firebase";
import { Button, Container, Typography, Paper, Box, Stack } from "@mui/material";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SeedAdmin() {
  async function run() {
    const email = prompt("Enter admin email (will be created if missing):") || "";
    const password = prompt("Enter password:") || "";
    try { await createUserWithEmailAndPassword(auth, email, password); }
    catch { await signInWithEmailAndPassword(auth, email, password); }
    await setDoc(doc(db, "users", auth.currentUser!.uid), {
      uid: auth.currentUser!.uid, email, role: "admin", createdAt: Date.now()
    }, { merge: true });
    alert("Admin seeded. You can delete this page now.");
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
                🔧 Setup Admin Account
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  lineHeight: 1.6
                }}
              >
                Create or update an admin account for the dental management system.
                This is a one-time setup process.
              </Typography>
            </Box>
            
            <Paper 
              elevation={1} 
              sx={{ 
                p: { xs: 2, sm: 3 }, 
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107'
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  color: '#856404',
                  fontWeight: 'medium'
                }}
              >
                ⚠️ <strong>Note:</strong> This page should be deleted after admin setup is complete for security.
              </Typography>
            </Paper>
            
            <Button 
              variant="contained" 
              size="large"
              onClick={run}
              sx={{ 
                py: { xs: 1.5, sm: 2 },
                px: { xs: 3, sm: 4 },
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 'bold'
              }}
            >
              🚀 Setup Admin Account
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
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
