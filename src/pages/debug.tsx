import React from "react";
import { Box, Container, Typography, Paper, Stack, Chip } from "@mui/material";

const DebugPage: React.FC = () => {
  const envVars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h3" gutterBottom>
          🔍 Debug Information
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Firebase Environment Variables
          </Typography>
          <Stack spacing={2}>
            {Object.entries(envVars).map(([key, value]) => (
              <Stack key={key} direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ minWidth: 300, fontFamily: 'monospace' }}>
                  {key}:
                </Typography>
                {value ? (
                  <Chip 
                    label={`✓ Set (${value.substring(0, 10)}...)`} 
                    color="success" 
                    size="small" 
                  />
                ) : (
                  <Chip 
                    label="✗ Missing" 
                    color="error" 
                    size="small" 
                  />
                )}
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Environment Info
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Node Environment:</strong> {process.env.NODE_ENV}
            </Typography>
            <Typography variant="body2">
              <strong>Vercel:</strong> {process.env.VERCEL ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2">
              <strong>Client Side:</strong> {typeof window !== 'undefined' ? 'Yes' : 'No'}
            </Typography>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Troubleshooting Steps
          </Typography>
          <Stack spacing={2}>
            <Typography variant="body2">
              1. Check that all environment variables are set in Vercel Dashboard → Settings → Environment Variables
            </Typography>
            <Typography variant="body2">
              2. Make sure variables are set for Production, Preview, and Development environments
            </Typography>
            <Typography variant="body2">
              3. Redeploy the project after adding environment variables
            </Typography>
            <Typography variant="body2">
              4. Check Firebase console to ensure project is active
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default DebugPage;