import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Box, Paper, TextField, Button, Typography,
  Alert, Tab, Tabs, Link, MenuItem
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState('mahasiswa');
  const [formData, setFormData] = useState({
    // User data
    email: '',
    nama: '',
    password: '',
    confirmPassword: '',
    // Mahasiswa specific
    nim: '',
    program_studi: '',
    angkatan: new Date().getFullYear(),
    // Dosen specific
    nip: '',
    jabatan: '',
    bidang_keahlian: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        user: {
          email: formData.email,
          nama: formData.nama,
          password: formData.password,
          role: role, // Add role field
        },
      };

      if (role === 'mahasiswa') {
        userData.nim = formData.nim;
        userData.program_studi = formData.program_studi;
        userData.angkatan = parseInt(formData.angkatan);
      } else {
        userData.nip = formData.nip;
        userData.jabatan = formData.jabatan;
        userData.bidang_keahlian = formData.bidang_keahlian;
      }

      await register(userData, role);
      
      // Show success message
      setSuccess('Registration successful! Redirecting to login...');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (event, newValue) => {
    setRole(newValue);
    setError('');
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" align="center" gutterBottom>
            Register
          </Typography>

          <Tabs value={role} onChange={handleRoleChange} centered sx={{ mb: 3 }}>
            <Tab label="Mahasiswa" value="mahasiswa" />
            <Tab label="Dosen" value="dosen" />
          </Tabs>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Common Fields */}
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              margin="normal"
              required
            />

            {/* Mahasiswa Specific Fields */}
            {role === 'mahasiswa' && (
              <>
                <TextField
                  fullWidth
                  label="NIM"
                  name="nim"
                  value={formData.nim}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Program Studi"
                  name="program_studi"
                  value={formData.program_studi}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Angkatan"
                  name="angkatan"
                  type="number"
                  value={formData.angkatan}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </>
            )}

            {/* Dosen Specific Fields */}
            {role === 'dosen' && (
              <>
                <TextField
                  fullWidth
                  label="NIP"
                  name="nip"
                  value={formData.nip}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Jabatan"
                  name="jabatan"
                  value={formData.jabatan}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Bidang Keahlian"
                  name="bidang_keahlian"
                  value={formData.bidang_keahlian}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              </>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Login here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
