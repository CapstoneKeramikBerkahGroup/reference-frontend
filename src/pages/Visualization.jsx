import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- Components ---
import Navbar from '@/components/Navbar';

// --- 1. Import Komponen Shadcn UI ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider'; // Pastikan Anda punya komponen Slider di ui/slider.jsx
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// --- 2. Import Icons & API ---
import { 
  ArrowLeft, RefreshCw, ZoomIn, ZoomOut, 
  Maximize, Share2, Info, AlertCircle, FileText 
} from 'lucide-react';
import CytoscapeComponent from 'react-cytoscapejs';
import { visualizationAPI, documentsAPI } from '../services/api';

const Visualization = () => {
  const navigate = useNavigate();
  const cyRef = useRef(null);
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [threshold, setThreshold] = useState([0.3]); // Slider shadcn biasanya return array
  const [selectedNode, setSelectedNode] = useState(null);
  const [documents, setDocuments] = useState([]);

  // --- Data Loading Logic ---
  useEffect(() => {
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
      // Ambil value threshold (jika array ambil index 0)
      const thVal = Array.isArray(threshold) ? threshold[0] : threshold;
      
      const response = await visualizationAPI.getSimilarityGraph({
        min_similarity: thVal
      });
      
      const data = response.data;
      
      if (!data || !data.nodes) throw new Error('Invalid response from server');
      
      const nodes = data.nodes.map(node => ({
        data: { id: node.id.toString(), label: node.label, ...node }
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
    } catch (err) {
      console.error('Visualization error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load visualization';
      setError(errorMsg + ' Ensure you have at least 2 processed documents.');
    } finally {
      setLoading(false);
    }
  };

  // --- Graph Config ---
  const cytoscapeStylesheet = [
    {
      selector: 'node',
      style: {
        'background-color': '#0ea5e9', // Sky-500 (Primary Blue)
        'label': 'data(label)',
        'color': '#1e293b', // Slate-800
        'text-valign': 'bottom',
        'text-margin-y': 8,
        'font-size': '12px',
        'font-weight': '600',
        'width': 40,
        'height': 40,
        'text-wrap': 'wrap',
        'text-max-width': '120px',
        'border-width': 2,
        'border-color': '#ffffff',
        'overlay-padding': '6px',
        'z-index': 10
      }
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#0891b2', // Cyan-600
        'width': 50,
        'height': 50,
        'border-width': 4,
        'border-color': '#a5f3fc', // Cyan-200
        'shadow-blur': 10,
        'shadow-color': '#000'
      }
    },
    {
      selector: 'edge',
      style: {
        'width': (ele) => Math.max(1, ele.data('similarity') * 5),
        'line-color': '#cbd5e1', // Slate-300
        'target-arrow-color': '#cbd5e1',
        'target-arrow-shape': 'none',
        'curve-style': 'bezier',
        'opacity': 0.8
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#0891b2',
        'width': 4,
        'opacity': 1,
        'z-index': 9
      }
    }
  ];

  const layout = {
    name: 'cose',
    animate: true,
    animationDuration: 800,
    idealEdgeLength: 100,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    padding: 50,
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

  // --- Handlers ---
  const handleNodeClick = (event) => {
    const node = event.target;
    setSelectedNode(node.data());
  };

  const handleZoom = (factor) => {
    if (cyRef.current) {
      const zoom = cyRef.current.zoom();
      cyRef.current.zoom(zoom * factor);
    }
  };

  const handleCenter = () => {
    if (cyRef.current) cyRef.current.fit();
  };

  // --- Render UI ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Header */}
      <header className="border-b border-cyan-200 bg-white sticky top-16 z-40 h-16">
        <div className="container h-full mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-serif font-semibold text-gray-900">Grafik Pengetahuan</h1>
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => loadVisualization()} disabled={loading} className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 overflow-hidden flex flex-col lg:flex-row gap-6 h-[calc(100vh-128px)]">
        
        {/* Left Sidebar: Controls & Info */}
        <div className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto pb-6 h-full">
          
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Threshold Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                Ambang Batas Kesamaan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted-foreground">Longgar</span>
                <Badge variant="secondary" className="font-mono">
                  {((Array.isArray(threshold) ? threshold[0] : threshold) * 100).toFixed(0)}%
                </Badge>
                <span className="text-xs text-muted-foreground">Ketat</span>
              </div>
              <Slider
                defaultValue={[0.3]}
                max={1}
                step={0.05}
                value={Array.isArray(threshold) ? threshold : [threshold]}
                onValueChange={(val) => setThreshold(val)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-4">
                Sesuaikan untuk memfilter koneksi. Nilai yang lebih tinggi hanya menampilkan hubungan yang lebih kuat.
              </p>
            </CardContent>
          </Card>

          {/* Selected Node Info */}
          <Card className="flex-1 flex flex-col min-h-[200px]">
            <CardHeader className="pb-3 bg-accent/5">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Detail Node
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pt-4 overflow-y-auto">
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight mb-1">
                      {selectedNode.label}
                    </h3>
                    <Badge variant="outline" className="mt-1">ID: {selectedNode.id}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Button 
                      className="w-full justify-start" 
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/documents/${selectedNode.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" /> View Document
                    </Button>
                  </div>

                  {selectedNode.tags && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedNode.tags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                    <Share2 className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm">Klik pada node untuk melihat detail</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Mini Card */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{graphData.nodes.length}</p>
                <p className="text-xs text-muted-foreground">Makalah</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{graphData.edges.length}</p>
                <p className="text-xs text-muted-foreground">Tautan</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Area: Graph Canvas */}
        <Card className="flex-1 relative overflow-hidden border-border/50 shadow-sm bg-white/50">
          {/* Canvas */}
          <div className="absolute inset-0">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Rendering graph...</p>
                </div>
              </div>
            ) : (
              <CytoscapeComponent
                elements={[...graphData.nodes, ...graphData.edges]}
                style={{ width: '100%', height: '100%' }}
                stylesheet={cytoscapeStylesheet}
                layout={layout}
                cy={(cy) => {
                  cyRef.current = cy;
                  cy.on('tap', 'node', handleNodeClick);
                  cy.on('tap', (e) => {
                    if (e.target === cy) setSelectedNode(null);
                  });
                }}
              />
            )}
          </div>

          {/* Floating Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 shadow-lg bg-card rounded-lg p-1 border border-border/50">
            <Button variant="ghost" size="icon" onClick={() => handleZoom(1.2)} title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleZoom(0.8)} title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <div className="h-px w-full bg-border/50 my-1"></div>
            <Button variant="ghost" size="icon" onClick={handleCenter} title="Fit to Screen">
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </Card>

      </main>
    </div>
  );
};

export default Visualization;