import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dosenAPI } from '@/services/api';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  BookOpen,
  Users,
  FileText,
  CheckCircle2,
  MessageSquare,
  AlertCircle,
  LogOut,
  Eye,
  TrendingUp
} from 'lucide-react';

const DosenDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [pendingReferensi, setPendingReferensi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, mahasiswa, referensi

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [statsRes, mahasiswaRes, referensiRes] = await Promise.all([
        dosenAPI.getDashboardStats(),
        dosenAPI.getMahasiswaBimbingan(),
        dosenAPI.getPendingReferensi()
      ]);
      
      setStats(statsRes.data);
      setMahasiswaList(mahasiswaRes.data);
      setPendingReferensi(referensiRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMahasiswaDokumen = (mahasiswaId, mahasiswaNama) => {
    navigate(`/dosen/mahasiswa/${mahasiswaId}/dokumen`, { 
      state: { mahasiswaNama } 
    });
  };

  const handleViewDokumen = (dokumenId) => {
    navigate(`/dosen/dokumen/${dokumenId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-background">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur border-b border-border/50 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-serif font-bold text-foreground">Refero</h1>
                  <p className="text-xs text-muted-foreground">Lecturer Dashboard</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{user?.nama}</p>
                <p className="text-xs text-muted-foreground">Dosen</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-10 w-10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mahasiswa</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_mahasiswa || 0}</div>
              <p className="text-xs text-muted-foreground">Under supervision</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dokumen</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_dokumen || 0}</div>
              <p className="text-xs text-muted-foreground">Documents uploaded</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.dokumen_completed || 0}</div>
              <p className="text-xs text-muted-foreground">Analysis done</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_catatan || 0}</div>
              <p className="text-xs text-muted-foreground">Comments given</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow border-orange-200 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.referensi_pending || 0}</div>
              <p className="text-xs text-muted-foreground">References to validate</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            className="rounded-b-none"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'mahasiswa' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('mahasiswa')}
            className="rounded-b-none"
          >
            <Users className="w-4 h-4 mr-2" />
            Mahasiswa Bimbingan
          </Button>
          <Button
            variant={activeTab === 'referensi' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('referensi')}
            className="rounded-b-none"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Pending Referensi ({stats?.referensi_pending || 0})
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Mahasiswa */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Mahasiswa Activity</CardTitle>
                <CardDescription>Latest document uploads from your students</CardDescription>
              </CardHeader>
              <CardContent>
                {mahasiswaList.slice(0, 5).map((mhs) => (
                  <div key={mhs.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{mhs.nama}</p>
                      <p className="text-sm text-muted-foreground">{mhs.nim} • {mhs.program_studi}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={mhs.total_dokumen > 0 ? 'default' : 'secondary'}>
                        {mhs.total_dokumen} docs
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Pending Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Action Required</CardTitle>
                <CardDescription>References waiting for your validation</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingReferensi.slice(0, 5).map((ref) => (
                  <div key={ref.id} className="py-3 border-b last:border-b-0">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-sm">{ref.mahasiswa_nama}</p>
                      <Badge variant="outline" className="text-xs">{ref.tahun}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {ref.teks_referensi}
                    </p>
                  </div>
                ))}
                {pendingReferensi.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No pending referensi
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'mahasiswa' && (
          <Card>
            <CardHeader>
              <CardTitle>Mahasiswa Bimbingan</CardTitle>
              <CardDescription>List of students under your supervision</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NIM</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Program Studi</TableHead>
                    <TableHead>Angkatan</TableHead>
                    <TableHead className="text-center">Dokumen</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mahasiswaList.map((mhs) => (
                    <TableRow key={mhs.id}>
                      <TableCell className="font-mono">{mhs.nim}</TableCell>
                      <TableCell className="font-medium">{mhs.nama}</TableCell>
                      <TableCell>{mhs.program_studi}</TableCell>
                      <TableCell>{mhs.angkatan}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{mhs.total_dokumen}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={mhs.dokumen_completed > 0 ? 'default' : 'outline'}>
                          {mhs.dokumen_completed}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewMahasiswaDokumen(mhs.id, mhs.nama)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Docs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {mahasiswaList.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No mahasiswa bimbingan yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'referensi' && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Referensi Validation</CardTitle>
              <CardDescription>References that need your approval</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mahasiswa</TableHead>
                    <TableHead>Dokumen</TableHead>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Penulis</TableHead>
                    <TableHead>Tahun</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingReferensi.map((ref) => (
                    <TableRow key={ref.id}>
                      <TableCell className="font-medium">{ref.mahasiswa_nama}</TableCell>
                      <TableCell className="max-w-xs truncate">{ref.dokumen_judul}</TableCell>
                      <TableCell className="max-w-md truncate text-sm">
                        {ref.teks_referensi}
                      </TableCell>
                      <TableCell>{ref.penulis || '-'}</TableCell>
                      <TableCell>{ref.tahun || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDokumen(ref.dokumen_id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {pendingReferensi.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">All referensi are validated!</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DosenDashboard;
