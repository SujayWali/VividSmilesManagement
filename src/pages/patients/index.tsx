import { db } from "@/lib/firebase";
import { Patient } from "@/types/models";
import { Add, Person, Phone, History, Delete } from "@mui/icons-material";
import { AppBar, Box, Button, Card, CardContent, Container, Dialog, DialogContent, FormControl, IconButton, InputLabel, List, ListItem, ListItemText, MenuItem, Select, Stack, TextField, Toolbar, Typography, Paper, Avatar, Chip, Pagination, Divider, DialogTitle, DialogActions, DialogContentText } from "@mui/material";
import { collection, addDoc, serverTimestamp, onSnapshot, orderBy, query, doc, deleteDoc, getDocs } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRole } from "@/hooks/useRole";

export default function Patients() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Patient[]>([]);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const itemsPerPage = 20;
  const role = useRole();

  useEffect(()=>{
    const q = query(collection(db, "patients"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap)=>{
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
  }, []);

  const filtered = useMemo(()=> items.filter(p => (p.name+ p.phone).toLowerCase().includes(filter.toLowerCase())), [items, filter]);
  
  const paginatedItems = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, page, itemsPerPage]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const gender = fd.get("gender") as string;
      const address = fd.get("address") as string;
    
    if (!gender) {
      alert("Please select a gender");
      return;
    }
      if (!address || address.trim() === "") {
        alert("Address is required");
        return;
      }
    
    const payload = {
      name: fd.get("name") as string,
      phone: fd.get("phone") as string,
      age: Number(fd.get("age")),
      gender: gender,
      allergies: fd.get("allergies") as string,
      history: fd.get("history") as string,
        address: address,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await addDoc(collection(db, "patients"), payload);
    form.reset();
    setOpen(false);
  }

  async function handleDeletePatient(patient: Patient) {
    setPatientToDelete(patient);
    setDeleteDialogOpen(true);
  }

  async function confirmDeletePatient() {
    if (!patientToDelete) return;
    
    setIsDeleting(true);
    try {
      // Delete all visits for this patient
      const visitsSnapshot = await getDocs(collection(db, "patients", patientToDelete.id, "visits"));
      const visitDeletePromises = visitsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(visitDeletePromises);

      // Delete all prescriptions for this patient
      const prescriptionsSnapshot = await getDocs(collection(db, "patients", patientToDelete.id, "prescriptions"));
      const prescriptionDeletePromises = prescriptionsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(prescriptionDeletePromises);

      // Delete the patient document
      await deleteDoc(doc(db, "patients", patientToDelete.id));
      
      setDeleteDialogOpen(false);
      setPatientToDelete(null);
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("Failed to delete patient. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  function cancelDeletePatient() {
    setDeleteDialogOpen(false);
    setPatientToDelete(null);
  }

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar sx={{ px: { xs: 1, sm: 3 } }}>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
          >
            👥 Patients
          </Typography>
          <Button 
            color="inherit" 
            href="/"
            sx={{ 
              textTransform: 'none',
              fontSize: { xs: '0.8rem', sm: '1rem' },
              mr: 2
            }}
          >
            🏠 Home
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
        {/* Header Section */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'center', sm: 'flex-start' }} 
            justifyContent="space-between"
            textAlign={{ xs: 'center', sm: 'left' }}
          >
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#1976d2', 
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '2.125rem' }
                }}
              >
                Patient Records
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Manage your dental practice patients efficiently
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<Add/>} 
              onClick={()=>setOpen(true)}
              sx={{ 
                textTransform: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                px: { xs: 2, sm: 3 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Add New Patient
            </Button>
          </Stack>
        </Paper>

        {/* Search Section */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 2 }, mb: { xs: 2, sm: 3 } }}>
          <TextField 
            fullWidth
            size="medium"
            placeholder="🔍 Search by patient name or phone number..." 
            value={filter} 
            onChange={(e)=>setFilter(e.target.value)}
          />
        </Paper>

        {/* Patients List */}
        <Paper elevation={2}>
          <Box sx={{ p: { xs: 2, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold', 
                color: '#1976d2',
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              📋 Patient Records ({filtered.length} total)
            </Typography>
          </Box>
          
          <List sx={{ p: 0 }}>
            {paginatedItems.map((p, index) => (
              <Box key={p.id}>
                <ListItem 
                  sx={{ 
                    py: { xs: 2, sm: 2 }, 
                    px: { xs: 2, sm: 3 },
                    '&:hover': { 
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer'
                    }
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                    <Avatar sx={{ bgcolor: '#1976d2', width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
                      <Person />
                    </Avatar>
                    
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={{ xs: 1, sm: 2 }} 
                        alignItems={{ xs: 'flex-start', sm: 'center' }} 
                        mb={1}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold',
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                            wordBreak: 'break-word'
                          }}
                        >
                          {p.name}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip 
                            label={`${p.age} years`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={p.gender} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                        </Stack>
                      </Stack>
                      
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Phone sx={{ fontSize: 16, color: '#666' }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            {p.phone}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <History sx={{ fontSize: 16, color: '#666' }} />
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              fontSize: { xs: '0.8rem', sm: '0.875rem' },
                              wordBreak: 'break-word'
                            }}
                          >
                            Dental: {p.history ? `${p.history.substring(0, 30)}${p.history.length > 30 ? '...' : ''}` : "No dental history recorded"}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                    
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button 
                        variant="contained" 
                        component={Link} 
                        href={`/patients/${p.id}`}
                        size="small"
                        sx={{ 
                          textTransform: 'none',
                          minWidth: { xs: 80, sm: 120 },
                          fontSize: { xs: '0.8rem', sm: '0.875rem' }
                        }}
                      >
                        View
                      </Button>
                      
                      {role === "admin" && (
                        <IconButton 
                          onClick={() => handleDeletePatient(p)}
                          color="error"
                          size="small"
                          sx={{
                            bgcolor: 'error.light',
                            color: 'white',
                            '&:hover': { 
                              bgcolor: 'error.main' 
                            },
                            width: { xs: 32, sm: 36 },
                            height: { xs: 32, sm: 36 }
                          }}
                        >
                          <Delete sx={{ fontSize: { xs: 16, sm: 20 } }} />
                        </IconButton>
                      )}
                    </Stack>
                  </Stack>
                </ListItem>
                {index < paginatedItems.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
          
          {paginatedItems.length === 0 && (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {items.length === 0 ? '👨‍⚕️ No patients added yet' : '🔍 No patients found matching your search'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {items.length === 0 ? 'Add your first patient to get started!' : 'Try adjusting your search terms'}
              </Typography>
            </Box>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ 
              p: { xs: 2, sm: 3 }, 
              display: 'flex', 
              justifyContent: 'center', 
              borderTop: '1px solid #e0e0e0' 
            }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={(event, newPage) => setPage(newPage)}
                color="primary"
                size="medium"
                showFirstButton 
                showLastButton
                sx={{
                  '& .MuiPaginationItem-root': {
                    fontSize: { xs: '0.8rem', sm: '1rem' },
                    minWidth: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 }
                  }
                }}
              />
            </Box>
          )}
        </Paper>
      </Container>

      <Dialog 
        open={open} 
        onClose={()=>setOpen(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ 
            background: '#1976d2', 
            color: 'white', 
            p: { xs: 2, sm: 3 }, 
            textAlign: 'center' 
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              👨‍⚕️ Add New Patient
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9,
                fontSize: { xs: '0.85rem', sm: '1rem' }
              }}
            >
              Enter patient information to create a new record
            </Typography>
          </Box>
          
          <Box component="form" onSubmit={handleAdd} sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={{ xs: 2, sm: 3 }}>
              <TextField 
                name="name" 
                label="👤 Full Name" 
                required 
                variant="outlined"
                size="medium"
              />
              
              <TextField 
                name="phone" 
                label="📞 Phone Number" 
                required 
                variant="outlined"
                placeholder="+91 XXXXX XXXXX"
                size="medium"
              />
                <TextField 
                  name="address" 
                  label="🏠 Address" 
                  required 
                  variant="outlined"
                  placeholder="Enter address..."
                  size="medium"
                />
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2}
              >
                <TextField 
                  name="age" 
                  label="🎂 Age" 
                  type="number" 
                  required 
                  variant="outlined"
                  size="medium"
                  sx={{ flex: 1 }}
                />
                <FormControl sx={{ flex: 1 }} required>
                  <InputLabel>⚧️ Gender</InputLabel>
                  <Select 
                    name="gender" 
                    label="⚧️ Gender" 
                    defaultValue=""
                    required
                    size="medium"
                  >
                    <MenuItem value="Male">👨 Male</MenuItem>
                    <MenuItem value="Female">👩 Female</MenuItem>
                    <MenuItem value="Other">⚧️ Other</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              
              <TextField 
                name="allergies" 
                label="🏥 Medical Notes" 
                multiline 
                rows={3}
                variant="outlined"
                placeholder="Allergies, medications, medical conditions..."
                size="medium"
              />
              
              <TextField 
                name="history" 
                label="🦷 Dental History" 
                multiline 
                rows={3}
                variant="outlined"
                placeholder="Previous dental treatments, procedures, concerns..."
                size="medium"
              />
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                justifyContent="flex-end" 
                sx={{ pt: { xs: 1, sm: 2 } }}
              >
                <Button 
                  onClick={()=>setOpen(false)}
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    textTransform: 'none',
                    px: 3,
                    order: { xs: 2, sm: 1 }
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  size="medium"
                  sx={{ 
                    textTransform: 'none',
                    px: 4,
                    order: { xs: 1, sm: 2 }
                  }}
                >
                  💾 Save Patient
                </Button>
              </Stack>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeletePatient}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="delete-dialog-title" sx={{ color: 'error.main', fontWeight: 'bold' }}>
          🗑️ Delete Patient Record
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete <strong>{patientToDelete?.name}</strong>'s record?
          </DialogContentText>
          <DialogContentText sx={{ color: 'error.main', fontWeight: 500 }}>
            ⚠️ This action will delete:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 1, pl: 3, color: 'text.secondary' }}>
            <li>Patient information and medical history</li>
            <li>All visit records and treatments</li>
            <li>All uploaded prescriptions and documents</li>
            <li>All related data permanently</li>
          </Box>
          <DialogContentText sx={{ mt: 2, fontWeight: 500, color: 'error.main' }}>
            This action cannot be undone!
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={cancelDeletePatient} 
            color="primary"
            variant="outlined"
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeletePatient} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            sx={{ minWidth: 120 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
