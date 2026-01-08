import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LogOut, User, FileText, BarChart3, Users, Home, UserCheck, 
  Languages, Menu, X, GraduationCap, BrainCircuit 
} from 'lucide-react';
import api from '@/services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [dosenPembimbing, setDosenPembimbing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'mahasiswa') {
      fetchDosenPembimbing();
    }
  }, [user]);

  const fetchDosenPembimbing = async () => {
    try {
      setLoading(true);
      const requestsRes = await api.get('/pembimbing/my-requests');
      const accepted = requestsRes.data.find(r => r.status === 'accepted');
      if (accepted) {
        const dosenRes = await api.get('/dosen/available-dosen');
        const dosen = dosenRes.data.find(d => d.id === accepted.dosen_id);
        setDosenPembimbing(dosen);
      }
    } catch (err) {
      console.error('Error fetching dosen pembimbing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // --- MENU ITEMS ---
  const studentNavItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: Home },
    { path: '/idea-generator', label: 'Idea Synthesizer', icon: BrainCircuit }, // Fitur Baru
    { path: '/documents', label: t('nav.documents'), icon: FileText },
    { path: '/visualization', label: t('nav.visualization'), icon: BarChart3 },
    { path: '/draft', label: t('nav.drafting'), icon: FileText },
  ];

  const lecturerNavItems = [
    { path: '/dosen/dashboard', label: t('nav.dashboard'), icon: Home },
    { path: '/dosen/request-bimbingan', label: t('nav.requestBimbingan'), icon: UserCheck },
    { path: '/dosen/mahasiswa', label: t('nav.students'), icon: Users },
    { path: '/dosen/draft-review', label: 'Review Draft', icon: FileText },
  ];

  const navItems = user?.role === 'dosen' ? lecturerNavItems : studentNavItems;

  return (
    <>
      {/* Font Import via CDN */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap');
      `}</style>

      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Left Section - Logo & Brand */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-blue-600 hover:bg-blue-50"
              >
                <Menu className="h-6 w-6" />
              </Button>

              {/* Logo & Brand Identity */}
              <Link to="/dashboard" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <img
                    src="/images/logo sistem informasi.png"
                    alt="Sistem Informasi"
                    className="relative h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-base sm:text-lg font-bold text-blue-600 leading-tight tracking-tight" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Telkom University
                  </span>
                  <span className="text-xs sm:text-sm text-blue-500 leading-tight font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    S1 Sistem Informasi
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center ml-8 space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${active
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                        }
                      `}
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Dosen Pembimbing Badge (Mahasiswa Only) */}
              {user?.role === 'mahasiswa' && (
                <>
                  {dosenPembimbing ? (
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/mahasiswa/dosen-pembimbing')}
                      className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 rounded-xl px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <GraduationCap className="h-4 w-4 text-blue-600" />
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] font-normal text-blue-500">Pembimbing</span>
                        <span className="text-sm font-semibold text-blue-700">{dosenPembimbing.nama}</span>
                      </div>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => navigate('/mahasiswa/dosen-selection')}
                      className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold rounded-xl px-4 py-2 shadow-lg shadow-amber-500/30 hover:shadow-xl transition-all duration-200"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <UserCheck className="h-4 w-4" />
                      <span className="text-sm">Pilih Pembimbing</span>
                    </Button>
                  )}
                </>
              )}

              {/* Language Switcher */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="relative text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                title={language === 'en' ? 'Switch to Indonesian' : 'Ganti ke Bahasa Inggris'}
              >
                <Languages className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 text-[9px] font-bold bg-blue-500 text-white rounded-full px-1.5 py-0.5 shadow-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                  {language.toUpperCase()}
                </span>
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-blue-50 transition-all duration-200">
                    <Avatar className="h-10 w-10 border-2 border-blue-200 shadow-md">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {getInitials(user?.nama)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-xl shadow-xl border-blue-100">
                  <div className="flex flex-col space-y-2 p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-50 rounded-t-xl">
                    <p className="text-base font-bold text-blue-900" style={{ fontFamily: 'Inter, sans-serif' }}>{user?.nama}</p>
                    <p className="text-sm text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>{user?.email}</p>
                    <Badge className="w-fit mt-1 bg-blue-500 text-white hover:bg-blue-600 shadow-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {user?.role === 'dosen' ? 'Dosen Pembimbing' : 'Mahasiswa'}
                    </Badge>
                  </div>
                  <DropdownMenuSeparator />

                  {/* Dosen Pembimbing Info untuk Mobile */}
                  {user?.role === 'mahasiswa' && (
                    <>
                      <div className="p-2 md:hidden">
                        {dosenPembimbing ? (
                          <DropdownMenuItem onClick={() => navigate('/mahasiswa/dosen-pembimbing')} className="rounded-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <GraduationCap className="mr-2 h-4 w-4 text-blue-600" />
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">Dosen Pembimbing:</span>
                              <span className="text-sm font-semibold text-blue-700">{dosenPembimbing.nama}</span>
                            </div>
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => navigate('/mahasiswa/dosen-selection')} className="text-amber-600 rounded-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            <UserCheck className="mr-2 h-4 w-4" />
                            <span>Pilih Dosen Pembimbing</span>
                          </DropdownMenuItem>
                        )}
                      </div>
                      <DropdownMenuSeparator className="md:hidden" />
                    </>
                  )}

                  <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <User className="mr-2 h-4 w-4 text-blue-600" />
                    <span>{t('nav.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 rounded-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('nav.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <div className="fixed top-0 left-0 h-full w-80 bg-white z-50 shadow-2xl lg:hidden transform transition-transform duration-300 ease-out">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <img
                    src="/images/logo sistem informasi.png"
                    alt="Sistem Informasi"
                    className="h-10 w-auto object-contain"
                  />
                  <div className="flex flex-col">
                    <span className="text-blue-600 font-bold text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>Telkom University</span>
                    <span className="text-blue-500 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>S1 Sistem Informasi</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-blue-600 hover:bg-blue-100 rounded-xl"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation Items */}
              <div className="flex flex-col space-y-2 p-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${active
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }
                      `}
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Dosen Pembimbing Section for Mobile */}
              {user?.role === 'mahasiswa' && (
                <div className="px-4 mt-4">
                  <div className="border-t border-blue-100 pt-4">
                    {dosenPembimbing ? (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigate('/mahasiswa/dosen-pembimbing');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200 rounded-xl"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <GraduationCap className="h-5 w-5 mr-3 text-blue-600" />
                        <div className="flex flex-col items-start">
                          <span className="text-xs font-normal text-blue-500">Dosen Pembimbing</span>
                          <span className="text-sm font-semibold text-blue-700">{dosenPembimbing.nama}</span>
                        </div>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          navigate('/mahasiswa/dosen-selection');
                          setMobileMenuOpen(false);
                        }}
                        className="w-full justify-start bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <UserCheck className="h-5 w-5 mr-3" />
                        Pilih Dosen Pembimbing
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </nav>
    </>
  );
};

export default Navbar;