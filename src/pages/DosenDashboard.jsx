import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import api, { dosenAPI } from '@/services/api';
import Navbar from '@/components/Navbar';

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
  TrendingUp,
  UserCheck,
  Clock
} from 'lucide-react';

const DosenDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [pendingReferensi, setPendingReferensi] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
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
      const [statsRes, mahasiswaRes, referensiRes, requestsRes] = await Promise.all([
        dosenAPI.getDashboardStats(),
        dosenAPI.getMahasiswaBimbingan(),
        dosenAPI.getPendingReferensi(),
        api.get('/pembimbing/incoming-requests')
      ]);
      
      setStats(statsRes.data);
      setMahasiswaList(mahasiswaRes.data);
      setPendingReferensi(referensiRes.data);
      
      // Filter only pending requests and match specialization
      const userSpec = user?.bidang_keahlian;
      const matchingPendingRequests = requestsRes.data.filter(
        req => req.status === 'pending' && req.mahasiswa_bidang_keahlian === userSpec
      );
      setPendingRequests(matchingPendingRequests);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
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

          <Card 
            className="border-border/50 hover:shadow-lg transition-all cursor-pointer border-red-200 bg-red-50/50 hover:bg-red-100/50"
            onClick={() => navigate('/dosen/request-bimbingan')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bimbingan Requests</CardTitle>
              <UserCheck className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Waiting for approval
              </p>
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
            variant={activeTab === 'kelola' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('kelola')}
            className="rounded-b-none"
          >
            <Users className="w-4 h-4 mr-2" />
            Kelola Mahasiswa
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Action Required - Pending Bimbingan Requests */}
            {pendingRequests.length > 0 && (
              <Alert className="bg-red-50 border-red-200">
                <UserCheck className="h-4 w-4 text-red-600" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-red-900">
                      {pendingRequests.length} mahasiswa menunggu approval bimbingan
                    </span>
                    <p className="text-sm text-red-700 mt-1">
                      Terdapat request bimbingan dari mahasiswa dengan peminatan yang sama dengan Anda
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/dosen/request-bimbingan')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Lihat Request
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Required - Papers with Pending References */}
            {(() => {
              // Group pending referensi by document
              const groupedByDoc = pendingReferensi.reduce((acc, ref) => {
                const docKey = ref.dokumen_id;
                if (!acc[docKey]) {
                  acc[docKey] = {
                    dokumen_id: ref.dokumen_id,
                    dokumen_judul: ref.dokumen_judul,
                    mahasiswa_nama: ref.mahasiswa_nama,
                    pending_count: 0
                  };
                }
                acc[docKey].pending_count += 1;
                return acc;
              }, {});
              
              const pendingDocuments = Object.values(groupedByDoc);
              
              return pendingDocuments.length > 0 ? (
                <Card className="border-2 border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Action Required</CardTitle>
                        <CardDescription className="text-base">
                          {pendingDocuments.length} document{pendingDocuments.length > 1 ? 's' : ''} waiting for your review
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingDocuments.slice(0, 5).map((doc) => (
                        <div
                          key={doc.dokumen_id}
                          className="flex items-center justify-between p-4 bg-background rounded-lg border hover:border-primary transition-all cursor-pointer group"
                          onClick={() => handleViewDokumen(doc.dokumen_id)}
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <div className="flex items-start gap-3 mb-1">
                              <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                              <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1" title={doc.dokumen_judul}>
                                {doc.dokumen_judul}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground ml-8">
                              <span className="truncate max-w-[200px]">{doc.mahasiswa_nama}</span>
                              <span>•</span>
                              <Badge variant="secondary" className="font-semibold flex-shrink-0">
                                {doc.pending_count} pending
                              </Badge>
                            </div>
                          </div>
                          <Button variant="outline" className="ml-4" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/dosen/dokumen/${doc.dokumen_id}`, {
                              state: { openReferences: true }
                            });
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      ))}
                      {pendingDocuments.length > 5 && (
                        <p className="text-sm text-muted-foreground text-center pt-2">
                          And {pendingDocuments.length - 5} more document{pendingDocuments.length - 5 > 1 ? 's' : ''}...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : null;
            })()}

            {/* Stats Grid */}
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
                  {mahasiswaList.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No students yet
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Statistics</CardTitle>
                  <CardDescription>Overview of your supervision</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total Mahasiswa</span>
                    </div>
                    <span className="font-bold">{stats?.total_mahasiswa || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Total Documents</span>
                    </div>
                    <span className="font-bold">{stats?.total_dokumen || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Completed Analysis</span>
                    </div>
                    <span className="font-bold text-green-600">{stats?.dokumen_completed || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">My Comments</span>
                    </div>
                    <span className="font-bold">{stats?.total_catatan || 0}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Pending Validation</span>
                    </div>
                    <span className="font-bold text-orange-600">{stats?.referensi_pending || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
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

        {activeTab === 'kelola' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Kelola Mahasiswa Bimbingan</CardTitle>
                  <CardDescription>Manage students under your supervision</CardDescription>
                </div>
                <Button onClick={() => navigate('/dosen/mahasiswa-management')}>
                  <Users className="w-4 h-4 mr-2" />
                  Go to Management Page
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Click the button above to access the full management page where you can add, edit, or remove students.
                  </AlertDescription>
                </Alert>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Mahasiswa</p>
                          <p className="text-2xl font-bold">{stats?.total_mahasiswa || 0}</p>
                        </div>
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Active Students</p>
                          <p className="text-2xl font-bold">{mahasiswaList.filter(m => m.total_dokumen > 0).length}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Documents</p>
                          <p className="text-2xl font-bold">{stats?.total_dokumen || 0}</p>
                        </div>
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Students List */}
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-4">Recent Students</h3>
                  <div className="space-y-2">
                    {mahasiswaList.slice(0, 10).map((mhs) => (
                      <div key={mhs.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{mhs.nama}</p>
                          <p className="text-sm text-muted-foreground">{mhs.nim} • {mhs.program_studi}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DosenDashboard;
