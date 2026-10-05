import { useState } from 'react';
import { 
  ShieldCheck, LayoutDashboard, FileSignature, 
  Database, Building2, LogOut, Award, 
  Unlock, BarChart3
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CertivaAdmin() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between">
        <div>
          {/* Logo Section */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Certiva</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Console</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="px-4 mt-6 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'generate', label: 'Generate', icon: FileSignature },
              { id: 'ledger', label: 'Ledger', icon: Database },
              { id: 'organizations', label: 'Organizations', icon: Building2 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium mb-4 px-2">admin@certiva.in</p>
          <button className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition px-2">
            <LogOut size={16} strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50">
        <div className="max-w-5xl mx-auto p-10">
          
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Platform Overview</h2>
            <p className="text-slate-500 font-medium">Live statistics from the Certiva global ledger.</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Total Certificates</p>
                <h3 className="text-4xl font-black text-slate-900">0</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Award size={24} strokeWidth={2.5} />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Premium Unlocked</p>
                <h3 className="text-4xl font-black text-slate-900">0</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Unlock size={24} strokeWidth={2.5} />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Partner Orgs</p>
                <h3 className="text-4xl font-black text-slate-900">2</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Building2 size={24} strokeWidth={2.5} />
              </div>
            </motion.div>
          </div>

          {/* Organization Breakdown */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" strokeWidth={2.5} />
              <h3 className="font-bold text-slate-900">Organization Breakdown</h3>
            </div>
            
            <div className="divide-y divide-slate-100">
              {[
                { name: 'NLIT EDU (OPC) PVT. LTD.', credentials: 0, premium: 0 },
                { name: 'Careercue', credentials: 0, premium: 0 },
              ].map((org, idx) => (
                <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                      <Building2 size={18} />
                    </div>
                    <span className="font-bold text-slate-900">{org.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-10">
                    <div className="text-center">
                      <p className="text-lg font-black text-slate-900 leading-none">{org.credentials}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Credentials</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-black text-emerald-600 leading-none">{org.premium}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Premium</p>
                    </div>
                    <button className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors border border-blue-100">
                      View Ledger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
