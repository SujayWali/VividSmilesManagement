import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Stack, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Grid,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Container,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  Save, 
  ArrowBack, 
  Delete,
  Healing,
  Warning,
  CheckCircle,
  Cancel,
  LocalHospital
} from '@mui/icons-material';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ToothCondition {
  id: string;
  type: 'filling' | 'crown' | 'extraction' | 'root_canal' | 'cavity' | 'implant' | 'bridge' | 'cleaning' | 'other';
  description: string;
  date: string;
  color: string;
}

interface ToothData {
  number: number;
  conditions: ToothCondition[];
  notes: string;
}

interface TeethChart {
  [key: number]: ToothData;
}

const TREATMENT_TYPES = {
  filling: { label: 'Filling', color: '#4CAF50', icon: '🔧' },
  crown: { label: 'Crown', color: '#FF9800', icon: '👑' },
  extraction: { label: 'Extraction', color: '#F44336', icon: '🦷' },
  root_canal: { label: 'Root Canal', color: '#9C27B0', icon: '🔬' },
  cavity: { label: 'Cavity', color: '#FF5722', icon: '⚠️' },
  implant: { label: 'Implant', color: '#2196F3', icon: '🔩' },
  bridge: { label: 'Bridge', color: '#607D8B', icon: '🌉' },
  cleaning: { label: 'Cleaning', color: '#8BC34A', icon: '✨' },
  other: { label: 'Other', color: '#795548', icon: '📝' }
};

// FDI tooth numbering system (permanent teeth)
const FDI_TEETH = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11], // Quadrant 1 (right to left, patient perspective)
  upperLeft: [21, 22, 23, 24, 25, 26, 27, 28],  // Quadrant 2 (left to right, patient perspective)
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41], // Quadrant 4 (right to left, patient perspective)
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38]   // Quadrant 3 (left to right, patient perspective)
};

