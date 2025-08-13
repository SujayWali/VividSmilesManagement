import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography, Paper, Card, CardContent, Avatar, Chip, Grid, Alert } from "@mui/material";
import { Person, Group, AdminPanelSettings, Dashboard, ExitToApp, CalendarToday, LocalHospital, Refresh } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, error, logout } = useAuth();
  const role = useRole();
  const router = useRouter();

  useEffect(()=>{
    if (!loading && !user && !error) router.push("/login");
  }, [user, loading, error, router]);

  // Show error state if Firebase configuration failed
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
        <Paper sx={{ p: 4, maxWidth: 600, width: '100%' }}>
          <Stack spacing={3}>
            <Typography variant="h4" color="error" textAlign="center">
              🔧 Configuration Error
            </Typography>
            
            <Alert severity="error" sx={{ textAlign: 'left' }}>
              <Typography variant="body1" gutterBottom>
                <strong>Authentication Error:</strong>
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>

            <Typography variant="body2" color="text.secondary" textAlign="center">
              This usually means Firebase environment variables are not properly configured.
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button 
                variant="contained" 
                onClick={() => window.location.reload()}
                startIcon={<Refresh />}
              >
                Retry
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => window.location.href = '/debug'}
              >
                Debug Info
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }

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
        <Toolbar sx={{ py: { xs: 0.5, sm: 1 }, px: { xs: 1, sm: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              mr: { xs: 1, sm: 2 },
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              fontSize: { xs: '1.2rem', sm: '1.5rem' }
            }}>
              🦷
            </Avatar>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'white',
                  fontSize: { xs: '1.1rem', sm: '1.5rem' }
                }}
              >
                Vivid Smiles Dashboard
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                Complete Dental Care Management
              </Typography>
            </Box>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }} alignItems="center">
            <Chip 
              label={role || "Loading..."} 
              size="small"
              sx={{ 
                background: 'rgba(255,255,255,0.2)', 
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                fontSize: { xs: '0.7rem', sm: '0.875rem' }
              }} 
            />
            <Button 
              color="inherit" 
              onClick={logout}
              startIcon={<ExitToApp />}
              size="small"
              sx={{ 
                background: 'rgba(255,255,255,0.1)',
                '&:hover': { background: 'rgba(255,255,255,0.2)' },
                borderRadius: 2,
                px: { xs: 2, sm: 3 },
                fontSize: { xs: '0.8rem', sm: '1rem' }
              }}
            >
              Logout
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: { xs: 2, sm: 4 }
      }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Welcome Section */}
          <Paper 
            elevation={8} 
            sx={{ 
              p: { xs: 2, sm: 4 }, 
              mb: { xs: 2, sm: 4 }, 
              borderRadius: { xs: 2, sm: 4 }, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: { xs: 60, sm: 100 },
              height: { xs: 60, sm: 100 },
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              zIndex: 1
            }} />
            <Box sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: { xs: 80, sm: 120 },
              height: { xs: 80, sm: 120 },
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              zIndex: 1
            }} />
            
            <Box sx={{ position: 'relative', zIndex: 2 }}>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 2, sm: 3 }} 
                alignItems={{ xs: 'center', sm: 'flex-start' }}
                textAlign={{ xs: 'center', sm: 'left' }}
              >
                <Avatar sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  width: { xs: 48, sm: 64 }, 
                  height: { xs: 48, sm: 64 },
                  border: '2px solid rgba(255,255,255,0.3)',
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  👨‍⚕️
                </Avatar>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 1,
                      fontSize: { xs: '1.5rem', sm: '2.125rem' }
                    }}
                  >
                    Welcome Back!
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9, 
                      fontWeight: 300,
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    {user.email}
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.8, 
                      mt: 1,
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  >
                    Manage your dental practice with ease
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Paper>

          {/* Quick Actions */}
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 'bold', 
              color: '#333', 
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.5rem', sm: '2.125rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            Quick Actions
          </Typography>
          
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Patients Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Card 
                elevation={6}
                sx={{ 
                  height: '100%',
                  borderRadius: { xs: 2, sm: 3 },
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '1px solid rgba(102, 126, 234, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-8px)' },
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.2)',
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={{ xs: 2, sm: 3 }} 
                    alignItems="center" 
                    textAlign={{ xs: 'center', sm: 'left' }}
                    mb={{ xs: 2, sm: 3 }}
                  >
                    <Avatar sx={{ 
                      bgcolor: '#667eea', 
                      width: { xs: 48, sm: 64 }, 
                      height: { xs: 48, sm: 64 },
                      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                    }}>
                      <Person sx={{ fontSize: { xs: 24, sm: 32 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#333',
                          fontSize: { xs: '1.25rem', sm: '2.125rem' }
                        }}
                      >
                        Patients
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 1,
                          fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                      >
                        Manage patient records, visits, and medical history
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Button
                    component={Link}
                    href="/patients"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{
                      borderRadius: { xs: 2, sm: 3 },
                      textTransform: 'none',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      py: { xs: 1.5, sm: 2 },
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #7689ea 30%, #8659b2 90%)',
                        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                      }
                    }}
                  >
                    <Dashboard sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                    Open Patient Management
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Appointments Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Card 
                elevation={6}
                sx={{ 
                  height: '100%',
                  borderRadius: { xs: 2, sm: 3 },
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '1px solid rgba(33, 150, 243, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-8px)' },
                    boxShadow: '0 12px 40px rgba(33, 150, 243, 0.2)',
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={{ xs: 2, sm: 3 }} 
                    alignItems="center" 
                    textAlign={{ xs: 'center', sm: 'left' }}
                    mb={{ xs: 2, sm: 3 }}
                  >
                    <Avatar sx={{ 
                      bgcolor: '#2196F3', 
                      width: { xs: 48, sm: 64 }, 
                      height: { xs: 48, sm: 64 },
                      boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)'
                    }}>
                      <CalendarToday sx={{ fontSize: { xs: 24, sm: 32 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#333',
                          fontSize: { xs: '1.25rem', sm: '2.125rem' }
                        }}
                      >
                        Appointments
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 1,
                          fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                      >
                        Schedule and manage patient appointments
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Button
                    component={Link}
                    href="/appointments"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{
                      borderRadius: { xs: 2, sm: 3 },
                      textTransform: 'none',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      py: { xs: 1.5, sm: 2 },
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 4px 16px rgba(33, 150, 243, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #42A5F5 30%, #42CBF5 90%)',
                        boxShadow: '0 8px 24px rgba(33, 150, 243, 0.4)',
                      }
                    }}
                  >
                    <CalendarToday sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                    Open Appointment Manager
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Tooth Chart Card */}
            <Grid item xs={12} md={6} lg={4}>
              <Card 
                elevation={6}
                sx={{ 
                  height: '100%',
                  borderRadius: { xs: 2, sm: 3 },
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                  border: '1px solid rgba(76, 175, 80, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-8px)' },
                    boxShadow: '0 12px 40px rgba(76, 175, 80, 0.2)',
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={{ xs: 2, sm: 3 }} 
                    alignItems="center" 
                    textAlign={{ xs: 'center', sm: 'left' }}
                    mb={{ xs: 2, sm: 3 }}
                  >
                    <Avatar sx={{ 
                      bgcolor: '#4CAF50', 
                      width: { xs: 48, sm: 64 }, 
                      height: { xs: 48, sm: 64 },
                      boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)'
                    }}>
                      <LocalHospital sx={{ fontSize: { xs: 24, sm: 32 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h4" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#333',
                          fontSize: { xs: '1.25rem', sm: '2.125rem' }
                        }}
                      >
                        Tooth Chart
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        sx={{ 
                          mt: 1,
                          fontSize: { xs: '0.9rem', sm: '1rem' }
                        }}
                      >
                        Interactive dental charts for treatment tracking
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Button
                    component={Link}
                    href="/patients"
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{
                      borderRadius: { xs: 2, sm: 3 },
                      textTransform: 'none',
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                      py: { xs: 1.5, sm: 2 },
                      background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                      boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #66BB6A 30%, #81C784 90%)',
                        boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)',
                      }
                    }}
                  >
                    <LocalHospital sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                    Access Tooth Charts
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Admin Panel Card */}
            {role === "admin" && (
              <Grid item xs={12} md={6} lg={4}>
                <Card 
                  elevation={6}
                  sx={{ 
                    height: '100%',
                    borderRadius: { xs: 2, sm: 3 },
                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid rgba(254, 107, 139, 0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-8px)' },
                      boxShadow: '0 12px 40px rgba(254, 107, 139, 0.2)',
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={{ xs: 2, sm: 3 }} 
                      alignItems="center" 
                      textAlign={{ xs: 'center', sm: 'left' }}
                      mb={{ xs: 2, sm: 3 }}
                    >
                      <Avatar sx={{ 
                        bgcolor: '#FE6B8B', 
                        width: { xs: 48, sm: 64 }, 
                        height: { xs: 48, sm: 64 },
                        boxShadow: '0 8px 24px rgba(254, 107, 139, 0.3)'
                      }}>
                        <AdminPanelSettings sx={{ fontSize: { xs: 24, sm: 32 } }} />
                      </Avatar>
                      <Box>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: '#333',
                            fontSize: { xs: '1.25rem', sm: '2.125rem' }
                          }}
                        >
                          Admin Panel
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="text.secondary" 
                          sx={{ 
                            mt: 1,
                            fontSize: { xs: '0.9rem', sm: '1rem' }
                          }}
                        >
                          Manage users, permissions, and system settings
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Stack spacing={{ xs: 2, sm: 2 }}>
                      <Button
                        component={Link}
                        href="/manage-users"
                        variant="contained"
                        size="large"
                        fullWidth
                        sx={{
                          borderRadius: { xs: 2, sm: 3 },
                          textTransform: 'none',
                          fontSize: { xs: '1rem', sm: '1.1rem' },
                          py: { xs: 1.5, sm: 2 },
                          background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                          boxShadow: '0 4px 16px rgba(254, 107, 139, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #FE8B8B 30%, #FFAE53 90%)',
                            boxShadow: '0 8px 24px rgba(254, 107, 139, 0.4)',
                          }
                        }}
                      >
                        <Group sx={{ mr: 1, fontSize: { xs: 20, sm: 24 } }} />
                        Open User Management
                      </Button>
                      
                      <Button
                        component={Link}
                        href="/firestore-migration"
                        variant="outlined"
                        size="large"
                        fullWidth
                        sx={{
                          borderRadius: { xs: 2, sm: 3 },
                          textTransform: 'none',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          py: { xs: 1.5, sm: 1.5 },
                          borderColor: '#FF8E53',
                          color: '#FF8E53',
                          '&:hover': {
                            borderColor: '#FE6B8B',
                            backgroundColor: 'rgba(254, 107, 139, 0.05)',
                          }
                        }}
                      >
                        🔧 Database Migration
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Stats Section */}
          <Paper 
            elevation={4} 
            sx={{ 
              mt: { xs: 2, sm: 4 }, 
              p: { xs: 2, sm: 3 }, 
              borderRadius: { xs: 2, sm: 3 },
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              textAlign: 'center'
            }}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#333', 
                mb: 2,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              🏥 Vivid Smiles Complete Dental Care
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              Professional dental practice management system
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mt: 1,
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              📞 For Appointments: +91 8920851141 | 🌐 www.vividsmiles.in
            </Typography>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
