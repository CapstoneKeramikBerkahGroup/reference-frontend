import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Button, Container, Paper,
  Grid, Chip, CircularProgress, Alert, IconButton, Divider,
  Card, CardContent, List, ListItem, ListItemText, Dialog,
  DialogTitle, DialogContent, TextField, Autocomplete, LinearProgress
} from '@mui/material';
import {
  ArrowBack, Download, Delete, Psychology, Summarize,
  LocalOffer, Add
} from '@mui/icons-material';
import { documentsAPI, nlpAPI, tagsAPI } from '../services/api';
import { format } from 'date-fns';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    loadDocument();
    loadTags();
  }, [id]);

  const loadDocument = async () => {
    try {
      const response = await documentsAPI.getById(id);
      setDocument(response.data);
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getAll();
      setAllTags(response.data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleProcessDocument = async () => {
    setProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Starting...');
    setError('');
    
    let pollInterval = null;
    
    try {
      // Start background processing
      await nlpAPI.processDocument(id);
      
      // Poll for status with progress every 1 second for more responsive UI
      pollInterval = setInterval(async () => {
        try {
          const statusResponse = await nlpAPI.getStatus(id);
          const status = statusResponse.data.status;
          const progress = statusResponse.data.progress || 0;
          const step = statusResponse.data.current_step || '';
          
          console.log('📊 Progress update:', { status, progress, step }); // Debug log
          
          setProcessingProgress(progress);
          setProcessingStep(step);
          
          if (status === 'completed' || status === 'selesai') {
            if (pollInterval) clearInterval(pollInterval);
            await loadDocument(); // Reload document data
            setProcessing(false);
            setProcessingProgress(100);
            setProcessingStep('Completed!');
          } else if (status === 'failed') {
            if (pollInterval) clearInterval(pollInterval);
            setError(statusResponse.data.error || 'Processing failed');
            setProcessing(false);
            setProcessingProgress(0);
          }
        } catch (err) {
          console.error('Failed to get status:', err);
          // Don't stop polling on individual errors
        }
      }, 1000); // Poll every 1 second for more responsive updates
      
    } catch (err) {
      if (pollInterval) clearInterval(pollInterval);
      setError('Failed to start processing: ' + (err.response?.data?.detail || err.message));
      setProcessing(false);
      setProcessingProgress(0);
    }
  };

  const handleExtractKeywords = async () => {
    setProcessing(true);
    try {
      await nlpAPI.extractKeywords({ dokumen_id: parseInt(id), top_k: 15 });
      loadDocument();
    } catch (err) {
      setError('Keyword extraction failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleSummarize = async () => {
    setProcessing(true);
    try {
      await nlpAPI.summarize({
        dokumen_id: parseInt(id),
        max_length: 200,
        min_length: 50
      });
      loadDocument();
    } catch (err) {
      setError('Summarization failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddTags = async () => {
    try {
      for (const tag of selectedTags) {
        if (!document.tags?.find(t => t.id === tag.id)) {
          await tagsAPI.addToDocument(id, tag.id);
        }
      }
      loadDocument();
      setTagDialogOpen(false);
      setSelectedTags([]);
    } catch (err) {
      setError('Failed to add tags');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await tagsAPI.removeFromDocument(id, tagId);
      loadDocument();
    } catch (err) {
      setError('Failed to remove tag');
    }
  };

  const handleDownload = async () => {
    try {
      const response = await documentsAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.nama_file);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Download failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentsAPI.delete(id);
      navigate('/dashboard');
    } catch (err) {
      setError('Delete failed');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!document) {
    return (
      <Container>
        <Alert severity="error">Document not found</Alert>
      </Container>
    );
  }

  return (
    <Box>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            {document.judul}
          </Typography>
          <Button color="inherit" startIcon={<Download />} onClick={handleDownload}>
            Download
          </Button>
          <Button color="inherit" startIcon={<Delete />} onClick={handleDelete}>
            Delete
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Processing Progress Bar */}
        {processing && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              {processingStep || 'Processing...'}
            </Typography>
            <LinearProgress variant="determinate" value={processingProgress} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {processingProgress}% complete
            </Typography>
          </Paper>
        )}

        <Grid container spacing={3}>
          {/* Left Column - Document Info */}
          <Grid item xs={12} md={8}>
            {/* Basic Info */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {document.judul}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {document.nama_file}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Uploaded: {format(new Date(document.tanggal_unggah), 'MMMM dd, yyyy HH:mm')}
                {' • '}{document.ukuran_kb} KB {' • '} Format: {document.format.toUpperCase()}
              </Typography>
              <Chip
                label={document.status_analisis || 'pending'}
                color={
                  document.status_analisis === 'completed' ? 'success' :
                  document.status_analisis === 'processing' ? 'warning' :
                  document.status_analisis === 'failed' ? 'error' : 'default'
                }
              />
            </Paper>

            {/* Summary */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <Summarize sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Summary
                </Typography>
                <Button
                  size="small"
                  onClick={handleSummarize}
                  disabled={processing}
                  startIcon={processing ? <CircularProgress size={16} /> : <Summarize />}
                >
                  {document.ringkasan ? 'Regenerate' : 'Generate'}
                </Button>
              </Box>
              {document.ringkasan ? (
                <Typography variant="body1">{document.ringkasan}</Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No summary available. Click "Generate" to create one.
                </Typography>
              )}
            </Paper>

            {/* Keywords */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <Psychology sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Keywords
                </Typography>
                <Button
                  size="small"
                  onClick={handleExtractKeywords}
                  disabled={processing}
                  startIcon={processing ? <CircularProgress size={16} /> : <Psychology />}
                >
                  Extract Keywords
                </Button>
              </Box>
              {document.kata_kunci && document.kata_kunci.length > 0 ? (
                <Box>
                  {document.kata_kunci.map((keyword) => (
                    <Chip
                      key={keyword.id}
                      label={keyword.kata}
                      sx={{ mr: 1, mb: 1 }}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No keywords extracted yet.
                </Typography>
              )}
            </Paper>

            {/* References */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                References
              </Typography>
              {document.referensi && document.referensi.length > 0 ? (
                <List dense>
                  {document.referensi.map((ref, index) => (
                    <ListItem key={ref.id}>
                      <ListItemText
                        primary={`[${index + 1}] ${ref.teks_referensi}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No references found.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Right Column - Actions & Tags */}
          <Grid item xs={12} md={4}>
            {/* Actions */}
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Actions
              </Typography>
              <Button
                fullWidth
                variant="contained"
                startIcon={processing ? <CircularProgress size={16} /> : <Psychology />}
                onClick={handleProcessDocument}
                disabled={processing || document.status_analisis === 'processing'}
                sx={{ mb: 1 }}
              >
                {document.status_analisis === 'processing' ? 'Processing...' : 'Process Document'}
              </Button>
              <Typography variant="caption" color="text.secondary" display="block">
                Extract keywords, generate summary, and find references automatically
              </Typography>
            </Paper>

            {/* Tags */}
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <LocalOffer sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Tags
                </Typography>
                <IconButton size="small" onClick={() => setTagDialogOpen(true)}>
                  <Add />
                </IconButton>
              </Box>
              {document.tags && document.tags.length > 0 ? (
                <Box>
                  {document.tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.nama_tag}
                      onDelete={() => handleRemoveTag(tag.id)}
                      sx={{ mr: 1, mb: 1 }}
                      color="secondary"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No tags yet. Add some!
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Add Tags Dialog */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Tags</DialogTitle>
        <DialogContent>
          <Autocomplete
            multiple
            options={allTags}
            getOptionLabel={(option) => option.nama_tag}
            value={selectedTags}
            onChange={(e, newValue) => setSelectedTags(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Select Tags" margin="normal" />
            )}
          />
        </DialogContent>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTags}>Add Tags</Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default DocumentDetail;