export default function ToothChart() {
  const router = useRouter();
  const { id: patientId } = router.query;
  const [patient, setPatient] = useState<any>(null);
  const [teethData, setTeethData] = useState<TeethChart>({});
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCondition, setNewCondition] = useState({
    type: 'filling' as keyof typeof TREATMENT_TYPES,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [saving, setSaving] = useState(false);

  // Add state for modal messages and unsaved changes
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [modalType, setModalType] = useState<'success' | 'error' | 'unsaved' | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [initialTeethData, setInitialTeethData] = useState<TeethChart | null>(null);

  useEffect(() => {
    if (!patientId || typeof patientId !== 'string') return;

    const unsubscribe = onSnapshot(doc(db, "patients", patientId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPatient({ id: snap.id, ...data });
        setTeethData(data.teethChart || {});
      }
    });

    return () => unsubscribe();
  }, [patientId]);

  // Track initial data for unsaved changes
  useEffect(() => {
    if (patient) {
      setInitialTeethData(patient.teethChart || {});
    }
  }, [patient]);

  const initializeToothData = (toothNumber: number): ToothData => {
    return {
      number: toothNumber,
      conditions: [],
      notes: ''
    };
  };

  const getToothData = (toothNumber: number): ToothData => {
    return teethData[toothNumber] || initializeToothData(toothNumber);
  };

  const handleToothClick = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setDialogOpen(true);
  };

  const addCondition = () => {
    if (!selectedTooth || !newCondition.type) return;

    const conditionId = Date.now().toString();
    const condition: ToothCondition = {
      id: conditionId,
      type: newCondition.type,
      description: newCondition.description,
      date: newCondition.date,
      color: TREATMENT_TYPES[newCondition.type].color
    };

    const currentToothData = getToothData(selectedTooth);
    const updatedToothData = {
      ...currentToothData,
      conditions: [...currentToothData.conditions, condition]
    };

    setTeethData(prev => ({
      ...prev,
      [selectedTooth]: updatedToothData
    }));

    setNewCondition({
      type: 'filling',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const removeCondition = (toothNumber: number, conditionId: string) => {
    const currentToothData = getToothData(toothNumber);
    const updatedConditions = currentToothData.conditions.filter(c => c.id !== conditionId);
    
    setTeethData(prev => ({
      ...prev,
      [toothNumber]: {
        ...currentToothData,
        conditions: updatedConditions
      }
    }));
  };

  const updateToothNotes = (toothNumber: number, notes: string) => {
    const currentToothData = getToothData(toothNumber);
    setTeethData(prev => ({
      ...prev,
      [toothNumber]: {
        ...currentToothData,
        notes: notes
      }
    }));
  };

  // Helper to check for unsaved changes
  const hasUnsavedChanges = () => {
    return JSON.stringify(teethData) !== JSON.stringify(initialTeethData);
  };

  // Show modal instead of alert on save
  const saveTeethChart = async () => {
    if (!patientId || typeof patientId !== 'string') return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "patients", patientId), {
        teethChart: teethData,
        updatedAt: Date.now()
      });
      setModalMessage('Tooth chart saved successfully!');
      setModalType('success');
      setInitialTeethData(teethData); // update initial data after save
    } catch (error) {
      console.error('Error saving tooth chart:', error);
      setModalMessage('Failed to save tooth chart. Please try again.');
      setModalType('error');
    } finally {
      setSaving(false);
    }
  };

  // Intercept navigation away (router/back/close) if unsaved changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges()) {
        setShowUnsavedModal(true);
        // Prevent navigation
        router.events.emit('routeChangeError');
        throw 'Route change aborted due to unsaved changes.';
      }
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [teethData, initialTeethData]);

  const renderTooth = (toothNumber: number, position: 'top' | 'bottom' = 'top') => {
    const toothData = getToothData(toothNumber);
    const hasConditions = toothData.conditions.length > 0;
    const hasNotes = toothData.notes.trim().length > 0;
    
    // Get the primary condition color (most recent)
    const primaryColor = hasConditions 
      ? toothData.conditions[toothData.conditions.length - 1].color 
      : '#f5f5f5';

    return (
      <Box
        key={toothNumber}
        onClick={() => handleToothClick(toothNumber)}
        sx={{
          width: { xs: 35, sm: 45 },
          height: { xs: 35, sm: 45 },
          backgroundColor: primaryColor,
          border: hasConditions ? '2px solid #333' : '1px solid #ccc',
          borderRadius: position === 'top' ? '8px 8px 4px 4px' : '4px 4px 8px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10
          }
        }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 'bold', 
            fontSize: { xs: '0.7rem', sm: '0.8rem' },
            color: hasConditions ? 'white' : '#333'
          }}
        >
          {toothNumber}
        </Typography>
        
        {/* Condition indicators */}
        {hasConditions && (
          <Box
            sx={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 12,
              height: 12,
              backgroundColor: '#ff4444',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography sx={{ fontSize: '0.6rem', color: 'white', fontWeight: 'bold' }}>
              {toothData.conditions.length}
            </Typography>
          </Box>
        )}

        {/* Notes indicator */}
        {hasNotes && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: 8,
              height: 8,
              backgroundColor: '#2196f3',
              borderRadius: '50%'
            }}
          />
        )}
      </Box>
    );
  };

  const renderQuadrant = (teeth: number[], label: string, reverse: boolean = false) => {
    const toothElements = teeth.map(toothNumber => renderTooth(toothNumber));
    
    return (
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {label}
        </Typography>
        <Stack 
          direction="row" 
          spacing={1} 
          justifyContent="center"
          sx={{ flexDirection: reverse ? 'row-reverse' : 'row' }}
        >
          {toothElements}
        </Stack>
      </Box>
    );
  };

  if (!patient) {
    return (
      <Container sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Loading patient data...</Typography>
      </Container>
    );
  }

  const selectedToothData = selectedTooth ? getToothData(selectedTooth) : null;

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
            🦷 Tooth Chart - {patient.name}
          </Typography>
          <Button 
            color="inherit" 
            onClick={() => router.push(`/patients/${patientId}`)}
            startIcon={<ArrowBack />}
            sx={{ 
              textTransform: 'none',
              fontSize: { xs: '0.8rem', sm: '1rem' }
            }}
          >
            Back to Patient
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            alignItems={{ xs: 'center', sm: 'flex-start' }} 
            justifyContent="space-between"
          >
            <Box textAlign={{ xs: 'center', sm: 'left' }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: '#1976d2', 
                  mb: 1,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                Interactive Tooth Chart
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
              >
                Click on any tooth to add treatments, conditions, or notes
              </Typography>
            </Box>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<Save />} 
              onClick={saveTeethChart}
              disabled={saving}
              sx={{ 
                textTransform: 'none',
                fontSize: { xs: '0.9rem', sm: '1rem' },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {saving ? 'Saving...' : 'Save Chart'}
            </Button>
          </Stack>
        </Paper>

        {/* Legend */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            🎨 Treatment Legend
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(TREATMENT_TYPES).map(([key, treatment]) => (
              <Grid item xs={6} sm={4} md={3} key={key}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: treatment.color,
                      borderRadius: 1,
                      border: '1px solid #ccc'
                    }}
                  />
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {treatment.icon} {treatment.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            💡 Red dot = Number of treatments | Blue dot = Has notes
          </Typography>
        </Paper>

        {/* Tooth Chart */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 4 }, mb: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h5" 
            textAlign="center" 
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            🦷 FDI Tooth Chart (Permanent Teeth)
          </Typography>
          {/* Upper Jaw */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" textAlign="center" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Upper Jaw
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center">
              {renderQuadrant(FDI_TEETH.upperRight, 'Quadrant 1 (Upper Right)')}
              {renderQuadrant(FDI_TEETH.upperLeft, 'Quadrant 2 (Upper Left)')}
            </Stack>
          </Box>
          {/* Lower Jaw */}
          <Box>
            <Typography variant="h6" textAlign="center" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Lower Jaw
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center">
              {renderQuadrant(FDI_TEETH.lowerRight, 'Quadrant 4 (Lower Right)')}
              {renderQuadrant(FDI_TEETH.lowerLeft, 'Quadrant 3 (Lower Left)')}
            </Stack>
          </Box>
        </Paper>

        {/* Treatment Summary */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            📋 Treatment Summary
          </Typography>
          
          {Object.keys(teethData).length === 0 ? (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
              No treatments recorded yet. Click on teeth to add treatments.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {Object.values(teethData)
                .filter(tooth => tooth.conditions.length > 0 || tooth.notes.trim().length > 0)
                .map(tooth => (
                  <Grid item xs={12} md={6} key={tooth.number}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="h6" sx={{ mb: 1 }}>
                          Tooth #{tooth.number}
                        </Typography>
                        
                        {tooth.conditions.map((condition: ToothCondition) => (
                          <Chip
                            key={condition.id}
                            label={`${TREATMENT_TYPES[condition.type].icon} ${condition.description || TREATMENT_TYPES[condition.type].label}`}
                            size="small"
                            sx={{ 
                              mr: 1, 
                              mb: 1,
                              backgroundColor: condition.color,
                              color: 'white',
                              fontSize: '0.75rem'
                            }}
                          />
                        ))}
                        
                        {tooth.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Notes: {tooth.notes}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>
          )}
        </Paper>

        {/* Add chart image below the tooth chart */}
        {/* <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <img src="/assets/images/chart.png" alt="Tooth Chart Reference" style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
        </Box> */}
      </Container>

      {/* Tooth Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ 
          background: '#1976d2', 
          color: 'white', 
          textAlign: 'center',
          fontSize: { xs: '1.1rem', sm: '1.25rem' }
        }}>
          🦷 Tooth #{selectedTooth} - Treatment Details
        </DialogTitle>
        
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {selectedToothData && (
            <Stack spacing={3}>
              {/* Existing Conditions */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Current Treatments
                </Typography>
                {selectedToothData.conditions.length === 0 ? (
                  <Typography color="text.secondary">No treatments recorded</Typography>
                ) : (
                  <List dense>
                    {selectedToothData.conditions.map(condition => (
                      <ListItem 
                        key={condition.id}
                        sx={{ 
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          mb: 1,
                          backgroundColor: `${condition.color}15`
                        }}
                      >
                        <ListItemIcon>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              backgroundColor: condition.color,
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Typography sx={{ fontSize: '0.7rem' }}>
                              {TREATMENT_TYPES[condition.type].icon}
                            </Typography>
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={`${TREATMENT_TYPES[condition.type].label}${condition.description ? `: ${condition.description}` : ''}`}
                          secondary={`Date: ${condition.date}`}
                        />
                        <Button
                          size="small"
                          color="error"
                          onClick={() => removeCondition(selectedTooth!, condition.id)}
                          startIcon={<Delete />}
                          sx={{ textTransform: 'none' }}
                        >
                          Remove
                        </Button>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>

              <Divider />

              {/* Add New Treatment */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Add New Treatment
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Treatment Type</InputLabel>
                    <Select
                      value={newCondition.type}
                      onChange={(e) => setNewCondition(prev => ({ ...prev, type: e.target.value as keyof typeof TREATMENT_TYPES }))}
                      label="Treatment Type"
                    >
                      {Object.entries(TREATMENT_TYPES).map(([key, treatment]) => (
                        <MenuItem key={key} value={key}>
                          {treatment.icon} {treatment.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Description (Optional)"
                    value={newCondition.description}
                    onChange={(e) => setNewCondition(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Composite filling on occlusal surface"
                    fullWidth
                  />

                  <TextField
                    label="Date"
                    type="date"
                    value={newCondition.date}
                    onChange={(e) => setNewCondition(prev => ({ ...prev, date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />

                  <Button
                    variant="contained"
                    onClick={addCondition}
                    startIcon={<LocalHospital />}
                    sx={{ textTransform: 'none' }}
                  >
                    Add Treatment
                  </Button>
                </Stack>
              </Box>

              <Divider />

              {/* Notes */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Notes
                </Typography>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  value={selectedToothData.notes}
                  onChange={(e) => updateToothNotes(selectedTooth!, e.target.value)}
                  placeholder="Add any additional notes about this tooth..."
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal for save/unsaved messages */}
      <Dialog open={!!modalMessage || showUnsavedModal} onClose={() => { setModalMessage(null); setModalType(null); setShowUnsavedModal(false); }}>
        <DialogTitle>
          {modalType === 'success' && 'Success'}
          {modalType === 'error' && 'Error'}
          {showUnsavedModal && 'Unsaved Changes'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {modalMessage}
            {showUnsavedModal && 'Recent changes have not been saved. Kindly save your changes before leaving.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          {showUnsavedModal ? (
            <>
              <Button onClick={() => setShowUnsavedModal(false)} variant="contained">Cancel</Button>
            </>
          ) : (
            <Button onClick={() => { setModalMessage(null); setModalType(null); }} variant="contained">OK</Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
