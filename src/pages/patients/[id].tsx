/**
 * Audio Recorder for Doctor-Patient Conversations
 * 
 * 🎯 Features:
 * - Record microphone input using the browser's MediaRecorder API
 * - Provide buttons to Start, Stop, and Download the audio
 * - Save audio as .webm Blob and allow manual download
 * - (Optional) Convert downloaded .webm to .mp3 using external tools like ffmpeg
 * 
 * 🧠 Notes:
 * - Fully frontend-only (no backend required)
 * - Runs locally in browser, no hosting needed
 * - Should include playback and download functionality
 * - Provide timestamp-based filename like conversation_2025-08-15T14-30.webm
 */



function AudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    mediaRecorderRef.current.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      setAudioUrl(URL.createObjectURL(blob));
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}-${pad(now.getMinutes())}`;
    a.href = audioUrl;
    a.download = `conversation_${timestamp}.webm`;
    a.click();
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>🎤 Audio Recorder</Typography>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <Button onClick={startRecording} disabled={recording} variant="contained">Start Recording</Button>
        <Button onClick={stopRecording} disabled={!recording} variant="outlined">Stop</Button>
        <Button onClick={downloadAudio} disabled={!audioUrl} variant="outlined">Download (.webm)</Button>
      </Stack>
      {audioUrl && <audio src={audioUrl} controls />}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Note: The file is recorded as .webm.
      </Typography>
    </Box>
  );
}
import { db } from "@/lib/firebase";
import { useRole } from "@/hooks/useRole";
import { Visit } from "@/types/models";
import { Delete, Send, Edit, Save, Cancel, ArrowBack, Image as ImageIcon, CloudUpload, Download, LocalHospital } from "@mui/icons-material";
import { AppBar, Box, Button, Container, IconButton, List, ListItem, ListItemText, Stack, TextField, Toolbar, Typography, Paper, Divider, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip, CircularProgress } from "@mui/material";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // Import Quill styles

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function PatientDetails() {
  // ...existing code...
  const router = useRouter();
  const id = router.query.id as string | undefined;
  const role = useRole();
  const [patient, setPatient] = useState<any>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [editableMessage, setEditableMessage] = useState("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null);
  const [isEditingPatient, setIsEditingPatient] = useState(false);
  const [editablePatient, setEditablePatient] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [richTextMessage, setRichTextMessage] = useState("");
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedPrescriptions, setSelectedPrescriptions] = useState<File[]>([]);
  const [isUploadingPrescription, setIsUploadingPrescription] = useState(false);

  useEffect(()=>{
    if (!id) return;
    const unsub1 = onSnapshot(doc(db, "patients", id), (snap)=> setPatient({ id: snap.id, ...snap.data() }));
    const q = query(collection(db, "patients", id, "visits"), orderBy("date", "desc"));
    const unsub2 = onSnapshot(q, (snap)=> setVisits(snap.docs.map(d=> ({ id: d.id, ...(d.data() as any) }))));
    const prescriptionsQ = query(collection(db, "patients", id, "prescriptions"), orderBy("uploadDate", "desc"));
    const unsub3 = onSnapshot(prescriptionsQ, (snap)=> setPrescriptions(snap.docs.map(d=> ({ id: d.id, ...(d.data() as any) }))));
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [id]);

  // Initialize editable message when patient and visits are first loaded
  useEffect(() => {
    if (patient && visits.length >= 0) {
      const latest = visits[0];
      const meds = (latest?.medicines || []).join(", ");
      const defaultMessage = `Vivid Smiles Complete Dental Care\nDate: ${latest?.date ?? ""}\n\nName: ${patient.name}\n\nAge: ${patient.age} | Gender: ${patient.gender}\n\nDental History: ${patient.history || "First visit"}\n\nTreatment: ${latest?.treatment || "-"}\n\nPrescribed: ${meds || "-"}\n\nFor Appointments: +91 8920851141 | www.vividsmiles.in`;
      
      // Only update if we're not currently editing the message
      if (!isEditingMessage) {
        setEditableMessage(defaultMessage);
      }
      
      // Initialize editable patient data
      if (patient && !editablePatient) {
        setEditablePatient({
          name: patient.name || "",
          phone: patient.phone || "",
          age: patient.age || "",
          gender: patient.gender || "",
          history: patient.history || "",
          allergies: patient.allergies || ""
        });
      }
      
      // Initialize notes
      if (patient && patient.notes !== undefined) {
        setNotes(patient.notes || "");
      }
      
      // Initialize rich text message
      if (!richTextMessage) {
        const latest = visits[0];
        const meds = (latest?.medicines || []).join(", ");
        const defaultRichMessage = `<h3>Vivid Smiles Complete Dental Care</h3>
