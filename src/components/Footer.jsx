import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-cyan-600 to-blue-700 text-white mt-auto">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & Description Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Refero</h3>
                <p className="text-xs text-cyan-100">AI Research Companion</p>
              </div>
            </div>
            <p className="text-sm text-cyan-100 leading-relaxed">
              Platform manajemen referensi penelitian berbasis AI untuk mahasiswa dan dosen 
              Sistem Informasi Telkom University.
            </p>
          </div>

          {/* University Logos Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Supported By</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <img 
                  src="/images/logo telkom university.png" 
                  alt="Telkom University" 
                  className="h-10 w-auto object-contain bg-white rounded p-1"
                />
                <div className="text-sm">
                  <div className="font-semibold">Telkom University</div>
                  <div className="text-xs text-cyan-100">Bandung, Indonesia</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <img 
                  src="/images/logo fakultas rekayasa industri.webp" 
                  alt="Fakultas Rekayasa Industri" 
                  className="h-10 w-auto object-contain bg-white rounded p-1"
                />
                <div className="text-sm">
                  <div className="font-semibold">Fakultas Rekayasa Industri</div>
                  <div className="text-xs text-cyan-100">Industrial Engineering</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <img 
                  src="/images/logo sistem informasi.png" 
                  alt="Sistem Informasi" 
                  className="h-10 w-auto object-contain bg-white rounded p-1"
                />
                <div className="text-sm">
                  <div className="font-semibold">S1 Sistem Informasi</div>
                  <div className="text-xs text-cyan-100">Information Systems</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider">Contact Us</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Telkom University</p>
                  <p className="text-cyan-100 text-xs">
                    Jl. Telekomunikasi No. 1<br />
                    Bandung, Jawa Barat 40257
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-300 flex-shrink-0" />
                <a href="mailto:si@telkomuniversity.ac.id" className="hover:text-cyan-200 transition-colors">
                  si@telkomuniversity.ac.id
                </a>
              </div>
              
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-300 flex-shrink-0" />
                <a href="tel:+622287564108" className="hover:text-cyan-200 transition-colors">
                  +62 22 8756 4108
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-cyan-100">
            <div>
              © {currentYear} Refero - Telkom University. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link to="/help" className="hover:text-white transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
