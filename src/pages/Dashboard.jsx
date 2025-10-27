import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Button, Container, Grid,
  Card, CardContent, CardActions, IconButton, Chip, TextField,
  InputAdornment, Fab, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Alert, Menu, MenuItem, Avatar
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Upload as UploadIcon,
  Download as DownloadIcon, Delete as DeleteIcon, Visibility as VisibilityIcon,
  AccountCircle, Logout, Description, FolderOpen, TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { documentsAPI, tagsAPI } from '../services/api';
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]); // Changed to array
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [searchQuery, documents]);

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
      setFilteredDocuments(response.data);
    } catch (err) {
      setError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    if (!searchQuery) {
      setFilteredDocuments(documents);
      return;
    }
    const filtered = documents.filter(doc =>
      doc.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.nama_file.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredDocuments(filtered);
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setUploading(true);
    setError('');
    const progressMap = {};

    try {
      // Upload files sequentially (or can be parallel with Promise.all)
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('judul', uploadTitle || file.name.replace(/\.[^/.]+$/, ''));

        // Track individual file progress
        await documentsAPI.upload(formData, (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progressMap[file.name] = progress;
          setUploadProgress({ ...progressMap });
        });
      }
      
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadTitle('');
      setUploadProgress({});
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await documentsAPI.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.nama_file);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Download failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await documentsAPI.delete(id);
      loadDocuments();
    } catch (err) {
      setError('Delete failed');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <Description sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Reference Management System
          </Typography>
          <Button
            color="inherit"
            startIcon={<TrendingUp />}
            onClick={() => navigate('/visualization')}
            sx={{ mr: 2 }}
          >
            Visualization
          </Button>
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <AccountCircle />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user?.nama}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Documents
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and analyze your research papers
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Documents Grid */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        ) : filteredDocuments.length === 0 ? (
          <Box textAlign="center" py={8}>
            <FolderOpen sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {!searchQuery && 'Upload your first research paper to get started'}
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredDocuments.map((doc) => (
              <Grid item xs={12} sm={6} md={4} key={doc.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom noWrap>
                      {doc.judul}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {doc.nama_file}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                      {format(new Date(doc.tanggal_unggah), 'MMM dd, yyyy')} • {doc.ukuran_kb} KB
                    </Typography>
                    <Chip
                      label={doc.status_analisis || 'pending'}
                      size="small"
                      color={getStatusColor(doc.status_analisis)}
                      sx={{ mb: 1 }}
                    />
                    {doc.tags && doc.tags.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        {doc.tags.slice(0, 3).map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.nama_tag}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      title="View Details"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDownload(doc)}
                      title="Download"
                    >
                      <DownloadIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(doc.id)}
                      title="Delete"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Upload FAB */}
        <Fab
          color="primary"
          aria-label="upload"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setUploadDialogOpen(true)}
        >
          <AddIcon />
        </Fab>

        <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Documents</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title Prefix (optional)"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              margin="normal"
              disabled={uploading}
              helperText="Leave empty to use filename as title"
            />
            <Button
              fullWidth
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ mt: 2 }}
              disabled={uploading}
            >
              {uploadFiles.length > 0 ? `${uploadFiles.length} file(s) selected` : 'Select Files (PDF/DOCX)'}
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.docx,.doc"
                onChange={(e) => setUploadFiles(Array.from(e.target.files))}
              />
            </Button>
            
            {/* Show selected files */}
            {uploadFiles.length > 0 && !uploading && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Files:
                </Typography>
                {uploadFiles.map((file, index) => (
                  <Chip
                    key={index}
                    label={file.name}
                    size="small"
                    onDelete={() => {
                      const newFiles = uploadFiles.filter((_, i) => i !== index);
                      setUploadFiles(newFiles);
                    }}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            )}
            
            {/* Upload progress */}
            {uploading && Object.keys(uploadProgress).length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Upload Progress:
                </Typography>
                {Object.entries(uploadProgress).map(([filename, progress]) => (
                  <Box key={filename} sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {filename}: {progress}%
                    </Typography>
                    <CircularProgress variant="determinate" value={progress} size={20} sx={{ ml: 1 }} />
                  </Box>
                ))}
              </Box>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} variant="contained" disabled={uploading || uploadFiles.length === 0}>
              Upload {uploadFiles.length > 0 && `(${uploadFiles.length})`}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard;
