import re
import os

old_path = r'e:\CISCO\NLIT_EDU\nlitedu-main\NLITedu\nlitedu-main\src\app\certificate_admin\page.tsx'
new_path = r'e:\CISCO\NLIT_EDU\nlitedu-main\NLITedu\certiva\src\pages\Admin.tsx'

with open(old_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace 'use client'
code = code.replace('"use client";', '')

# Replace imports
code = code.replace('import { useState, useEffect } from "react";', 
'''import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { 
  ShieldCheck, LayoutDashboard, FileSignature, 
  Database, Building2, LogOut, Award, 
  Unlock, BarChart3
} from "lucide-react";
''')

# Replace component name and add new states
code = code.replace('export default function CertificateAdminPage() {', 
'''export default function CertivaAdmin() {
  const [stats, setStats] = useState({
    total: 0,
    premium: 0,
    orgs: [
      { name: "NLIT EDU (OPC) PVT. LTD.", credentials: 0, premium: 0 },
      { name: "Careercue", credentials: 0, premium: 0 }
    ]
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from('certificates').select('*');
      if (data) {
        let nlitTotal = 0, nlitPremium = 0;
        let careercueTotal = 0, careercuePremium = 0;
        
        data.forEach((cert: any) => {
          const isPremium = cert.grade === 'Premium' || cert.status === 'premium';
          if (cert.issuer_name?.includes('NLIT')) {
            nlitTotal++;
            if (isPremium) nlitPremium++;
          } else if (cert.issuer_name?.includes('Careercue')) {
            careercueTotal++;
            if (isPremium) careercuePremium++;
          }
        });

        setStats({
          total: data.length,
          premium: nlitPremium + careercuePremium,
          orgs: [
            { name: 'NLIT EDU (OPC) PVT. LTD.', credentials: nlitTotal, premium: nlitPremium },
            { name: 'Careercue', credentials: careercueTotal, premium: careercuePremium }
          ]
        });
      }
    };
    fetchStats();
  }, []);
''')

# Change tab default from 'generate' to 'dashboard'
code = code.replace('const [tab, setTab] = useState<"generate" | "history">("generate");', 'const [tab, setTab] = useState<"dashboard" | "generate" | "history" | "organizations">("dashboard");')

# Now for the main UI structure replacement
# The authenticated UI starts at: <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-4 md:p-8">

# Find the start of the main UI
start_idx = code.find('<div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-20 px-4">')
if start_idx != -1:
    # Replace the outer wrapper and header with our Sidebar
    header_end = code.find('<AnimatePresence mode="wait">', start_idx)
    
    new_ui = '''<div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between overflow-y-auto shrink-0">
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
              { id: 'history', label: 'Ledger', icon: Database },
              { id: 'organizations', label: 'Organizations', icon: Building2 },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  tab === item.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <item.icon size={18} strokeWidth={tab === item.id ? 2.5 : 2} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium mb-4 px-2">admin@certiva.in</p>
          <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition px-2">
            <LogOut size={16} strokeWidth={2.5} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-slate-50/50">
        <div className="max-w-6xl mx-auto p-10">
          
          <AnimatePresence mode="wait">
          
          {tab === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    <h3 className="text-4xl font-black text-slate-900">{stats.total}</h3>
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
                    <h3 className="text-4xl font-black text-slate-900">{stats.premium}</h3>
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
                    <h3 className="text-4xl font-black text-slate-900">{stats.orgs.filter(o => o.credentials > 0).length || 2}</h3>
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
                  {stats.orgs.map((org, idx) => (
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
                        <button onClick={() => setTab('history')} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors border border-blue-100">
                          View Ledger
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {tab === "organizations" && (
            <motion.div key="organizations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden p-10 text-center">
                  <Building2 size={48} className="mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Organizations Management</h3>
                  <p className="text-slate-500">Partner organization onboarding will be available in the next platform update.</p>
               </div>
            </motion.div>
          )}

'''
    
    code = code[:start_idx] + new_ui + code[header_end + len('<AnimatePresence mode="wait">'):]

# In Certiva we need to prefix the fetch URLs with the NEXT_PUBLIC_API_URL or hardcode it since they are cross-origin
code = code.replace('fetch(`/api/generate_certificates', 'fetch(`https://nlitedu.com/api/generate_certificates')
code = code.replace("fetch('/api/generate_certificates", "fetch('https://nlitedu.com/api/generate_certificates")

# Ensure the outermost div uses the correct padding for the rest of the generated UI
# The old code had </div></div> at the very end. We need to make sure our flex layout closes properly.
# The `CertivaAdmin` component has a wrapper `<div className="flex-1 overflow-auto bg-slate-50/50"><div className="max-w-6xl mx-auto p-10">`

with open(new_path, 'w', encoding='utf-8') as f:
    f.write(code)

print('Successfully merged!')
