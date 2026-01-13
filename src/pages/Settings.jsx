import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { integrationAPI } from '../services/api';
import { Save, RefreshCw, Link2, ArrowLeft, Book, CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [references, setReferences] = useState([]);
  const [analyzingIds, setAnalyzingIds] = useState([]); // Track sedang dianalisis
  
  // STATE YANG BENAR DAN KONSISTEN
  const [formData, setFormData] = useState({
    user_id_zotero: '', 
    api_key_zotero: '' 
  });

  useEffect(() => {
    fetchReferences();
    fetchZoteroConfig();
  }, []);

  const fetchZoteroConfig = async () => {
    try {
      const res = await integrationAPI.getConfig();
      console.log("Zotero Config Response:", res.data);
      // Cek apakah data valid (id > 0)
      if (res.data && res.data.id > 0) {
        setFormData({
          user_id_zotero: res.data.zotero_user_id || '', 
          api_key_zotero: '' // Don't load API key for security
        });
      }
    } catch (err) {
      console.log("Belum ada konfigurasi Zotero atau error:", err);
    }
  };

  const fetchReferences = async () => {
    try {
      const res = await integrationAPI.getReferences();
      setReferences(res.data.data || res.data); // Handle structure variation
    } catch (err) {
      console.error("Failed to fetch references:", err);
    }
  };

  const handleConnect = async () => {
    // Validasi menggunakan key yang benar
    console.log("🔍 Form Data:", formData);
    console.log("🔍 User ID:", formData.user_id_zotero);
    console.log("🔍 API Key:", formData.api_key_zotero ? "***PROVIDED***" : "EMPTY");
    
    if (!formData.user_id_zotero || !formData.api_key_zotero) {
        toast.warning("Mohon isi User ID dan API Key Zotero.");
        return;
    }

    setLoading(true);
    
    const payload = {
      user_id_zotero: formData.user_id_zotero.toString().trim(),
      api_key_zotero: formData.api_key_zotero.trim(),
      library_type: "user"
    };
    
    console.log("📤 Sending payload:", { ...payload, api_key_zotero: "***HIDDEN***" });
    
    try {
      // Panggil API
      const res = await integrationAPI.connectZotero(payload);
      
      console.log("✅ Zotero Connect Response:", res.data);
      toast.success(res.data.message || "Berhasil terhubung ke Zotero!");
      
      // Auto-sync setelah connect
      handleSync();

    } catch (err) {
      console.error("❌ Zotero Connect Error Full:", err);
      console.error("❌ Error Response:", err.response);
      console.error("❌ Error Data:", err.response?.data);
      console.error("❌ Error Status:", err.response?.status);
      console.error("❌ Error Message:", err.message);
      console.error("❌ Network Error:", err.code);
      
      let errorMsg = "Gagal menyimpan konfigurasi";
      
      if (err.response?.data?.detail) {
        errorMsg = typeof err.response.data.detail === 'string' 
          ? err.response.data.detail 
          : JSON.stringify(err.response.data.detail);
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      toast.error(errorMsg);
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
      toast.error("Sync failed. Pastikan koneksi internet stabil.");
    } finally {
      setSyncing(false);
    }
  };

  const handleAnalyzeZotero = async (referenceId) => {
    setAnalyzingIds(prev => [...prev, referenceId]);
    
    try {
      const res = await integrationAPI.analyzeZoteroReference(referenceId);
      toast.success("Analysis complete!");
      await fetchReferences();
      
      if (res.data.document_id) {
        navigate(`/documents/${res.data.document_id}`);
      }
    } catch (err) {
      toast.error("Analysis failed. Please try again.");
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
              <Link2 className="w-6 h-6 text-blue-600" />
              <CardTitle>Zotero Integration</CardTitle>
            </div>
            <CardDescription>
              Connect your Zotero library to access your references automatically in Nalar-Net.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Zotero User ID</Label>
              <Input 
                placeholder="e.g., 1234567" 
                // PERBAIKAN: Binding ke state yang benar
                value={formData.user_id_zotero} 
                onChange={(e) => setFormData({...formData, user_id_zotero: e.target.value})}
              />
            </div>
              
            <div className="space-y-2">
              <Label>Zotero API Key</Label>
              <Input 
                type="password" 
                placeholder="e.g., zoKey..." 
                // PERBAIKAN: Binding ke state yang benar
                value={formData.api_key_zotero}
                onChange={(e) => setFormData({...formData, api_key_zotero: e.target.value})}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={(e) => {
                  e.preventDefault();
                  console.log("🔘 Button clicked!");
                  handleConnect();
                }} 
                disabled={loading} 
                className="flex-1"
                type="button"
              >
                {loading ? "Connecting..." : <><Save className="w-4 h-4 mr-2"/> Save Connection</>}
              </Button>
              
              <Button onClick={handleSync} disabled={syncing} variant="outline" className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                {syncing ? "Syncing..." : <><RefreshCw className="w-4 h-4 mr-2"/> Sync Library Now</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Daftar Referensi */}
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
                      {ref.url && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => window.open(ref.url, '_blank')}
                          title="Open in Zotero Web"
                        >
                          <Link2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;