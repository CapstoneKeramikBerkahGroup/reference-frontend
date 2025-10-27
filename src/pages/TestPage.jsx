import React, { useState } from 'react';
import { Container, Box, Paper, Typography, Button, Alert } from '@mui/material';

const TestPage = () => {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testHealth = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
      setError(null);
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  const testRegister = async () => {
    try {
      const timestamp = Date.now();
      const userData = {
        user: {
          email: `test${timestamp}@test.com`,
          nama: 'Test User',
          password: 'password123',
          role: 'mahasiswa'
        },
        nim: `NIM${timestamp}`, // Unique NIM based on timestamp
        program_studi: 'Teknik Informatika',
        angkatan: 2024
      };
      
      const response = await fetch('http://localhost:8000/api/auth/register/mahasiswa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult(JSON.stringify(data, null, 2));
        setError(null);
      } else {
        setError(data.detail || 'Registration failed');
        setResult(null);
      }
    } catch (err) {
      setError(err.message);
      setResult(null);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            🧪 API Test Page
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button variant="contained" onClick={testHealth}>
              Test Health
            </Button>
            <Button variant="contained" color="secondary" onClick={testRegister}>
              Test Register
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              <strong>Error:</strong> {error}
            </Alert>
          )}

          {result && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setResult(null)}>
              <Typography variant="caption" component="div">Response:</Typography>
              <pre style={{ overflow: 'auto', fontSize: '12px', margin: '8px 0 0 0' }}>{result}</pre>
            </Alert>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              📋 System Info:
            </Typography>
            <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
              <Typography variant="body2" component="div">
                • Backend URL: http://localhost:8000
              </Typography>
              <Typography variant="body2" component="div">
                • Frontend URL: {window.location.href}
              </Typography>
              <Typography variant="body2" component="div">
                • Token: {localStorage.getItem('token') ? '✅ Present' : '❌ Not found'}
              </Typography>
              <Typography variant="body2" component="div">
                • Browser: {navigator.userAgent.split(' ').pop()}
              </Typography>
            </Paper>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default TestPage;
