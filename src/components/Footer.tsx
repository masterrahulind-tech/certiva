import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { FaTwitter, FaLinkedin, FaFacebook, FaInstagram } from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 pt-20 pb-10 text-slate-300 border-t border-slate-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-block mb-6">
              <div className="bg-white/95 p-3 rounded-2xl shadow-lg border border-white/20 inline-flex">
                <img src="/logo.png" alt="Certiva Logo" className="h-10 w-auto object-contain" />
              </div>
            </Link>
            <p className="text-slate-400 leading-relaxed mb-8 max-w-sm">
              The global standard for digital credential verification. Connecting professionals with verifiable, tamper-proof achievements powered by Careercue.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><FaTwitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><FaLinkedin size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><FaFacebook size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"><FaInstagram size={18} /></a>
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-white font-bold mb-6 tracking-wide">Platform</h4>
            <ul className="space-y-4">
              <li><Link to="/verify" className="text-slate-400 hover:text-blue-400 transition-colors">Verify Credentials</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">For Organizations</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">For Issuers</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Digital Badges</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-bold mb-6 tracking-wide">Resources</h4>
            <ul className="space-y-4">
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Help Center</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">API Documentation</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Integration Guides</Link></li>
              <li><Link to="#" className="text-slate-400 hover:text-blue-400 transition-colors">Case Studies</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-bold mb-6 tracking-wide">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-blue-500 shrink-0 mt-0.5" />
                <span className="text-slate-400">CareerCue & Sindhura Group<br/>Bhopal, Madhya Pradesh, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-blue-500 shrink-0" />
                <a href="mailto:support@careercue.in" className="text-slate-400 hover:text-blue-400 transition-colors">support@careercue.in</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-blue-500 shrink-0" />
                <span className="text-slate-400">+91 123 456 7890</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} Certiva. A project hosted by Careercue.in. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="#" className="text-slate-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="#" className="text-slate-500 hover:text-white transition-colors">Terms of Service</Link>
            <Link to="#" className="text-slate-500 hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
