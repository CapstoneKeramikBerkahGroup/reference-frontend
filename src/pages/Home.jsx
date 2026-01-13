import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Brain, 
  Network, 
  Users, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  GraduationCap,
  UserCheck,
  FileSearch,
  BarChart3,
  Shield,
  Zap,
  Languages
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-cyan-600" />,
      title: t('home.feature1Title'),
      description: t('home.feature1Description')
    },
    {
      icon: <Network className="w-8 h-8 text-blue-600" />,
      title: t('home.feature2Title'),
      description: t('home.feature2Description')
    },
    {
      icon: <Users className="w-8 h-8 text-cyan-600" />,
      title: t('home.feature3Title'),
      description: t('home.feature3Description')
    },
    {
      icon: <FileSearch className="w-8 h-8 text-blue-600" />,
      title: t('home.feature4Title'),
      description: t('home.feature4Description')
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-cyan-600" />,
      title: t('home.feature5Title'),
      description: t('home.feature5Description')
    },
    {
      icon: <Shield className="w-8 h-8 text-blue-600" />,
      title: t('home.feature6Title'),
      description: t('home.feature6Description')
    }
  ];

  const howItWorks = [
    {
      step: '1',
      title: t('home.step1Title'),
      description: t('home.step1Description')
    },
    {
      step: '2',
      title: t('home.step2Title'),
      description: t('home.step2Description')
    },
    {
      step: '3',
      title: t('home.step3Title'),
      description: t('home.step3Description')
    },
    {
      step: '4',
      title: t('home.step4Title'),
      description: t('home.step4Description')
    }
  ];

  const specializations = [
    { name: t('home.spec1Name'), full: t('home.spec1Full'), color: 'bg-cyan-100 text-cyan-700' },
    { name: t('home.spec2Name'), full: t('home.spec2Full'), color: 'bg-blue-100 text-blue-700' },
    { name: t('home.spec3Name'), full: t('home.spec3Full'), color: 'bg-indigo-100 text-indigo-700' },
    { name: t('home.spec4Name'), full: t('home.spec4Full'), color: 'bg-purple-100 text-purple-700' },
    { name: t('home.spec5Name'), full: t('home.spec5Full'), color: 'bg-pink-100 text-pink-700' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img 
                  src="/images/logo telkom university.png" 
                  alt="Telkom University" 
                  className="h-10 w-auto"
                />
                <div className="h-8 w-px bg-gray-300"></div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900">Telkom University</span>
                  <span className="text-xs text-gray-600">SI Sistem Informasi</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleLanguage}
                className="text-gray-700 hover:text-cyan-600"
                title={i18n.language === 'en' ? 'Switch to Indonesian' : 'Ganti ke Bahasa Inggris'}
              >
                <Languages className="h-5 w-5" />
                <span className="ml-2 text-xs font-semibold">
                  {i18n.language === 'en' ? 'EN' : 'ID'}
                </span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-gray-700 hover:text-cyan-600"
              >
                {t('home.login')}
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white"
              >
                {t('home.register')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 px-4 py-1.5 text-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              {t('home.badge')}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 leading-tight">
              {t('home.heroTitle')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-600">{t('home.heroTitleHighlight')}</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('home.heroDescription')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-6 text-lg"
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                {t('home.getStarted')}
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/login')}
                className="border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 px-8 py-6 text-lg"
              >
                <UserCheck className="mr-2 h-5 w-5" />
                {t('home.login')}
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Gratis untuk mahasiswa</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">AI Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Secure & Private</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-3xl transform rotate-3 opacity-20"></div>
            <Card className="relative bg-white/80 backdrop-blur-sm border-2 border-cyan-200 shadow-2xl">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded-full w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-100 rounded-full w-1/2"></div>
                    </div>
                    <Zap className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2 bg-gray-200 rounded-full" style={{ width: `${100 - i * 15}%` }}></div>
                          <div className="h-2 bg-gray-100 rounded-full w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full"></div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white/50 backdrop-blur-sm py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-4 py-1.5 mb-4">
              {t('home.featuresBadge')}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
              {t('home.featuresTitle')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('home.featuresSubtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-gray-100 hover:border-cyan-200 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-4 py-1.5 mb-4">
            {t('home.howItWorksBadge')}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-4">
            {t('home.howItWorksTitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('home.howItWorksSubtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((item, index) => (
            <div key={index} className="relative">
              <Card className="border-2 border-cyan-100 hover:border-cyan-300 hover:shadow-xl transition-all duration-300 h-full">
                <CardContent className="pt-8 pb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4 mx-auto">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
              {index < howItWorks.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                  <ArrowRight className="w-6 h-6 text-cyan-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Specializations Section */}
      <section className="bg-gradient-to-br from-cyan-600 to-blue-600 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              {t('home.specializationsTitle')}
            </h2>
            <p className="text-lg text-cyan-100 max-w-2xl mx-auto">
              {t('home.specializationsSubtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {specializations.map((spec, index) => (
              <Card key={index} className="bg-white/95 backdrop-blur-sm hover:bg-white hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className={`inline-block px-4 py-2 rounded-lg ${spec.color} font-bold text-lg mb-3`}>
                    {spec.name}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {spec.full}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="bg-gradient-to-r from-cyan-600 to-blue-600 border-0 shadow-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-lg text-cyan-100 mb-8 max-w-2xl mx-auto">
              {t('home.ctaDescription')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-white text-cyan-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                {t('home.ctaRegister')}
              </Button>
              <Button 
                size="lg"
                onClick={() => navigate('/login')}
                className="bg-white/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-cyan-600 px-8 py-6 text-lg font-semibold transition-all duration-300"
              >
                {t('home.ctaLogin')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-cyan-400" />
                <span className="text-white font-semibold text-lg">ReferoAI</span>
              </div>
              <p className="text-sm text-gray-400">
                {t('home.footerDescription')}
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.footerPlatform')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('home.footerFeatures')}</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('home.footerHowItWorks')}</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('home.footerSpecializations')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.footerHelp')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('home.footerFAQ')}</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('home.footerGuide')}</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">{t('home.footerContact')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">{t('home.footerContact')}</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span>📧</span>
                  <span>si@telkomuniversity.ac.id</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>🏢</span>
                  <span>Telkom University</span>
                </li>
                <li className="flex items-center gap-2">
                  <span>📍</span>
                  <span>Bandung, Indonesia</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>{t('home.footerCopyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
