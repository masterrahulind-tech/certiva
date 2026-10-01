import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Search } from 'lucide-react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/50 shadow-sm w-full">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="brand">
          {/* We will use a placeholder or the actual image if placed in public/logo.png */}
          <div className="logo-container">
             <img src="/logo.png" alt="Certiva Logo" className="logo-image" onError={(e) => {
               (e.target as HTMLImageElement).style.display = 'none';
               (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
             }}/>
             <div className="logo-fallback hidden">
                <ShieldCheck size={32} className="text-gradient" />
                <span className="brand-text text-gradient">Certiva</span>
             </div>
          </div>
        </Link>
        <nav className="nav-links hidden md:flex gap-8">
          <Link to="/" className="nav-link font-medium text-slate-600 hover:text-blue-600 transition-colors">Home</Link>
          <Link to="/verify" className="nav-link font-medium text-slate-600 hover:text-blue-600 transition-colors">Verify</Link>
          <a href="#about" className="nav-link font-medium text-slate-600 hover:text-blue-600 transition-colors">About Platform</a>
        </nav>
        <div className="header-actions">
           <Link to="/verify" className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:border-blue-600 hover:text-blue-600 transition-all text-sm md:text-base">
             <Search size={18}/> 
             <span className="hidden sm:inline">Verify Credential</span>
             <span className="sm:hidden">Verify</span>
           </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
