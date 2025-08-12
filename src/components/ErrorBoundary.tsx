import React from 'react';
import { Box, Typography, Paper, Button, Stack } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <Paper sx={{ p: 4, maxWidth: 600, width: '100%' }}>
            <Stack spacing={3}>
              <Typography variant="h4" color="error" textAlign="center">
                🚨 Application Error
              </Typography>
              
              <Typography variant="body1" textAlign="center">
                Something went wrong while loading the application.
              </Typography>

              {this.state.error && (
                <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h6" gutterBottom>
                    Error Details:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {this.state.error.message}
                  </Typography>
                  {this.state.error.stack && (
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem', mt: 1, whiteSpace: 'pre-wrap' }}>
                      {this.state.error.stack.substring(0, 500)}...
                    </Typography>
                  )}
                </Paper>
              )}

              <Stack direction="row" spacing={2} justifyContent="center">
                <Button 
                  variant="contained" 
                  onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => window.location.href = '/debug'}
                >
                  Debug Info
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
