import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.state = { hasError: true, error, errorInfo };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {this.state.error?.message || 'An unexpected error occurred'}
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
              >
                Go to Home
              </Button>
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <Box sx={{ mt: 2, textAlign: 'left' }}>
                  <Typography variant="caption" component="pre" sx={{ fontSize: 10, overflow: 'auto' }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
