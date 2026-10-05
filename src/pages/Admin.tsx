

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../lib/supabase";

const getOrgName = (prefix: string) => {
  if (prefix === 'NLIT' || prefix === 'NLITW' || prefix.startsWith('NLIT')) return 'NLIT EDU (OPC) PVT. LTD.';
  if (prefix === 'CCUE') return 'Careercue';
  return prefix;
};
import { 
 ShieldCheck, LayoutDashboard, FileSignature, XCircle, 
 Database, Building2, LogOut, Award, 
 Unlock, BarChart3
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";

type CertResult = {
 name: string;
 course: string;
 college?: string;
 certNumber?: string;
 cloudinaryUrl?: string;
 emailSent?: boolean;
 dbError?: string;
 status: string;
 error?: string;
};

type Certificate = {
 id: string;
 student_name: string;
 course_name: string;
 college_name: string;
 certificate_number: string;
 pdf_url: string;
 issue_date: string;
 grade: string;
 certificate_type?: string;
};

export default function CertivaAdmin() {
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
      const orgMap = new Map();
      let totalPremium = 0;
      
      data.forEach((cert) => {
        const isPremium = cert.grade === 'Premium' || cert.certificate_type === 'premium';
        if (isPremium) totalPremium++;
        
        const prefix = cert.certificate_number ? cert.certificate_number.split('-')[0] : 'Unknown';
        const orgName = getOrgName(prefix);
        
        if (!orgMap.has(orgName)) {
          orgMap.set(orgName, { name: orgName, credentials: 0, premium: 0 });
        }
        const orgStat = orgMap.get(orgName);
        orgStat.credentials++;
        if (isPremium) orgStat.premium++;
      });

      setStats({
        total: data.length,
        premium: totalPremium,
        orgs: Array.from(orgMap.values()).sort((a, b) => b.credentials - a.credentials)
      });
    }
  };
  fetchStats();
 }, []);

 const [isAuthenticated, setIsAuthenticated] = useState(false);
 const [adminId, setAdminId] = useState("");
 const [adminPass, setAdminPass] = useState("");

 const [generationMode, setGenerationMode] = useState<"bulk" | "individual">("bulk");
 const [certificateType, setCertificateType] = useState<"internship" | "workshop">("internship");
 const [studentQuery, setStudentQuery] = useState("");
 const [sendEmail, setSendEmail] = useState(true);

 const [startDate, setStartDate] = useState("");
 const [endDate, setEndDate] = useState("");
 const [customIssueDate, setCustomIssueDate] = useState("");
 const [courseFilter, setCourseFilter] = useState("all");
 const [courses, setCourses] = useState<string[]>([]);
 const [isLoading, setIsLoading] = useState(false);
 const [results, setResults] = useState<CertResult[]>([]);
 const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

 const [tab, setTab] = useState<"dashboard" | "generate" | "history" | "organizations">("dashboard");
 const [certificates, setCertificates] = useState<Certificate[]>([]);
 const [loadingCerts, setLoadingCerts] = useState(false);
 const [searchTerm, setSearchTerm] = useState("");
 const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
 const [genTab, setGenTab] = useState<"generate" | "history">("generate");

 // Production: Certiva's own Firebase Cloud Function (hosting rewrites /api/** to the function)
 // Localhost: Next.js dev server for testing
 const API_BASE = window.location.hostname === "localhost" ? "http://localhost:3000" : "https://certiva.careercue.in";

 useEffect(() => {
 const savedId = sessionStorage.getItem("cert_admin_id");
 const savedPass = sessionStorage.getItem("cert_admin_pass");
 if (savedId && savedPass) {
 setAdminId(savedId);
 setAdminPass(savedPass);
 // Auto-authenticate with saved credentials
 setIsLoading(true);
 fetch(`${API_BASE}/api/generate_certificates?action=courses&adminId=${encodeURIComponent(savedId)}&adminPass=${encodeURIComponent(savedPass)}`)
 .then((r) => {
 if (r.ok) {
 setIsAuthenticated(true);
 return r.json();
 } else {
 sessionStorage.removeItem("cert_admin_id");
 sessionStorage.removeItem("cert_admin_pass");
 throw new Error("Session expired.");
 }
 })
 .then((d) => setCourses(d.courses || []))
 .catch(() => {})
 .finally(() => setIsLoading(false));
 }
 }, []);

 const handleLogin = (e: React.FormEvent) => {
 e.preventDefault();
 if (adminId && adminPass) {
 setIsLoading(true);
 fetch(`${API_BASE}/api/generate_certificates?action=courses&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`)
 .then((r) => {
 if (r.ok) {
 setIsAuthenticated(true);
 sessionStorage.setItem("cert_admin_id", adminId);
 sessionStorage.setItem("cert_admin_pass", adminPass);
 return r.json();
 } else {
 throw new Error("Invalid credentials.");
 }
 })
 .then((d) => setCourses(d.courses || []))
 .catch((err) => {
 setMessage({ type: "error", text: err.message || "Failed to authenticate." });
 })
 .finally(() => {
 setIsLoading(false);
 });
 }
 };


 const loadCertificates = async () => {
 setLoadingCerts(true);
 try {
 const res = await fetch(`${API_BASE}/api/generate_certificates?action=certificates&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`);
 if (res.status === 401) {
 setIsAuthenticated(false);
 return;
 }
 const data = await res.json();
 setCertificates(data.certificates || []);
 } catch { /* ignore */ }
 setLoadingCerts(false);
 };

 useEffect(() => {
 if (isAuthenticated && tab === "history") {
 loadCertificates();
 }
 }, [isAuthenticated, tab]);

 const handleSendEmail = async (c: Certificate) => {
 const email = window.prompt(`Enter email address to send ${c.student_name}'s certificate to:`);
 if (!email) return;

 setSendingEmailId(c.id);
 try {
 const res = await fetch(`${API_BASE}/api/email`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 type: "certificate",
 studentName: c.student_name,
 studentEmail: email,
 courseTitle: c.course_name,
 certificateNumber: c.certificate_number,
 pdfUrl: c.pdf_url,
 certificateType: c.certificate_type || "internship",
 }),
 });

 const data = await res.json();
 if (res.ok) {
 alert("Email sent successfully! (Check spam folder if not in inbox)");
 } else {
 alert(`Failed to send email!\n\nReason: ${data.details || data.error || "Unknown error"}`);
 }
 } catch (err: any) {
 alert("Network error: " + err.message);
 }
 setSendingEmailId(null);
 };

 const handleGenerate = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);
 setMessage(null);
 setResults([]);
 
 try {
 let queriesToProcess: string[] = [];

 if (generationMode === "bulk") {
 setMessage({ type: "success", text: "Fetching enrollments..." });
 const fetchRes = await fetch(`${API_BASE}/api/generate_certificates?action=enrollments&course=${encodeURIComponent(courseFilter)}&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`);
 
 const fetchText = await fetchRes.text();
 let fetchData;
 try {
 fetchData = JSON.parse(fetchText);
 } catch (err) {
 throw new Error(`Server returned a non-JSON response during fetch: ${fetchText.substring(0, 50)}...`);
 }

 if (!fetchRes.ok) throw new Error(fetchData.error || "Failed to fetch enrollments.");
 if (!fetchData.enrollments || fetchData.enrollments.length === 0) {
 throw new Error("No paid enrollments found for the selected course.");
 }

 // Chunk into groups of 3 students per request to avoid timeout
 const enrollments = fetchData.enrollments;
 for (let i = 0; i < enrollments.length; i += 3) {
 queriesToProcess.push(enrollments.slice(i, i + 3).map((enr: any) => enr.id).join(","));
 }
 } else {
 // Chunk the individual queries (comma-separated) into groups of 3
 const allQueries = studentQuery.split(",").map(q => q.trim()).filter(Boolean);
 if (allQueries.length === 0) {
 throw new Error("Please enter at least one Student ID or Email.");
 }
 for (let i = 0; i < allQueries.length; i += 3) {
 queriesToProcess.push(allQueries.slice(i, i + 3).join(","));
 }
 }

 const allResults: CertResult[] = [];
 let totalSuccess = 0;
 let totalErrors = 0;

 for (let i = 0; i < queriesToProcess.length; i++) {
 if (queriesToProcess.length > 1) {
 setMessage({ type: "success", text: `Processing batch ${i + 1} of ${queriesToProcess.length}...` });
 }

 const res = await fetch(`${API_BASE}/api/generate_certificates`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 adminId,
 adminPass,
 startDate,
 endDate,
 mode: "individual", // Always process as 'individual' chunks under the hood
 studentQuery: queriesToProcess[i],
 sendEmail,
 certificateType,
 customIssueDate,
 }),
 });

 const text = await res.text();
 let data;
 try {
 data = JSON.parse(text);
 } catch (err) {
 throw new Error(`Batch ${i + 1} failed with a non-JSON response (timeout?): ${text.substring(0, 50)}...`);
 }

 if (res.ok) {
 if (data.results) {
 allResults.push(...data.results);
 totalSuccess += data.results.filter((r: any) => r.status === "success").length;
 totalErrors += data.results.filter((r: any) => r.status === "error").length;
 }
 } else {
 if (res.status === 401) {
 setIsAuthenticated(false);
 return;
 }
 if (queriesToProcess.length === 1) {
 throw new Error(data.error || "Failed.");
 } else {
 console.error(`Batch ${i + 1} error:`, data.error);
 // Optionally push a synthetic error result so the user sees it in the table
 }
 }
 }

 setResults(allResults);
 if (queriesToProcess.length > 1 || generationMode === "individual") {
 setMessage({ type: "success", text: `Completed! Generated ${totalSuccess} certificates. ${totalErrors} errors.` });
 } else {
 setMessage({ type: "success", text: `Completed generation.` });
 }

 } catch (err: any) {
 setMessage({ type: "error", text: err.message || "Network error." });
 }
 setIsLoading(false);
 };

 const [historyTypeFilter, setHistoryTypeFilter] = useState("all");
 const [historyClientFilter, setHistoryClientFilter] = useState("all");

 const uniqueClients = useMemo(() => {
 const clients = new Set(certificates.map(c => c.certificate_number ? getOrgName(c.certificate_number.split('-')[0]) : 'Unknown').filter(Boolean));
 return Array.from(clients).sort();
 }, [certificates]);

 const filteredCerts = certificates.filter((c) => {
 const matchesSearch =
 c.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 c.certificate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 c.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
 
 // Default older certificates without a type to "internship"
 const cType = c.certificate_type || "internship";
 const matchesType = historyTypeFilter === "all" || cType === historyTypeFilter;
 
 const cClient = c.certificate_number ? getOrgName(c.certificate_number.split('-')[0]) : 'Unknown';
 const matchesClient = historyClientFilter === "all" || cClient === historyClientFilter;

 return matchesSearch && matchesType && matchesClient;
 });

 // ── LOGIN ──
 if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Subtle grid background */}
        <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute inset-0 z-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        {/* Ambient Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/20 rounded-full blur-[120px] pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] bg-white rounded-3xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 z-10 relative"
        >
          <div className="px-10 pt-10 pb-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 mx-auto mb-6">
              <ShieldCheck size={32} strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Certiva Admin Console</h1>
            <p className="text-slate-500 mt-2 text-sm">Sign in to manage global credential issuance.</p>
          </div>
          
          <form onSubmit={handleLogin} className="px-10 pb-10 space-y-5">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Admin Email</label>
                <div className="relative">
                  <input 
                    type="email" 
                    value={adminId} 
                    onChange={(e) => setAdminId(e.target.value)} 
                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 font-medium" 
                    placeholder="name@organization.com" 
                    required 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    value={adminPass} 
                    onChange={(e) => setAdminPass(e.target.value)} 
                    className="w-full pl-4 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 font-medium" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>
            </div>

            {message && message.type === "error" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3.5 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <XCircle size={14} className="text-red-600" />
                </div>
                <span className="font-medium">{message.text}</span>
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full py-3.5 mt-2 bg-slate-900 hover:bg-blue-600 text-white font-semibold rounded-xl shadow-md shadow-slate-900/10 hover:shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In Securely</span>
                  <Unlock size={18} />
                </>
              )}
            </button>
          </form>
          
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">Protected by Enterprise-grade Security</p>
          </div>
        </motion.div>
      </div>
    );
  }

 // ── DASHBOARD ──
 return (
 <div className="flex h-screen bg-slate-50 font-sans">
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
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-900">Partner Organizations</h3>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">{stats.orgs.length} Active Partners</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-slate-600">Organization Name</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-center">Total Credentials Issued</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-center">Premium Credentials</th>
                        <th className="px-6 py-4 font-semibold text-slate-600 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {stats.orgs.map((org, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                                <Building2 size={18} />
                              </div>
                              <span className="font-bold text-slate-900">{org.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-slate-600">{org.credentials}</td>
                          <td className="px-6 py-4 text-center font-medium text-slate-600">
                            {org.premium > 0 ? (
                              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">{org.premium}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}


 {tab === "generate" && (
 <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
 <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
 {/* Organization Identity Card */}
 <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 ">
 <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
 <span className="text-white font-black text-lg tracking-tighter leading-none" style={{ fontSize: '11px', lineHeight: '1.1', textAlign: 'center' }}>NLIT<br/>EDU</span>
 </div>
 <div>
 <h3 className="text-lg font-black text-slate-900 tracking-tight m-0">NLIT EDU (OPC) PVT. LTD.</h3>
 <p className="text-xs text-slate-500 m-0 mt-0.5">Authorized Certificate Issuing Authority • Powered by Certiva</p>
 </div>
 <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 ">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
 <span className="text-xs font-bold text-emerald-700 ">Connected</span>
 </div>
 </div>

 {/* Sub-Tabs: Generate vs History */}
 <div className="flex gap-4 mb-8">
 <button
 onClick={() => setGenTab("generate")}
 className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
 genTab === "generate"
 ? "bg-slate-900 text-white shadow-md"
 : "bg-slate-100 text-slate-500 hover:bg-slate-200 :bg-slate-700"
 }`}
 >
 🎓 Generate
 </button>
 <button
 onClick={() => { setGenTab("history"); loadCertificates(); }}
 className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
 genTab === "history"
 ? "bg-slate-900 text-white shadow-md"
 : "bg-slate-100 text-slate-500 hover:bg-slate-200 :bg-slate-700"
 }`}
 >
 🧾 History
 </button>
 </div>

 {genTab === "generate" ? (
 <>
 <h2 className="text-xl font-bold text-slate-900 mb-6">Certificate Generation System</h2>
 <form onSubmit={handleGenerate} className="space-y-6">
 {/* Certificate Type Selector */}
 <div className="border-b border-slate-100 pb-4">
 <label className="block text-sm font-semibold text-slate-700 mb-3">Certificate Type</label>
 <div className="flex gap-4">
 <button
 type="button"
 onClick={() => setCertificateType("internship")}
 className={`flex-1 py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
 certificateType === "internship"
 ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 "
 : "border-slate-200 text-slate-600 hover:bg-slate-50 :bg-slate-800/30"
 }`}
 >
 🎓 Internship Certificate
 </button>
 <button
 type="button"
 onClick={() => setCertificateType("workshop")}
 className={`flex-1 py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
 certificateType === "workshop"
 ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 "
 : "border-slate-200 text-slate-600 hover:bg-slate-50 :bg-slate-800/30"
 }`}
 >
 🛠 Workshop Certificate
 </button>
 </div>
 </div>

 {/* Mode Selector */}
 <div className="border-b border-slate-100 pb-4">
 <label className="block text-sm font-semibold text-slate-700 mb-3">Generation Mode</label>
 <div className="flex gap-4">
 <button
 type="button"
 onClick={() => setGenerationMode("bulk")}
 className={`flex-1 py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
 generationMode === "bulk"
 ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 "
 : "border-slate-200 text-slate-600 hover:bg-slate-50 :bg-slate-800/30"
 }`}
 >
 📂 Bulk Mode (Paid Enrollments)
 </button>
 <button
 type="button"
 onClick={() => setGenerationMode("individual")}
 className={`flex-1 py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
 generationMode === "individual"
 ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 "
 : "border-slate-200 text-slate-600 hover:bg-slate-50 :bg-slate-800/30"
 }`}
 >
 👤 Individual Mode (Comma Separated IDs/Emails)
 </button>
 </div>
 </div>

 {/* Mode-Specific inputs */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 {generationMode === "bulk" ? (
 <div>
 <label className="block text-sm font-semibold text-slate-700 mb-2">Course Filter</label>
 <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 outline-none">
 <option value="all">All Courses</option>
 {courses.map((c) => (<option key={c} value={c}>{c}</option>))}
 </select>
 </div>
 ) : (
 <div>
 <label className="block text-sm font-semibold text-slate-700 mb-2">Student IDs or Emails</label>
 <input
 type="text"
 value={studentQuery}
 onChange={(e) => setStudentQuery(e.target.value)}
 className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
 placeholder="e.g. 44, student@email.com"
 required
 />
 </div>
 )}
 <div>
 <label className="block text-sm font-semibold text-slate-700 mb-2">Start Date</label>
 <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="DD-MM-YYYY" required />
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-700 mb-2">End Date</label>
 <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="DD-MM-YYYY" required />
 </div>
 <div>
 <label className="block text-sm font-semibold text-slate-700 mb-2">Issue Date (Optional)</label>
 <input type="date" value={customIssueDate} onChange={(e) => setCustomIssueDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-slate-50 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500" />
 </div>
 </div>

 {/* Delivery Checkboxes */}
 <div className="flex flex-wrap gap-6 items-center pt-2">
 <label className="flex items-center gap-3 cursor-pointer select-none text-sm font-semibold text-slate-700 ">
 <input
 type="checkbox"
 checked={sendEmail}
 onChange={(e) => setSendEmail(e.target.checked)}
 className="w-5 h-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
 />
 📧 Deliver via Email (GoDaddy SMTP)
 </label>
 <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 ">
 <span>📱 Automatically syncs to Student App (certificates table)</span>
 </div>
 </div>

 {message && (
 <div className={`p-4 rounded-lg border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700 " : "bg-red-50 border-red-200 text-red-700 "}`}>
 <p className="font-medium">{message.text}</p>
 </div>
 )}

 <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2">
 {isLoading ? (
 <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Generating...</>
 ) : generationMode === "bulk" ? "🚀 Generate Batch Certificates" : "🚀 Generate Individual Certificate"}
 </button>
 </form>

 {/* Results Table */}
 {results.length > 0 && (
 <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
 <div className="p-6 border-b border-slate-100 ">
 <h3 className="text-lg font-bold text-slate-900 ">Generation Results ({results.length})</h3>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 ">
 <tr>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Student</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Course</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Cert Number</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Status</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Email Delivery</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {results.map((r, i) => (
 <tr key={i} className="hover:bg-slate-50 :bg-slate-800/50">
 <td className="px-6 py-4 font-medium text-slate-900 ">
 {r.name}
 </td>
 <td className="px-6 py-4 text-slate-600 ">{r.course}</td>
 <td className="px-6 py-4 font-mono text-xs text-slate-700 ">{r.certNumber || "—"}</td>
 <td className="px-6 py-4">
 {r.status === "success" ? (
 <div className="flex flex-col gap-1 items-start">
 <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold ">✅ Success</span>
 {r.dbError && (
 <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold " title={r.dbError}>⚠️ DB RLS Bypassed</span>
 )}
 </div>
 ) : (
 <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold " title={r.error}>❌ Error</span>
 )}
 </td>
 <td className="px-6 py-4">
 {sendEmail ? (
 r.emailSent ? (
 <span className="text-green-600 font-semibold text-xs">📧 Delivered</span>
 ) : (
 <span className="text-red-500 font-semibold text-xs">⚠️ Failed</span>
 )
 ) : (
 <span className="text-slate-400 text-xs">Skipped</span>
 )}
 </td>
 <td className="px-6 py-4">
 {r.cloudinaryUrl && (
 <a href={r.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold ">View ↗</a>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </>
 ) : (
 <div className="mt-6">
 <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
 <h3 className="text-lg font-bold text-slate-900 ">Issued Certificates ({filteredCerts.length})</h3>
 <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
 <select 
 value={historyTypeFilter} 
 onChange={(e) => setHistoryTypeFilter(e.target.value)} 
 className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 outline-none w-full sm:w-48"
 >
 <option value="all">All Types</option>
 <option value="internship">Internship</option>
 <option value="workshop">Workshop</option>
 </select>
 <input type="text" placeholder="Search by name, course, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 outline-none w-full sm:w-72" />
 </div>
 </div>
 {loadingCerts ? (
 <div className="p-12 text-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
 ) : filteredCerts.length === 0 ? (
 <div className="p-12 text-center text-slate-500">No certificates found.</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 ">
 <tr>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Student</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Course</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Cert ID</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Issued</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {filteredCerts.map((c) => (
 <tr key={c.id} className="hover:bg-slate-50 :bg-slate-800/50">
 <td className="px-6 py-4 font-medium text-slate-900 ">{c.student_name}</td>
 <td className="px-6 py-4 text-slate-600 ">{c.course_name}</td>
 <td className="px-6 py-4 font-mono text-xs text-slate-700 ">{c.certificate_number}</td>
 <td className="px-6 py-4 text-slate-600 ">{c.issue_date}</td>
 <td className="px-6 py-4 flex flex-wrap gap-3">
 {c.pdf_url && <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold ">View ↗</a>}
 <a href={`/verify?id=${c.certificate_number}`} target="_blank" className="text-emerald-600 hover:text-emerald-800 text-xs font-bold ">Verify</a>
 <button 
 onClick={() => handleSendEmail(c)}
 disabled={sendingEmailId === c.id}
 className="text-blue-600 hover:text-blue-800 text-xs font-bold disabled:opacity-50"
 >
 {sendingEmailId === c.id ? "Sending..." : "📧 Email"}
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}
 </div>
 </motion.div>
 )}

 {tab === "history" && (
 <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
 <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
 <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
 <h3 className="text-lg font-bold text-slate-900 ">Global Ledger ({filteredCerts.length})</h3>
 <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
 <select 
 value={historyClientFilter} 
 onChange={(e) => setHistoryClientFilter(e.target.value)} 
 className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 outline-none w-full sm:w-48"
 >
 <option value="all">All Organizations</option>
 {uniqueClients.map((client) => (
 <option key={client} value={client}>{client}</option>
 ))}
 </select>
 <select 
 value={historyTypeFilter} 
 onChange={(e) => setHistoryTypeFilter(e.target.value)} 
 className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 outline-none w-full sm:w-48"
 >
 <option value="all">All Types</option>
 <option value="internship">Internship</option>
 <option value="workshop">Workshop</option>
 </select>
 <input type="text" placeholder="Search by name, course, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 outline-none w-full sm:w-72" />
 </div>
 </div>
 {loadingCerts ? (
 <div className="p-12 text-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
 ) : filteredCerts.length === 0 ? (
 <div className="p-12 text-center text-slate-500">No certificates found.</div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 ">
 <tr>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Student</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Course</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Organization</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Cert ID</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Issued</th>
 <th className="px-6 py-3 text-left font-semibold text-slate-600 ">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 ">
 {filteredCerts.map((c) => (
 <tr key={c.id} className="hover:bg-slate-50 :bg-slate-800/50">
 <td className="px-6 py-4 font-medium text-slate-900 ">{c.student_name}</td>
 <td className="px-6 py-4 text-slate-600 ">{c.course_name}</td>
 <td className="px-6 py-4 text-slate-600 ">{c.certificate_number ? getOrgName(c.certificate_number.split("-")[0]) : "Unknown"}</td>
 <td className="px-6 py-4 font-mono text-xs text-slate-700 ">{c.certificate_number}</td>
 <td className="px-6 py-4 text-slate-600 ">{c.issue_date}</td>
 <td className="px-6 py-4 flex flex-wrap gap-3">
 {c.pdf_url && <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold ">View ↗</a>}
 <a href={`/verify?id=${c.certificate_number}`} target="_blank" className="text-emerald-600 hover:text-emerald-800 text-xs font-bold ">Verify</a>
 <button 
 onClick={() => handleSendEmail(c)}
 disabled={sendingEmailId === c.id}
 className="text-blue-600 hover:text-blue-800 text-xs font-bold disabled:opacity-50"
 >
 {sendingEmailId === c.id ? "Sending..." : "📧 Email"}
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </motion.div>
 )}

 </AnimatePresence>
 </div>
 </div>
 </div>
 );
}
