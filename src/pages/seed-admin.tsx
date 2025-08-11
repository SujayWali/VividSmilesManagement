import { auth, db } from "@/lib/firebase";
import { Button, Container, Typography, Paper, Box, Stack } from "@mui/material";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function SeedAdmin() {
  async function run() {
    try {
      const email = prompt("Enter admin email (will be created if missing):") || "";
      const password = prompt("Enter password:") || "";
      
      if (!email || !password) {
        alert("Email and password are required!");
        return;
      }

      console.log("Attempting to create/sign in user with email:", email);
      
      let userCredential;
      try {
        // Try to create new user first
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("New user created successfully");
      } catch (createError: any) {
        console.log("User creation failed, trying to sign in:", createError.code);
        
        if (createError.code === "auth/email-already-in-use") {
          // User exists, try to sign in
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("User signed in successfully");
          } catch (signInError: any) {
            console.error("Sign in failed:", signInError);
            if (signInError.code === "auth/invalid-credential" || signInError.code === "auth/wrong-password") {
              alert("Invalid email or password. Please check your credentials and try again.");
            } else {
              alert(`Authentication error: ${signInError.message}`);
            }
            return;
          }
        } else {
          console.error("User creation failed:", createError);
          alert(`Error creating user: ${createError.message}`);
          return;
        }
      }

      // Create/update user document in Firestore
      if (auth.currentUser) {
        console.log("Creating user document for UID:", auth.currentUser.uid);
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          uid: auth.currentUser.uid, 
          email, 
          role: "admin", 
          createdAt: Date.now()
        }, { merge: true });
        
        console.log("User document created/updated successfully");
        alert("Admin account setup successfully! You can now use the appointment management system.");
      } else {
        alert("Error: No current user found after authentication.");
      }
    } catch (error: any) {
      console.error("Unexpected error in seed-admin:", error);
      alert(`Unexpected error: ${error.message}`);
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
