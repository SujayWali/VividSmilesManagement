import { useRole } from "@/hooks/useRole";
import { db } from "@/lib/firebase";
import { Role } from "@/types/models";
import { AppBar, Box, Button, Container, MenuItem, Select, Stack, Toolbar, Typography, Paper, Card, CardContent } from "@mui/material";
import { collection, doc, onSnapshot, query, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

type U = { uid: string; email: string; role: Role };

export default function ManageUsers() {
  const role = useRole();
  const [users, setUsers] = useState<U[]>([]);

  useEffect(()=>{
    const q = query(collection(db, "users"));
    return onSnapshot(q, snap => setUsers(snap.docs.map(d=> d.data() as U)));
  }, []);

  if (role !== "admin") return (
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

  async function changeRole(u: U, role: Role) {
    await setDoc(doc(db, "users", u.uid), { ...u, role }, { merge: true });
  }

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar sx={{ px: { xs: 1, sm: 3 } }}>
          <Typography 
            sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }} 
            variant="h6"
          >
            👥 Manage Users
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
      
      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#1976d2', 
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            🔧 User Role Management
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            Manage user permissions and roles
          </Typography>
        </Paper>

        <Stack spacing={{ xs: 2, sm: 2 }}>
          {users.map(u => (
            <Card key={u.uid} elevation={2}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={{ xs: 2, sm: 2 }}
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        fontWeight: 'medium',
                        wordBreak: 'break-word'
                      }}
                    >
                      {u.email}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        display: { xs: 'block', sm: 'none' }
                      }}
                    >
                      Current role: {u.role}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ minWidth: { xs: '100%', sm: 140 } }}>
                    <Select 
                      size="small" 
                      value={u.role} 
                      onChange={(e)=>changeRole(u, e.target.value as Role)}
                      fullWidth
                      sx={{
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                      }}
                    >
                      <MenuItem value="admin">👑 Admin</MenuItem>
                      <MenuItem value="manager">👨‍💼 Manager</MenuItem>
                    </Select>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
        
        {users.length === 0 && (
          <Paper elevation={1} sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              No users found
            </Typography>
          </Paper>
        )}
      </Container>
    </>
  );
}
