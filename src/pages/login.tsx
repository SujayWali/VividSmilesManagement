import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { Box, Button, Paper, Stack, TextField, Typography, Container } from "@mui/material";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    try {
      if (isSignup) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), { uid: cred.user.uid, email, role: "manager", createdAt: Date.now() }, { merge: true });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/");
    } catch (err: any) { setError(err.message); }
  }

  return (
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      minHeight: "100vh",
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      px: { xs: 1, sm: 2 },
      py: { xs: 2, sm: 4 }
    }}>
      <Container maxWidth="xs">
        <Paper 
          elevation={3}
          sx={{ 
            p: { xs: 3, sm: 4 }, 
            width: '100%',
            borderRadius: 2
          }} 
          component="form" 
          onSubmit={handleSubmit}
        >
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <Box sx={{ textAlign: 'center', mb: { xs: 1, sm: 2 } }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold',
                  color: '#1976d2',
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  mb: 1
                }}
              >
                🦷 VividSmiles
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  color: 'text.secondary'
                }}
              >
                {isSignup ? "Create Account" : "Welcome Back"}
              </Typography>
            </Box>
            
            <TextField 
              label="📧 Email Address" 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              required 
              type="email"
              size="medium"
              variant="outlined"
            />
            
            <TextField 
              label="🔒 Password" 
              type="password" 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              required 
              size="medium"
              variant="outlined"
            />
            
            {error && (
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  backgroundColor: '#ffebee',
                  border: '1px solid #f44336'
                }}
              >
                <Typography 
                  color="error" 
                  variant="body2"
                  sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                >
                  ❌ {error}
                </Typography>
              </Paper>
            )}
            
            <Button 
              type="submit" 
              variant="contained" 
              size="large"
              sx={{ 
                py: { xs: 1.5, sm: 2 },
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 'bold'
              }}
            >
              {isSignup ? "🚀 Create Account" : "🔓 Sign In"}
            </Button>
            
            <Button 
              onClick={()=>setIsSignup(s=>!s)}
              variant="text"
              sx={{ 
                textTransform: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: 1
              }}
            >
              {isSignup ? "Already have an account? Sign In" : "New to VividSmiles? Sign Up"}
            </Button>
            
            {isSignup && (
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  backgroundColor: '#e3f2fd',
                  border: '1px solid #2196f3'
                }}
              >
                <Typography 
                  variant="body2" 
                  color="primary"
                  sx={{ 
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    textAlign: 'center'
                  }}
                >
                  ℹ️ New accounts are created with Manager role
                </Typography>
              </Paper>
            )}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
