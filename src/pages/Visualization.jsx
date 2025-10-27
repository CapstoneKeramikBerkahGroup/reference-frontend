import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, Button, Container, Paper,
  IconButton, Slider, TextField, MenuItem, CircularProgress,
  Alert, Card, CardContent, Grid, Chip
} from '@mui/material';
import { ArrowBack, Refresh, ZoomIn, ZoomOut, CenterFocusStrong } from '@mui/icons-material';
import CytoscapeComponent from 'react-cytoscapejs';
import { visualizationAPI, documentsAPI } from '../services/api';

const Visualization = () => {
  const navigate = useNavigate();
  const cyRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [threshold, setThreshold] = useState(0.3);  // Start with lower threshold
  const [selectedNode, setSelectedNode] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    // Debounce threshold changes to avoid too many requests
    const timeoutId = setTimeout(() => {
      loadVisualization();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [threshold]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadVisualization = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await visualizationAPI.getSimilarityGraph({
        min_similarity: threshold
      });
      
      const data = response.data;
      
      // Check if we have valid data
      if (!data || !data.nodes) {
        throw new Error('Invalid response from server');
      }
      
      // Convert to Cytoscape format
      const nodes = data.nodes.map(node => ({
        data: {
          id: node.id.toString(),
          label: node.label,
          ...node
        }
      }));

      const edges = (data.edges || []).map((edge, index) => {
        const similarity = edge.similarity || edge.weight || 0;
        return {
          data: {
            id: `edge-${index}`,
            source: edge.source.toString(),
            target: edge.target.toString(),
            similarity: similarity,
            label: similarity.toFixed(2)
          }
        };
      });

      setGraphData({ nodes, edges });
      
      // Log for debugging
      console.log(`📊 Graph loaded: ${nodes.length} nodes, ${edges.length} edges (threshold: ${threshold})`);
      
    } catch (err) {
      console.error('Visualization error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load visualization';
      setError(errorMsg + ' Please make sure you have at least 2 processed documents.');
    } finally {
      setLoading(false);
    }
  };

  const cytoscapeStylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': '#3f51b5',
        'label': 'data(label)',
        'color': '#ffffff',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '14px',
        'font-weight': 'bold',
        'width': 60,
        'height': 60,
        'text-wrap': 'wrap',
        'text-max-width': '100px',
        'text-outline-color': '#000000',
        'text-outline-width': 2,
        'text-outline-opacity': 0.8
      }
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#f50057',
        'width': 80,
        'height': 80,
        'border-width': 3,
        'border-color': '#fff'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': (ele) => ele.data('similarity') * 10,
        'line-color': '#9e9e9e',
        'target-arrow-color': '#9e9e9e',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'label': 'data(label)',
        'font-size': '10px',
        'text-background-color': '#fff',
        'text-background-opacity': 0.8,
        'text-background-padding': '2px'
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#f50057',
        'target-arrow-color': '#f50057'
      }
    }
  ];

  const layout = {
    name: 'cose',
    animate: true,
    animationDuration: 1000,
    idealEdgeLength: 150,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    padding: 30,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0
  };

  const handleNodeClick = (event) => {
    const node = event.target;
    const nodeData = node.data();
    setSelectedNode(nodeData);
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleCenter = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  const handleRefresh = () => {
    loadVisualization();
  };

  return (
    <Box>
      {/* AppBar */}
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/dashboard')}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Document Similarity Visualization
          </Typography>
          <IconButton color="inherit" onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Similarity Threshold Control - Full Width Horizontal */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
            📊 Similarity Filter
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Slider - Takes most space */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Slider
                value={threshold}
                onChange={(e, val) => setThreshold(val)}
                min={0}
                max={1}
                step={0.05}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 0.1, label: '10%' },
                  { value: 0.2, label: '20%' },
                  { value: 0.3, label: '30%' },
                  { value: 0.4, label: '40%' },
                  { value: 0.5, label: '50%' },
                  { value: 0.6, label: '60%' },
                  { value: 0.7, label: '70%' },
                  { value: 0.8, label: '80%' },
                  { value: 0.9, label: '90%' },
                  { value: 1.0, label: '100%' }
                ]}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                sx={{ 
                  height: 8,
                  '& .MuiSlider-thumb': {
                    height: 24,
                    width: 24,
                    '&:hover, &.Mui-focusVisible': {
                      boxShadow: '0px 0px 0px 8px rgba(63, 81, 181, 0.16)',
                    },
                  },
                  '& .MuiSlider-valueLabel': {
                    fontSize: 14,
                    fontWeight: 'bold',
                    backgroundColor: 'primary.main',
                  },
                  '& .MuiSlider-track': {
                    height: 8,
                  },
                  '& .MuiSlider-rail': {
                    height: 8,
                    opacity: 0.3,
                  },
                  '& .MuiSlider-mark': {
                    height: 12,
                    width: 2,
                    backgroundColor: 'currentColor',
                  },
                  '& .MuiSlider-markLabel': {
                    fontSize: 12,
                    fontWeight: 500,
                  },
                }}
              />
            </Box>

            {/* Status Chip - Fixed width */}
            <Box sx={{ flexShrink: 0, textAlign: 'center', minWidth: 200 }}>
              <Chip 
                label={`${(threshold * 100).toFixed(0)}% Match`}
                color="primary" 
                sx={{ 
                  fontSize: 16, 
                  fontWeight: 'bold',
                  height: 36,
                  px: 2,
                  mb: 0.5,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {threshold < 0.2 && '💡 Very loose'}
                {threshold >= 0.2 && threshold < 0.4 && '📊 Loose'}
                {threshold >= 0.4 && threshold < 0.6 && '✅ Moderate'}
                {threshold >= 0.6 && threshold < 0.8 && '🎯 Strict'}
                {threshold >= 0.8 && '⭐ Very strict'}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Graph and Statistics - Landscape Layout */}
        <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 280px)' }}>
          {/* Main Graph - Takes 80% width */}
          <Paper sx={{ flexGrow: 1, flexBasis: '80%', p: 2, position: 'relative', overflow: 'hidden' }}>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress size={60} />
              </Box>
            ) : graphData.nodes.length === 0 ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100%">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Data Available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload documents and process them to see the similarity network
                </Typography>
                </Box>
              ) : (
                <>
                  <CytoscapeComponent
                    elements={[...graphData.nodes, ...graphData.edges]}
                    style={{ width: '100%', height: 'calc(100% - 20px)' }}
                    stylesheet={cytoscapeStylesheet}
                    layout={layout}
                    cy={(cy) => {
                      cyRef.current = cy;
                      cy.on('tap', 'node', handleNodeClick);
                    }}
                  />
                  
                  {/* Zoom Controls */}
                  <Box sx={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <IconButton
                      onClick={handleZoomIn}
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <ZoomIn />
                    </IconButton>
                    <IconButton
                      onClick={handleZoomOut}
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <ZoomOut />
                    </IconButton>
                    <IconButton
                      onClick={handleCenter}
                      sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <CenterFocusStrong />
                    </IconButton>
                  </Box>
                </>
              )}
          </Paper>

          {/* Statistics Panel - Takes 20% width */}
          <Paper sx={{ flexShrink: 0, flexBasis: '20%', p: 2, overflowY: 'auto' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📊 Graph Statistics
            </Typography>
              
              <Card variant="outlined" sx={{ mb: 2, bgcolor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {graphData.nodes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Documents
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ mb: 2, bgcolor: graphData.edges.length > 0 ? 'success.50' : 'warning.50' }}>
                <CardContent>
                  <Typography variant="h3" color={graphData.edges.length > 0 ? 'success.main' : 'warning.main'} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {graphData.edges.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Connections
                  </Typography>
                </CardContent>
              </Card>

              {graphData.edges.length === 0 && graphData.nodes.length >= 2 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="caption">
                    💡 No connections at {(threshold * 100).toFixed(0)}% threshold. 
                    Try lowering the slider to see more connections.
                  </Typography>
                </Alert>
              )}

              {graphData.nodes.length < 2 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="caption">
                    ⚠️ Upload and process at least 2 documents to see similarity analysis.
                  </Typography>
                </Alert>
              )}

              {selectedNode && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Selected Document
                  </Typography>
                  <Card variant="outlined" sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {selectedNode.label}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate(`/documents/${selectedNode.id}`)}
                        sx={{ mt: 1 }}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                All Documents
              </Typography>
              {documents.slice(0, 10).map((doc) => (
                <Card
                  key={doc.id}
                  variant="outlined"
                  sx={{
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body2" noWrap>
                      {doc.judul}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {doc.status_analisis || 'pending'}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Visualization;
