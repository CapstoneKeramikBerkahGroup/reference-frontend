import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  const [stats, setStats] = useState(null);
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, mahasiswa

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [statsRes, mahasiswaRes, requestsRes] = await Promise.all([
        dosenAPI.getDashboardStats(),
        dosenAPI.getMahasiswaBimbingan(),
        api.get('/pembimbing/incoming-requests')
      ]);
      
      setStats(statsRes.data);
      setMahasiswaList(mahasiswaRes.data);
      
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
              <CardTitle className="text-sm font-medium">{t('dosenDashboard.totalMahasiswa')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_mahasiswa || 0}</div>
              <p className="text-xs text-muted-foreground">{t('dosenDashboard.underSupervision')}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dosenDashboard.totalDraftsTA')}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_drafts || 0}</div>
              <p className="text-xs text-muted-foreground">{t('dosenDashboard.draftSubmissions')}</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow border-green-300 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mahasiswa Layak</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-700" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats?.mahasiswa_approved || 0}</div>
              <p className="text-xs text-green-700">{stats?.drafts_approved || 0} draft tidak perlu revisi</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dosenDashboard.myComments')}</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_comments || 0}</div>
              <p className="text-xs text-muted-foreground">{t('dosenDashboard.draftReviewComments')}</p>
            </CardContent>
          </Card>

          <Card 
            className="border-border/50 hover:shadow-lg transition-all cursor-pointer border-red-200 bg-red-50/50 hover:bg-red-100/50"
            onClick={() => navigate('/dosen/request-bimbingan')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dosenDashboard.bimbinganRequests')}</CardTitle>
              <UserCheck className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('dosenDashboard.waitingForApproval')}
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
            {t('dosenDashboard.overview')}
          </Button>
          <Button
            variant={activeTab === 'mahasiswa' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('mahasiswa')}
            className="rounded-b-none"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('dosenDashboard.mahasiswaBimbingan')}
          </Button>
          <Button
            variant={activeTab === 'kelola' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('kelola')}
            className="rounded-b-none"
          >
            <Users className="w-4 h-4 mr-2" />
            {t('dosenDashboard.kelolaMahasiswa')}
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
                      {pendingRequests.length} {t('dosenDashboard.alertPending')}
                    </span>
                    <p className="text-sm text-red-700 mt-1">
                      {t('dosenDashboard.pendingRequests')}
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate('/dosen/request-bimbingan')}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    {t('dosenDashboard.viewRequest')}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Mahasiswa */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('dosenDashboard.recentMahasiswaActivity')}</CardTitle>
                  <CardDescription>{t('dosenDashboard.latestDraftSubmissions')}</CardDescription>
                </CardHeader>
                <CardContent>
                  {mahasiswaList.slice(0, 5).map((mhs) => (
                    <div key={mhs.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{mhs.nama}</p>
                        <p className="text-sm text-muted-foreground">{mhs.nim} • {mhs.program_studi}</p>
                      </div>
                      <div className="text-right flex gap-2">
                        <Badge variant={mhs.total_drafts > 0 ? 'default' : 'secondary'}>
                          {mhs.total_drafts || 0} {t('dosenDashboard.drafts')}
                        </Badge>
                        {mhs.drafts_reviewed > 0 && (
                          <Badge variant="outline" className="bg-green-50">
                            {mhs.drafts_reviewed} {t('dosenDashboard.reviewed')}
                          </Badge>
                        )}
                        {mhs.drafts_approved > 0 && (
                          <Badge className="bg-green-600">
                            ✓ {mhs.drafts_approved} Layak
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {mahasiswaList.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('dosenDashboard.noStudents')}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('dosenDashboard.quickStatistics')}</CardTitle>
                  <CardDescription>{t('dosenDashboard.overviewOfSupervision')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('dosenDashboard.totalMahasiswa')}</span>
                    </div>
                    <span className="font-bold">{stats?.total_mahasiswa || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('dosenDashboard.totalDraftsTA')}</span>
                    </div>
                    <span className="font-bold">{stats?.total_drafts || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Draft Layak</span>
                    </div>
                    <span className="font-bold text-green-600">{stats?.drafts_approved || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{t('dosenDashboard.myComments')}</span>
                    </div>
                    <span className="font-bold">{stats?.total_comments || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'mahasiswa' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('dosenDashboard.mahasiswaBimbinganList')}</CardTitle>
              <CardDescription>{t('dosenDashboard.listOfStudents')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('dosenDashboard.nim')}</TableHead>
                    <TableHead>{t('dosenDashboard.nama')}</TableHead>
                    <TableHead>{t('dosenDashboard.programStudi')}</TableHead>
                    <TableHead>{t('dosenDashboard.angkatan')}</TableHead>
                    <TableHead className="text-center">{t('dosenDashboard.totalDraftsTA')}</TableHead>
                    <TableHead className="text-center">{t('dosenDashboard.draftsReviewed')}</TableHead>
                    <TableHead className="text-center">Draft Layak</TableHead>
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
                        <Badge variant="secondary">{mhs.total_drafts || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={mhs.drafts_reviewed > 0 ? 'default' : 'outline'} className={mhs.drafts_reviewed > 0 ? 'bg-green-600' : ''}>
                          {mhs.drafts_reviewed || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={mhs.drafts_approved > 0 ? 'default' : 'outline'} className={mhs.drafts_approved > 0 ? 'bg-emerald-600' : ''}>
                          {mhs.drafts_approved > 0 ? `✓ ${mhs.drafts_approved}` : '0'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {mahasiswaList.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('dosenDashboard.noStudents')}</p>
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
                  <CardTitle>{t('dosenDashboard.kelolaMahasiswaBimbingan')}</CardTitle>
                  <CardDescription>{t('dosenDashboard.manageStudents')}</CardDescription>
                </div>
                <Button onClick={() => navigate('/dosen/mahasiswa-management')}>
                  <Users className="w-4 h-4 mr-2" />
                  {t('dosenDashboard.goToManagementPage')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('dosenDashboard.clickAbove')}
                  </AlertDescription>
                </Alert>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('dosenDashboard.totalMahasiswa')}</p>
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
                          <p className="text-sm text-muted-foreground">{t('dosenDashboard.activeDrafters')}</p>
                          <p className="text-2xl font-bold">{mahasiswaList.filter(m => m.total_drafts > 0).length}</p>
                        </div>
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{t('dosenDashboard.totalDraftsTA')}</p>
                          <p className="text-2xl font-bold">{stats?.total_drafts || 0}</p>
                        </div>
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Students List */}
                <div className="pt-4">
                  <h3 className="text-lg font-semibold mb-4">{t('dosenDashboard.recentStudents')}</h3>
                  <div className="space-y-2">
                    {mahasiswaList.slice(0, 10).map((mhs) => (
                      <div key={mhs.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{mhs.nama}</p>
                          <p className="text-sm text-muted-foreground">{mhs.nim} • {mhs.program_studi}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{mhs.total_drafts || 0} {t('dosenDashboard.drafts')}</Badge>
                          {mhs.drafts_reviewed > 0 && (
                            <Badge variant="outline" className="bg-green-50">{mhs.drafts_reviewed} {t('dosenDashboard.reviewed')}</Badge>
                          )}
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
