import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { integrationAPI } from '../services/api';
import { Save, RefreshCw, Link as LinkIcon, ArrowLeft, Book, CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [references, setReferences] = useState([]);
  const [analyzingIds, setAnalyzingIds] = useState([]); // Track sedang dianalisis
  
  const [formData, setFormData] = useState({
    user_id_zotero: '',
    api_key_zotero: ''
  });

  useEffect(() => {
    fetchReferences();
  }, []);

  const fetchReferences = async () => {
    try {
      const res = await integrationAPI.getReferences();
      setReferences(res.data);
    } catch (err) {
      console.error("Failed to fetch references:", err);
    }
  };

  const handleConnect = async () => {
    if (!formData.user_id_zotero || !formData.api_key_zotero) {
      toast.warning("Please fill in both User ID and API Key");
      return;
    }

    setLoading(true);
    try {
      await integrationAPI.connectZotero(formData);
      toast.success("Zotero connected successfully!");
    } catch (err) {
      toast.error("Failed to connect. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await integrationAPI.syncZotero();
      toast.success(`Synced ${res.data.synced_count} items from Zotero!`);
      await fetchReferences(); 
    } catch (err) {
      toast.error("Sync failed. Make sure you are connected.");
    } finally {
      setSyncing(false);
    }
  };

  const handleAnalyzeZotero = async (referenceId) => {
    setAnalyzingIds(prev => [...prev, referenceId]);
    
    try {
      // Panggil API untuk analisis
      const res = await integrationAPI.analyzeZoteroReference(referenceId);
      toast.success("Analysis complete!");
      
      // Refresh data referensi untuk update local_document_id
      await fetchReferences();
      
      // Navigasi ke halaman document yang baru dibuat
      if (res.data.document_id) {
        navigate(`/documents/${res.data.document_id}`);
      }
    } catch (err) {
      toast.error("Analysis failed. Please try again.");
      console.error("Analyze error:", err);
    } finally {
      setAnalyzingIds(prev => prev.filter(id => id !== referenceId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          {references.length > 0 && (
            <div className="text-sm text-green-600 flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-200">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {references.length} References Available
            </div>
          )}
        </div>

        {/* Card Koneksi */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-6 h-6 text-blue-600" />
              <CardTitle>Zotero Integration</CardTitle>
            </div>
            <CardDescription>
              Connect your Zotero library to access your references automatically in Nalar-Net.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zotero User ID</Label>
                <Input 
                  placeholder="e.g., 19083362" 
                  value={formData.user_id_zotero}
                  onChange={(e) => setFormData({...formData, user_id_zotero: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Zotero API Key (Private Key)</Label>
                <Input 
                  type="password" 
                  placeholder="e.g., zoDt..." 
                  value={formData.api_key_zotero}
                  onChange={(e) => setFormData({...formData, api_key_zotero: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleConnect} disabled={loading} className="flex-1">
                {loading ? "Connecting..." : <><Save className="w-4 h-4 mr-2"/> Save Connection</>}
              </Button>
              
              <Button onClick={handleSync} disabled={syncing} variant="outline" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                {syncing ? "Syncing..." : <><RefreshCw className="w-4 h-4 mr-2"/> Sync Library Now</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Daftar Referensi dengan CardFooter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Book className="w-5 h-5" />
              Synced Library Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {references.length === 0 ? (
              <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed">
                No references synced yet. Click "Sync Library Now" above.
              </div>
            ) : (
              <div className="space-y-4">
                {references.slice(0, 10).map((ref) => (
                  <Card key={ref.id} className="shadow-sm">
                    <CardContent className="pt-6">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-base leading-tight">{ref.title}</h3>
                        <p className="text-sm text-muted-foreground">{ref.authors}</p>
                        <p className="text-xs text-gray-500">{ref.year}</p>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 gap-2 pb-4">
                      {/* Tombol Analyze / View Detail */}
                      {ref.local_document_id ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 text-xs gap-2 border-green-200 text-green-700 hover:bg-green-50"
                          onClick={() => navigate(`/documents/${ref.local_document_id}`)}
                        >
                          <Eye className="w-3 h-3" /> View Analysis
                        </Button>
                      ) : (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1 text-xs gap-2 bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleAnalyzeZotero(ref.id)}
                          disabled={analyzingIds.includes(ref.id)}
                        >
                          {analyzingIds.includes(ref.id) ? (
                            <span className="animate-spin">⌛</span> 
                          ) : (
                            <Sparkles className="w-3 h-3" /> 
                          )}
                          Analyze AI
                        </Button>
                      )}
                      {/* Tombol Link Asli */}
                      {ref.url && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => window.open(ref.url, '_blank')}
                          title="Open in Zotero Web"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
                {references.length > 10 && (
                  <div className="p-4 text-center text-xs text-gray-500 border-t bg-gray-50 rounded-lg">
                    ... and {references.length - 10} more items.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;