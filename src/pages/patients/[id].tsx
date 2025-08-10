import { db } from "@/lib/firebase";
import { useRole } from "@/hooks/useRole";
import { Visit } from "@/types/models";
import { Delete, Send, Edit, Save, Cancel, ArrowBack } from "@mui/icons-material";
import { AppBar, Box, Button, Container, IconButton, List, ListItem, ListItemText, Stack, TextField, Toolbar, Typography, Paper, Divider, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

export default function PatientDetails() {
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const role = useRole();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [editableMessage, setEditableMessage] = useState("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);

  useEffect(()=>{
    if (!id) return;
    const unsub1 = onSnapshot(doc(db, "patients", id), (snap)=> setPatient({ id: snap.id, ...snap.data() }));
    const q = query(collection(db, "patients", id, "visits"), orderBy("date", "desc"));
    const unsub2 = onSnapshot(q, (snap)=> setVisits(snap.docs.map(d=> ({ id: d.id, ...(d.data() as any) }))));
    return () => { unsub1(); unsub2(); };
  }, [id]);

  // Initialize editable message when patient and visits are first loaded
  useEffect(() => {
    if (patient && visits.length >= 0) {
      const latest = visits[0];
      const meds = (latest?.medicines || []).join(", ");
      const defaultMessage = `Vivid Smiles Complete Dental Care
Date: ${latest?.date ?? ""}
Name: ${patient.name}
Age: ${patient.age} | Gender: ${patient.gender}
Dental History: ${patient.history || "First visit"}
Treatment: ${latest?.treatment || "-"}
Prescribed: ${meds || "-"}

For Appointments: +91 8920851141 | www.vividsmiles.in`;
      
      // Only update if we're not currently editing the message
      if (!isEditingMessage) {
        setEditableMessage(defaultMessage);
      }
    }
  }, [patient, visits, isEditingMessage]);

  const messagePreview = useMemo(()=>{
    if (!patient) return "";
    const latest = visits[0];
    const meds = (latest?.medicines || []).join(", ");
    return `Vivid Smiles Complete Dental Care
Date: ${latest?.date ?? ""}
Name: ${patient.name}
Age: ${patient.age} | Gender: ${patient.gender}
Dental History: ${patient.history || "First visit"}
Treatment: ${latest?.treatment || "-"}
Prescribed: ${meds || "-"}

For Appointments: +91 8920851141 | www.vividsmiles.in`;
  }, [patient, visits]);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
      case "Paid via UPI":
      case "Paid Via Cash":
      case "Paid via Card":
        return "success.main";
      case "Pending":
        return "warning.main";
      case "Payment Error":
      case "UnPaid":
        return "error.main";
      default:
        return "text.secondary";
    }
  };

  async function addVisit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const payload = {
      date: fd.get("date") as string,
      treatment: fd.get("treatment") as string,
      medicines: (fd.get("medicines") as string || "").split(",").map(s=>s.trim()).filter(Boolean),
      payment: Number(fd.get("payment") || 0),
      paymentStatus: fd.get("paymentStatus") as string || "Pending"
    };
    await addDoc(collection(db, "patients", id, "visits"), payload);
    form.reset();
  }

  async function sendWhatsApp() {
    if (!patient) return;
    
    // Format patient's phone number (remove any spaces, dashes, and ensure it starts with country code)
    let patientPhone = patient.phone.replace(/[\s-]/g, '');
    if (!patientPhone.startsWith('+')) {
      patientPhone = patientPhone.startsWith('91') ? `+${patientPhone}` : `+91${patientPhone}`;
    }
    
    // Use the editable message instead of the default preview
    const messageToSend = editableMessage || messagePreview;
    const whatsappUrl = `https://wa.me/${patientPhone.replace('+', '')}?text=${encodeURIComponent(messageToSend)}`;
    
    // Open WhatsApp - this will open on YOUR device/WhatsApp (+91 8920851141) 
    // with the patient's number selected and the message pre-filled
    window.open(whatsappUrl, '_blank');
  }

  async function deleteVisit(visitId: string) {
    setVisitToDelete(visitId);
    setDeleteDialogOpen(true);
  }

  async function confirmDeleteVisit() {
    if (!id || !visitToDelete) return;
    try {
      await deleteDoc(doc(db, "patients", id, "visits", visitToDelete));
      setDeleteDialogOpen(false);
      setVisitToDelete(null);
    } catch (error) {
      console.error("Error deleting visit:", error);
      alert("Failed to delete visit. Please try again.");
    }
  }

  function cancelDeleteVisit() {
    setDeleteDialogOpen(false);
    setVisitToDelete(null);
  }

  async function deletePatient() {
    if (!id) return;
    if (confirm("Delete entire patient record?")) {
      await fetch(`/api/delete-patient?id=${id}`); // optional future
    }
  }

  if (!patient) return null;

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
            {patient.name}
          </Typography>
          <Button 
            color="inherit" 
            href="/patients"
            startIcon={<ArrowBack />}
            size="small"
            sx={{ 
              textTransform: 'none',
              fontSize: { xs: '0.8rem', sm: '1rem' }
            }}
          >
            Back
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 3 } }}>
        {/* Patient Info */}
        <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontWeight: 500,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            {patient.name}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            gutterBottom
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              wordBreak: 'break-word'
            }}
          >
            Phone: {patient.phone} • Age: {patient.age} • Gender: {patient.gender}
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            🦷 Dental History: {patient.history || "No dental history recorded"}
          </Typography>
          {patient.allergies && (
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                mt: 0.5
              }}
            >
              Medical Notes: {patient.allergies}
            </Typography>
          )}
        </Paper>

        {/* Add Visit Form */}
        <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            Add Visit
          </Typography>
          <Box component="form" onSubmit={addVisit}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              flexWrap="wrap" 
              alignItems={{ xs: 'stretch', sm: 'end' }}
            >
              <TextField 
                name="date" 
                label="Date" 
                type="date" 
                required 
                InputLabelProps={{ shrink: true }} 
                size="small"
                sx={{ width: { xs: '100%', sm: 200 } }} 
              />
              <TextField 
                name="treatment" 
                label="Treatment" 
                size="small"
                sx={{ minWidth: { xs: '100%', sm: 200 } }} 
              />
              <TextField 
                name="medicines" 
                label="Medicines (comma separated)" 
                size="small"
                sx={{ minWidth: { xs: '100%', sm: 200 } }} 
              />
              <TextField 
                name="payment" 
                label="Payment (₹)" 
                type="number" 
                size="small"
                sx={{ width: { xs: '100%', sm: 120 } }} 
              />
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                <InputLabel>Payment Status</InputLabel>
                <Select 
                  name="paymentStatus" 
                  label="Payment Status"
                  defaultValue="Pending"
                >
                  <MenuItem value="Paid">✅ Paid</MenuItem>
                  <MenuItem value="Pending">⏳ Pending</MenuItem>
                  <MenuItem value="Paid via UPI">📱 Paid via UPI</MenuItem>
                  <MenuItem value="Paid Via Cash">💵 Paid Via Cash</MenuItem>
                  <MenuItem value="Paid via Card">💳 Paid via Card</MenuItem>
                  <MenuItem value="Payment Error">❌ Payment Error</MenuItem>
                  <MenuItem value="UnPaid">🚫 UnPaid</MenuItem>
                </Select>
              </FormControl>
              <Button 
                type="submit" 
                variant="contained"
                sx={{ 
                  textTransform: 'none',
                  minWidth: { sm: 100 },
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Save
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* Visit History */}
        <Paper elevation={1} sx={{ mb: { xs: 2, sm: 3 } }}>
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
            <Typography 
              variant="h6"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              Visit History ({visits.length})
            </Typography>
          </Box>
          
          <List sx={{ p: 0 }}>
            {visits.map((v, index) => (
              <Box key={v.id}>
                <ListItem sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 2, sm: 3 } }}>
                  <ListItemText 
                    primary={
                      <Stack 
                        direction={{ xs: 'column', sm: 'row' }} 
                        spacing={{ xs: 1, sm: 2 }} 
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '1rem', sm: '1.1rem' }
                          }}
                        >
                          {v.date}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography 
                            variant="body2" 
                            color={getPaymentStatusColor(v.paymentStatus || "Pending")}
                            sx={{ 
                              fontWeight: 500,
                              fontSize: { xs: '0.9rem', sm: '1rem' }
                            }}
                          >
                            ₹{v.payment ?? 0}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color={getPaymentStatusColor(v.paymentStatus || "Pending")}
                            sx={{ 
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              fontWeight: 500,
                              px: 1,
                              py: 0.25,
                              borderRadius: 1,
                              backgroundColor: `${getPaymentStatusColor(v.paymentStatus || "Pending")}15`,
                              border: `1px solid ${getPaymentStatusColor(v.paymentStatus || "Pending")}30`
                            }}
                          >
                            {v.paymentStatus || "Pending"}
                          </Typography>
                        </Stack>
                      </Stack>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            wordBreak: 'break-word'
                          }}
                        >
                          Treatment: {v.treatment || "Not specified"}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                            wordBreak: 'break-word'
                          }}
                        >
                          Medicines: {(v.medicines || []).join(", ") || "None prescribed"}
                        </Typography>
                      </Box>
                    }
                  />
                  {role === "admin" && (
                    <IconButton 
                      edge="end" 
                      onClick={() => deleteVisit(v.id)}
                      color="error"
                      size="small"
                      sx={{
                        ml: { xs: 1, sm: 2 }
                      }}
                    >
                      <Delete />
                    </IconButton>
                  )}
                </ListItem>
                {index < visits.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
          
          {visits.length === 0 && (
            <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                No visit records yet
              </Typography>
            </Box>
          )}
        </Paper>

        {/* WhatsApp Message */}
        <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', sm: 'center' }} 
            justifyContent="space-between" 
            mb={2}
          >
            <Typography 
              variant="h6"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              WhatsApp Message
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Send/>} 
              onClick={sendWhatsApp}
              sx={{ 
                textTransform: 'none',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Send
            </Button>
          </Stack>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            mb={2}
          >
            <Typography 
              variant="subtitle2" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}
            >
              Message Preview
            </Typography>
            {!isEditingMessage ? (
              <Button 
                size="small" 
                startIcon={<Edit/>} 
                onClick={() => setIsEditingMessage(true)}
                sx={{ 
                  textTransform: 'none',
                  alignSelf: { xs: 'flex-start', sm: 'center' }
                }}
              >
                Edit
              </Button>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button 
                  size="small" 
                  startIcon={<Save/>} 
                  onClick={() => setIsEditingMessage(false)}
                  variant="contained"
                  sx={{ textTransform: 'none' }}
                >
                  Save
                </Button>
                <Button 
                  size="small" 
                  startIcon={<Cancel/>} 
                  onClick={() => {
                    setEditableMessage(messagePreview);
                    setIsEditingMessage(false);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
              </Stack>
            )}
          </Stack>
          
          {isEditingMessage ? (
            <TextField
              multiline
              rows={6}
              fullWidth
              value={editableMessage}
              onChange={(e) => setEditableMessage(e.target.value)}
              variant="outlined"
              size="small"
            />
          ) : (
            <Paper 
              variant="outlined" 
              sx={{ p: { xs: 1.5, sm: 2 }, backgroundColor: 'grey.50' }}
            >
              <pre style={{ 
                whiteSpace: "pre-wrap", 
                fontFamily: 'monospace', 
                margin: 0,
                fontSize: '0.75rem',
                lineHeight: 1.4,
                wordBreak: 'break-word'
              }}>
                {editableMessage || messagePreview}
              </pre>
            </Paper>
          )}
        </Paper>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteVisit}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Visit Record
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this visit record? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteVisit} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteVisit} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