<p><strong>Date:</strong> ${latest?.date ?? ""}</p>
<p><strong>Name:</strong> ${patient.name}</p>
<p><strong>Age:</strong> ${patient.age} | <strong>Gender:</strong> ${patient.gender}</p>
<p><strong>Dental History:</strong> ${patient.history || "First visit"}</p>
<p><strong>Treatment:</strong> ${latest?.treatment || "-"}</p>
<p><strong>Prescribed:</strong> ${meds || "-"}</p>
<br>
<p><em>For Appointments: +91 8920851141 | www.vividsmiles.in</em></p>`;
        setRichTextMessage(defaultRichMessage);
      }
    }
  }, [patient, visits, isEditingMessage, editablePatient, richTextMessage]);

  const messagePreview = useMemo(()=>{
    if (!patient) return "";
    const latest = visits[0];
    const meds = (latest?.medicines || []).join(", ");
    return `Vivid Smiles Complete Dental Care\nDate: ${latest?.date ?? ""}\n\nName: ${patient.name}\n\nAge: ${patient.age} | Gender: ${patient.gender}\n\nDental History: ${patient.history || "First visit"}\n\nTreatment: ${latest?.treatment || "-"}\n\nPrescribed: ${meds || "-"}\n\nFor Appointments: +91 8920851141 | www.vividsmiles.in`;
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newImages = Array.from(files);
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removePrescription = (index: number) => {
    setSelectedPrescriptions(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPrescriptions = async () => {
    if (!id || selectedPrescriptions.length === 0) return;
    
    setIsUploadingPrescription(true);
    try {
      for (const file of selectedPrescriptions) {
        const fileData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        await addDoc(collection(db, "patients", id, "prescriptions"), {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileData: fileData,
          uploadDate: new Date().toISOString(),
          uploadTime: new Date().getTime()
        });
      }
      
      setSelectedPrescriptions([]);
      alert("Prescriptions uploaded successfully!");
    } catch (error) {
      console.error("Error uploading prescriptions:", error);
      alert("Failed to upload prescriptions. Please try again.");
    } finally {
      setIsUploadingPrescription(false);
    }
  };

  async function savePatientInfo() {
    if (!id || !editablePatient) return;
    try {
      await updateDoc(doc(db, "patients", id), {
        name: editablePatient.name,
        phone: editablePatient.phone,
        age: editablePatient.age,
        gender: editablePatient.gender,
        history: editablePatient.history,
        allergies: editablePatient.allergies
      });
      setIsEditingPatient(false);
    } catch (error) {
      console.error("Error updating patient:", error);
      alert("Failed to update patient information. Please try again.");
    }
  }

  function cancelPatientEdit() {
    if (patient) {
      setEditablePatient({
        name: patient.name || "",
        phone: patient.phone || "",
        age: patient.age || "",
        gender: patient.gender || "",
        history: patient.history || "",
        allergies: patient.allergies || ""
      });
    }
    setIsEditingPatient(false);
  }

  async function saveNotes() {
    if (!id) return;
    try {
      await updateDoc(doc(db, "patients", id), {
        notes: notes
      });
      setIsEditingNotes(false);
    } catch (error) {
      console.error("Error updating notes:", error);
      alert("Failed to save notes. Please try again.");
    }
  }

  function cancelNotesEdit() {
    if (patient) {
      setNotes(patient.notes || "");
    }
    setIsEditingNotes(false);
  }

  async function handlePrescriptionUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || !id) return;

    for (const file of Array.from(files)) {
      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = reader.result as string;
          
          // Save to Firestore
          await addDoc(collection(db, "patients", id, "prescriptions"), {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            uploadDate: new Date().toISOString(),
            fileData: base64Data
          });
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error uploading prescription:", error);
        alert("Failed to upload prescription. Please try again.");
      }
    }
  }

  async function deletePrescription(prescriptionId: string) {
    if (!id) return;
    if (confirm("Delete this prescription?")) {
      try {
        await deleteDoc(doc(db, "patients", id, "prescriptions", prescriptionId));
      } catch (error) {
        console.error("Error deleting prescription:", error);
        alert("Failed to delete prescription. Please try again.");
      }
    }
  }

  function downloadPrescription(prescription: any) {
    try {
      const link = document.createElement('a');
      link.href = prescription.fileData;
      link.download = prescription.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading prescription:", error);
      alert("Failed to download prescription. Please try again.");
    }
  }

  // Convert HTML to plain text for WhatsApp with better formatting
  function htmlToPlainText(html: string) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Replace HTML elements with WhatsApp-friendly formatting
    let text = html
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '*$1*\n\n') // Headers to bold
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*') // Strong to bold
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*') // Bold to bold
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1') // Em: remove tag, no italics
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1') // Italic: remove tag, no italics
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '$1') // Remove underline tags
      .replace(/<strike[^>]*>(.*?)<\/strike>/gi, '~$1~') // Strike to strikethrough
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n') // Paragraphs with double line breaks
      .replace(/<br[^>]*>/gi, '\n') // Line breaks
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n') // List items with bullets
      .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n') // Ordered lists
      .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n') // Unordered lists
      .replace(/<[^>]+>/g, ''); // Remove any remaining HTML tags
    
    // Clean up extra whitespace and line breaks
    text = text
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple line breaks with double
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .replace(/\s+/g, ' '); // Replace multiple spaces with single space
    
    return text;
  }

  // Removed image handler - now using prescription upload instead

  // Extract images from rich text content
  function extractImagesFromHtml(html: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const images = doc.querySelectorAll('img');
    return Array.from(images).map(img => img.src).filter(src => src.startsWith('data:'));
  }

  async function sendRichWhatsApp() {
    if (!patient) return;
    
    // Format patient's phone number
    let patientPhone = patient.phone.replace(/[\s-]/g, '');
    if (!patientPhone.startsWith('+')) {
      patientPhone = patientPhone.startsWith('91') ? `+${patientPhone}` : `+91${patientPhone}`;
    }
    
    // Convert rich text to well-formatted plain text for WhatsApp
    const plainTextMessage = htmlToPlainText(richTextMessage);
    
    // Extract embedded images from the rich text
    const embeddedImages = extractImagesFromHtml(richTextMessage);
    const totalImages = selectedImages.length + embeddedImages.length;
    
    if (totalImages > 0) {
      // Create image preview dialog with send options
      const imagePreviewDialog = document.createElement('div');
      imagePreviewDialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      `;
      
      imagePreviewDialog.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 24px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
          <h2 style="margin: 0 0 16px 0; color: #333;">📱 Send to WhatsApp</h2>
          <p style="margin: 0 0 20px 0; color: #666;">Message ready to send to ${patient.name}</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px; max-height: 150px; overflow-y: auto;">
            <pre style="margin: 0; font-family: system-ui; font-size: 14px; white-space: pre-wrap;">${plainTextMessage}</pre>
          </div>
          
          ${totalImages > 0 ? `
            <h3 style="margin: 16px 0 12px 0; color: #333;">📷 Images to Send (${totalImages})</h3>
            <div id="imageContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-bottom: 20px;"></div>
          ` : ''}
          
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button onclick="this.closest('div').parentElement.remove()" 
                    style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">
              Cancel
            </button>
            <button onclick="window.sendToWhatsApp('${patientPhone}', \`${plainTextMessage.replace(/`/g, '\\`')}\`)" 
                    style="padding: 10px 20px; border: none; background: #25d366; color: white; border-radius: 6px; cursor: pointer;">
              📱 Open WhatsApp
            </button>
          </div>
        </div>
      `;
      
      // Add images to preview
      const imageContainer = imagePreviewDialog.querySelector('#imageContainer');
      if (imageContainer) {
        // Add selected files
        selectedImages.forEach((file, index) => {
          const img = document.createElement('div');
          img.style.cssText = 'border: 1px solid #ddd; border-radius: 6px; overflow: hidden; aspect-ratio: 1;';
          
          const reader = new FileReader();
          reader.onload = (e) => {
            img.innerHTML = `
              <img src="${e.target?.result}" style="width: 100%; height: 100%; object-fit: cover;" alt="${file.name}">
              <div style="padding: 4px; font-size: 10px; background: rgba(0,0,0,0.7); color: white; position: absolute; bottom: 0; left: 0; right: 0;">
                ${file.name}
              </div>
            `;
          };
          reader.readAsDataURL(file);
          img.style.position = 'relative';
          imageContainer.appendChild(img);
        });
        
        // Add embedded images
        embeddedImages.forEach((imageSrc, index) => {
          const img = document.createElement('div');
          img.style.cssText = 'border: 1px solid #ddd; border-radius: 6px; overflow: hidden; aspect-ratio: 1; position: relative;';
          img.innerHTML = `
            <img src="${imageSrc}" style="width: 100%; height: 100%; object-fit: cover;" alt="Embedded ${index + 1}">
            <div style="padding: 4px; font-size: 10px; background: rgba(0,0,0,0.7); color: white; position: absolute; bottom: 0; left: 0; right: 0;">
              Embedded Image ${index + 1}
            </div>
          `;
          imageContainer.appendChild(img);
        });
      }
      
      document.body.appendChild(imagePreviewDialog);
      
      // Add global function for WhatsApp sending
      (window as any).sendToWhatsApp = (phone: string, message: string) => {
        // Close dialog
        imagePreviewDialog.remove();
        
        // Open WhatsApp with message
        const whatsappUrl = `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Show practical instructions
        setTimeout(() => {
          alert(`� WhatsApp opened!

🎯 Next steps to send images:
1. Your message is already typed in WhatsApp
2. Click the 📎 (attachment) button
3. Select "Camera" or "Gallery"
4. Choose your ${totalImages} image(s)
5. Add caption if needed
6. Press Send

💡 Tip: You can send the text message first, then send images separately, or combine them together!`);
        }, 1000);
      };
      
    } else {
      // No images, direct WhatsApp send
      const whatsappUrl = `https://wa.me/${patientPhone.replace('+', '')}?text=${encodeURIComponent(plainTextMessage)}`;
      window.open(whatsappUrl, '_blank');
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
          <Stack direction="row" spacing={1}>
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
            <Button 
              color="inherit" 
              component={Link}
              href={`/patients/${id}/tooth-chart`}
              startIcon={<LocalHospital />}
              size="small"
              sx={{ 
                textTransform: 'none',
                fontSize: { xs: '0.8rem', sm: '1rem' }
              }}
            >
              Tooth Chart
            </Button>
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
          </Stack>
        </Toolbar>
      </AppBar>
      
  <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}>
        {/* Patient Info */}
  <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ee 100%)', maxWidth: 1200, mx: 'auto', width: { xs: '100%', sm: '98%' } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'stretch', sm: 'center' }} 
            justifyContent="space-between" 
            mb={2}
          >
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 500,
                fontSize: { xs: '1.25rem', sm: '1.5rem' }
              }}
            >
              Patient Information
            </Typography>
            {!isEditingPatient ? (
              <Button 
                size="small" 
                startIcon={<Edit/>} 
                onClick={() => setIsEditingPatient(true)}
                sx={{ 
                  textTransform: 'none',
                  width: { xs: '100%', sm: 'auto' }
                }}
              >
                Edit
              </Button>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button 
                  size="small" 
                  startIcon={<Save/>} 
                  onClick={savePatientInfo}
                  variant="contained"
                  sx={{ textTransform: 'none' }}
                >
                  Save
                </Button>
                <Button 
                  size="small" 
                  startIcon={<Cancel/>} 
                  onClick={cancelPatientEdit}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
              </Stack>
            )}
          </Stack>

          {isEditingPatient && editablePatient ? (
            <Stack spacing={2}>
              <TextField
                label="Name"
                value={editablePatient.name}
                onChange={(e) => setEditablePatient({...editablePatient, name: e.target.value})}
                fullWidth
                size="small"
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Phone"
                  value={editablePatient.phone}
                  onChange={(e) => setEditablePatient({...editablePatient, phone: e.target.value})}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Age"
                  value={editablePatient.age}
                  onChange={(e) => setEditablePatient({...editablePatient, age: e.target.value})}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 100 } }}
                />
                <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={editablePatient.gender}
                    onChange={(e) => setEditablePatient({...editablePatient, gender: e.target.value})}
                    label="Gender"
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              <TextField
                label="Dental History"
                value={editablePatient.history}
                onChange={(e) => setEditablePatient({...editablePatient, history: e.target.value})}
                multiline
                rows={2}
                fullWidth
                size="small"
                placeholder="Enter dental history..."
              />
              <TextField
                label="Medical Notes / Allergies"
                value={editablePatient.allergies}
                onChange={(e) => setEditablePatient({...editablePatient, allergies: e.target.value})}
                multiline
                rows={2}
                fullWidth
                size="small"
                placeholder="Enter medical notes or allergies..."
              />
            </Stack>
          ) : (
            <>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  fontWeight: 500,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
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
            </>
          )}
        </Paper>

        {/* Add Visit Form */}
  <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ee 100%)', maxWidth: 1200, mx: 'auto', width: { xs: '100%', sm: '98%' } }}>
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
  <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ee 100%)', maxWidth: 1200, mx: 'auto', width: { xs: '100%', sm: '98%' } }}>
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

        {/* Patient Notes */}
  <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ee 100%)', maxWidth: 1200, mx: 'auto', width: { xs: '100%', sm: '98%' } }}>
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              alignItems={{ xs: 'stretch', sm: 'center' }} 
              justifyContent="space-between"
            >
              <Typography 
                variant="h6"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                📝 Patient Notes
              </Typography>
              {!isEditingNotes ? (
                <Button 
                  size="small" 
                  startIcon={<Edit/>} 
                  onClick={() => setIsEditingNotes(true)}
                  sx={{ 
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' }
                  }}
                >
                  Edit Notes
                </Button>
              ) : (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button 
                    size="small" 
                    startIcon={<Save/>} 
                    onClick={saveNotes}
                    variant="contained"
                    sx={{ textTransform: 'none' }}
                  >
                    Save
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Cancel/>} 
                    onClick={cancelNotesEdit}
                    sx={{ textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                </Stack>
              )}
            </Stack>
          </Box>
          
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {isEditingNotes ? (
              <TextField
                multiline
                rows={8}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                variant="outlined"
                size="small"
                placeholder="Write your notes here... 

• Patient observations
• Treatment plans
• Follow-up reminders
• Special instructions
• Any other important information"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    lineHeight: 1.5
                  }
                }}
              />
            ) : (
              <Box>
                {notes ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: { xs: 2, sm: 3 }, 
                      backgroundColor: 'grey.50',
                      minHeight: 120
                    }}
                  >
                    <pre style={{ 
                      whiteSpace: "pre-wrap", 
                      fontFamily: 'system-ui, -apple-system, sans-serif', 
                      margin: 0,
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                      color: '#333'
                    }}>
                      {notes}
                    </pre>
                  </Paper>
                ) : (
                  <Box 
                    sx={{ 
                      p: { xs: 3, sm: 4 }, 
                      textAlign: 'center',
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      border: '1px dashed',
                      borderColor: 'grey.300'
                    }}
                  >
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontStyle: 'italic'
                      }}
                    >
                      No notes yet. Click "Edit Notes" to add notes for this patient.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Upload Prescription */}
  <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ee 100%)', maxWidth: 1200, mx: 'auto', width: { xs: '100%', sm: '98%' } }}>
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
            <Typography 
              variant="h6"
              sx={{
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}
            >
              📄 Upload Prescription
            </Typography>
          </Box>
          
          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            <Stack spacing={2}>
              <input
                accept="image/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                id="prescription-upload"
                multiple
                type="file"
                onChange={handlePrescriptionUpload}
              />
              <label htmlFor="prescription-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  sx={{ textTransform: 'none' }}
                >
                  Select Files
                </Button>
              </label>
              
              {selectedPrescriptions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Selected Files:
                  </Typography>
                  <Stack spacing={1}>
                    {selectedPrescriptions.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: 'grey.50'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                          {file.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removePrescription(index)}
                          sx={{ color: 'error.main' }}
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                  
                  <Button
                    variant="contained"
                    onClick={uploadPrescriptions}
                    disabled={isUploadingPrescription}
                    startIcon={isUploadingPrescription ? <CircularProgress size={16} /> : <CloudUpload />}
                    sx={{ mt: 2, textTransform: 'none' }}
                  >
                    {isUploadingPrescription ? 'Uploading...' : 'Upload Files'}
                  </Button>
                </Box>
              )}
            </Stack>
          </Box>
        </Paper>

        {/* Uploaded Prescriptions */}
        {prescriptions.length > 0 && (
          <Paper elevation={1} sx={{ mb: { xs: 2, sm: 3 } }}>
            <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
              <Typography 
                variant="h6"
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                📋 Uploaded Prescriptions
              </Typography>
            </Box>
            
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                {prescriptions.map((prescription) => (
                  <Box
                    key={prescription.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'grey.50'
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {prescription.fileName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uploaded: {new Date(prescription.uploadDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => downloadPrescription(prescription)}
                        startIcon={<Download />}
                        sx={{ textTransform: 'none' }}
                      >
                        Download
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => deletePrescription(prescription.id)}
                        sx={{ color: 'error.main' }}
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Paper>
        )}

        <br />

              {/* Audio Recorder Section */}
  <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ee 100%)', maxWidth: 1200, mx: 'auto', width: { xs: '100%', sm: '98%' } }}>
        <AudioRecorder />
      </Paper>

        {/* WhatsApp Rich Message */}
  <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #e3e6ee 100%)', maxWidth: 1200, mx: 'auto', width: { xs: '100%', sm: '98%' } }}>
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
              📱 WhatsApp Message
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Send/>} 
              onClick={sendRichWhatsApp}
              sx={{ 
                textTransform: 'none',
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              Send Message
            </Button>
          </Stack>

          {/* Image Upload Section */}
          {/* <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={1}>
              <Button
                variant="outlined"
                startIcon={<ImageIcon />}
                component="label"
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Add Images for WhatsApp
                <input
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              <Typography variant="caption" color="text.secondary">
                {selectedImages.length} image(s) ready to send
              </Typography>
            </Stack>
            
            {selectedImages.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mt: 2 }}>
                  📷 Images for WhatsApp:
                </Typography>
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                  gap: 1, 
                  mb: 1 
                }}>
                  {selectedImages.map((image, index) => (
                    <Box key={index} sx={{ position: 'relative', aspectRatio: '1', border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
                      <img 
                        src={URL.createObjectURL(image)} 
                        alt={image.name}
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }}
                      />
                      <IconButton 
                        size="small" 
                        onClick={() => removeImage(index)}
                        sx={{ 
                          position: 'absolute', 
                          top: 2, 
                          right: 2, 
                          background: 'rgba(255,255,255,0.8)',
                          '&:hover': { background: 'rgba(255,255,255,0.9)' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          background: 'rgba(0,0,0,0.7)', 
                          color: 'white', 
                          p: 0.5, 
                          fontSize: '0.7rem',
                          textAlign: 'center'
                        }}
                      >
                        {image.name.length > 12 ? image.name.substring(0, 12) + '...' : image.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {selectedImages.map((image, index) => (
                    <Chip
                      key={index}
                      label={image.name}
                      onDelete={() => removeImage(index)}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box> */}

          {/* Rich Text Editor */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Message Content
            </Typography>
            <Box sx={{ 
              '& .ql-editor': { 
                minHeight: '200px',
                fontSize: '14px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1.6'
              },
              '& .ql-toolbar': {
                borderTop: '1px solid #ccc',
                borderLeft: '1px solid #ccc',
                borderRight: '1px solid #ccc',
                borderRadius: '4px 4px 0 0'
              },
              '& .ql-container': {
                borderBottom: '1px solid #ccc',
                borderLeft: '1px solid #ccc',
                borderRight: '1px solid #ccc',
                borderRadius: '0 0 4px 4px'
              }
            }}>
              <ReactQuill
                value={richTextMessage}
                onChange={setRichTextMessage}
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['link', 'image'],
                    ['clean']
                  ]
                }}
                formats={[
                  'header', 'bold', 'italic', 'underline', 'strike',
                  'color', 'background', 'list', 'bullet', 'align', 'link', 'image'
                ]}
                placeholder="Type your message here... Use the toolbar to format text and add images!"
              />
            </Box>
          </Box>

          {/* Preview Section */}
          <Box>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              WhatsApp Preview (How it will appear)
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                backgroundColor: '#e7f3e7',
                maxHeight: 200,
                overflow: 'auto',
                border: '1px solid #4caf50'
              }}
            >
              <Box sx={{ 
                backgroundColor: 'white',
                borderRadius: 2,
                p: 2,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '0.875rem',
                    lineHeight: 1.4,
                    color: '#000'
                  }}
                >
                  {htmlToPlainText(richTextMessage)}
                </Typography>
              </Box>
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 *Bold text*, _italic text_, ~strikethrough~, and bullet points will be formatted in WhatsApp
            </Typography>
          </Box>

          {selectedImages.length > 0 && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 1, border: '1px solid #2196f3' }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                📱 How to send images via WhatsApp:
              </Typography>
              <Typography variant="caption" color="primary.dark" sx={{ display: 'block', lineHeight: 1.4 }}>
                1. Click "Send Message" → WhatsApp opens with your text<br/>
                2. In WhatsApp, click the 📎 attachment button<br/>
                3. Select "Camera" or "Gallery/Photos"<br/>
                4. Choose your {selectedImages.length} image(s)<br/>
                5. Send! (Text + Images together)
              </Typography>
            </Box>
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
