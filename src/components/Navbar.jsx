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
  LogOut, 
  User, 
  FileText, 
  BarChart3, 
  Users, 
  CheckSquare,
  Home,
  UserCheck,
  Bell,
  Languages,
  Menu,
  X
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

  // Navigation items untuk Mahasiswa
  const studentNavItems = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: Home },
    { path: '/documents', label: t('nav.documents'), icon: FileText },
    { path: '/mahasiswa/referensi', label: 'Referensi Saya', icon: CheckSquare },
    { path: '/visualization', label: t('nav.visualization'), icon: BarChart3 },
  ];

  // Navigation items untuk Dosen
  const lecturerNavItems = [
    { path: '/dosen/dashboard', label: t('nav.dashboard'), icon: Home },
    { path: '/dosen/request-bimbingan', label: t('nav.requestBimbingan'), icon: UserCheck },
    { path: '/dosen/mahasiswa', label: t('nav.students'), icon: Users },
    { path: '/dosen/pending-referensi', label: t('nav.reviewReferences'), icon: CheckSquare },
  ];

  const navItems = user?.role === 'dosen' ? lecturerNavItems : studentNavItems;

  return (
    <nav className="bg-gradient-to-r from-cyan-600 to-blue-600 border-b border-cyan-700 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left Section - Logo & Navigation Links */}
          <div className="flex items-center space-x-6">
            {/* Logo & Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Logo Sistem Informasi */}
              <img 
                src="/images/logo sistem informasi.png" 
                alt="Sistem Informasi" 
                className="h-8 sm:h-10 md:h-12 w-auto object-contain"
              />
              
              <div className="hidden sm:flex flex-col ml-2">
                <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                  Telkom University
                </span>
                <span className="text-[10px] sm:text-xs text-cyan-100 leading-tight">
                  S1 Sistem Informasi
                </span>
              </div>
            </div>
            
            {/* Navigation Links - Moved to Left */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${active 
                        ? 'bg-white/20 text-white' 
                        : 'text-cyan-100 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section - Hamburger, Dosen Pembimbing, Notification & User Menu */}
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Button (Mobile/Tablet Only) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white hover:bg-white/10"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Dosen Pembimbing Info (Only for Mahasiswa) */}
            {user?.role === 'mahasiswa' && (
              <>
                {dosenPembimbing ? (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/mahasiswa/dosen-pembimbing')}
                    className="hidden md:flex bg-white/10 hover:bg-white/20 text-white border border-white/30"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs font-normal">Dosen Pembimbing:</span>
                      <span className="text-sm font-semibold">{dosenPembimbing.nama}</span>
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/mahasiswa/dosen-selection')}
                    className="hidden md:flex bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Pilih Dosen Pembimbing
                  </Button>
                )}
              </>
            )}
            
            {/* Language Switcher */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleLanguage}
              className="relative text-white hover:bg-white/10"
              title={language === 'en' ? 'Switch to Indonesian' : 'Ganti ke Bahasa Inggris'}
            >
              <Languages className="h-5 w-5" />
              <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-white text-cyan-600 rounded px-1">
                {language.toUpperCase()}
              </span>
            </Button>
            
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
              {/* <span className="absolute top-1 right-1 h-2 w-2 bg-amber-500 rounded-full"></span> */}
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                  <Avatar className="h-10 w-10 border-2 border-white/50">
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold">
                      {getInitials(user?.nama)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="flex flex-col space-y-1 p-3 bg-gradient-to-r from-cyan-50 to-blue-50">
                  <p className="text-sm font-semibold text-gray-900">{user?.nama}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                  <Badge className="w-fit mt-1 bg-cyan-100 text-cyan-700 hover:bg-cyan-100">
                    {user?.role === 'dosen' ? 'Dosen Pembimbing' : 'Mahasiswa'}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                
                {/* Dosen Pembimbing Info untuk Mobile */}
                {user?.role === 'mahasiswa' && (
                  <>
                    <div className="p-2 md:hidden">
                      {dosenPembimbing ? (
                        <DropdownMenuItem onClick={() => navigate('/mahasiswa/dosen-pembimbing')}>
                          <User className="mr-2 h-4 w-4 text-cyan-600" />
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Dosen Pembimbing:</span>
                            <span className="text-sm font-semibold">{dosenPembimbing.nama}</span>
                          </div>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => navigate('/mahasiswa/dosen-selection')} className="text-amber-600">
                          <UserCheck className="mr-2 h-4 w-4" />
                          <span>Pilih Dosen Pembimbing</span>
                        </DropdownMenuItem>
                      )}
                    </div>
                    <DropdownMenuSeparator className="md:hidden" />
                  </>
                )}
                
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t('nav.profile')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
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
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-cyan-600 to-blue-700 z-50 shadow-2xl md:hidden transform transition-transform duration-300 ease-in-out">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center space-x-2">
                <img 
                  src="/images/logo sistem informasi.png" 
                  alt="Sistem Informasi" 
                  className="h-8 w-auto object-contain"
                />
                <span className="text-white font-bold text-sm">Menu</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col space-y-1 p-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                      ${active 
                        ? 'bg-white/20 text-white shadow-md' 
                        : 'text-cyan-100 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Dosen Pembimbing Section for Mobile */}
            {user?.role === 'mahasiswa' && (
              <div className="px-3 mt-4">
                <div className="border-t border-white/20 pt-4">
                  {dosenPembimbing ? (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/mahasiswa/dosen-pembimbing');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start bg-white/10 hover:bg-white/20 text-white border border-white/30"
                    >
                      <User className="h-4 w-4 mr-2" />
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-normal">Dosen Pembimbing:</span>
                        <span className="text-sm font-semibold">{dosenPembimbing.nama}</span>
                      </div>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        navigate('/mahasiswa/dosen-selection');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full justify-start bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
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
  );
};

export default Navbar;
