"use client";

import { useState, useEffect } from "react";
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

export default function CertificateAdminPage() {
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

  const [tab, setTab] = useState<"generate" | "history">("generate");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingCerts, setLoadingCerts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  useEffect(() => {
    const savedId = sessionStorage.getItem("cert_admin_id");
    const savedPass = sessionStorage.getItem("cert_admin_pass");
    if (savedId && savedPass) {
      setAdminId(savedId);
      setAdminPass(savedPass);
      // Auto-authenticate with saved credentials
      setIsLoading(true);
      fetch(`/api/generate_certificates?action=courses&adminId=${encodeURIComponent(savedId)}&adminPass=${encodeURIComponent(savedPass)}`)
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
      fetch(`/api/generate_certificates?action=courses&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`)
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

  // const loadCourses = () => {
  //   if (!isAuthenticated) return;
  //   fetch(`/api/generate_certificates?action=courses&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`)
  //     .then((r) => r.json())
  //     .then((d) => setCourses(d.courses || []))
  //     .catch(() => {});
  // };

  const loadCertificates = async () => {
    setLoadingCerts(true);
    try {
      const res = await fetch(`/api/generate_certificates?action=certificates&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`);
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
      const res = await fetch("/api/email", {
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
        const fetchRes = await fetch(`/api/generate_certificates?action=enrollments&course=${encodeURIComponent(courseFilter)}&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`);
        
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

        const res = await fetch("/api/generate_certificates", {
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

  const filteredCerts = certificates.filter((c) => {
    const matchesSearch =
      c.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.certificate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.course_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Default older certificates without a type to "internship"
    const cType = c.certificate_type || "internship";
    const matchesType = historyTypeFilter === "all" || cType === historyTypeFilter;
    
    return matchesSearch && matchesType;
  });

  // ── LOGIN ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="p-8 text-center bg-gradient-to-br from-indigo-500 to-purple-600">
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h1>
            <p className="text-indigo-100 mt-2 text-sm">Secure Certificate Generation</p>
          </div>
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Admin ID</label>
              <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="Enter Admin ID" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <input type="password" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="••••••••" required />
            </div>
            {message && message.type === "error" && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                {message.text}
              </div>
            )}
            <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-50">
              {isLoading ? "Authenticating..." : "Authenticate"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ── DASHBOARD ──
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Certificate Admin</h1>
            <p className="text-slate-500 text-sm mt-1">Generate &amp; manage NLIT certificates</p>
          </div>
          <button onClick={() => { setIsAuthenticated(false); setAdminPass(""); setMessage(null); }} className="text-sm px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">Logout</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl mb-8 w-fit">
          {(["generate", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "generate" ? "🎓 Generate" : "📋 History"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "generate" && (
            <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Certificate Generation System</h2>
                <form onSubmit={handleGenerate} className="space-y-6">
                  {/* Certificate Type Selector */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Certificate Type</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setCertificateType("internship")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
                          certificateType === "internship"
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        🎓 Internship Certificate
                      </button>
                      <button
                        type="button"
                        onClick={() => setCertificateType("workshop")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
                          certificateType === "workshop"
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        🛠 Workshop Certificate
                      </button>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Generation Mode</label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setGenerationMode("bulk")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
                          generationMode === "bulk"
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        📂 Bulk Mode (Paid Enrollments)
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenerationMode("individual")}
                        className={`flex-1 py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
                          generationMode === "individual"
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30"
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
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Course Filter</label>
                        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none">
                          <option value="all">All Courses</option>
                          {courses.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Student IDs or Emails</label>
                        <input
                          type="text"
                          value={studentQuery}
                          onChange={(e) => setStudentQuery(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="e.g. 44, student@email.com"
                          required
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                      <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="DD-MM-YYYY" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                      <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="DD-MM-YYYY" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Issue Date (Optional)</label>
                      <input type="date" value={customIssueDate} onChange={(e) => setCustomIssueDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>

                  {/* Delivery Checkboxes */}
                  <div className="flex flex-wrap gap-6 items-center pt-2">
                    <label className="flex items-center gap-3 cursor-pointer select-none text-sm font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="w-5 h-5 rounded text-indigo-600 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      />
                      📧 Deliver via Email (GoDaddy SMTP)
                    </label>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                      <span>📱 Automatically syncs to Student App (certificates table)</span>
                    </div>
                  </div>

                  {message && (
                    <div className={`p-4 rounded-lg border ${message.type === "success" ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400" : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"}`}>
                      <p className="font-medium">{message.text}</p>
                    </div>
                  )}

                  <button type="submit" disabled={isLoading} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg> Generating...</>
                    ) : generationMode === "bulk" ? "🚀 Generate Batch Certificates" : "🚀 Generate Individual Certificate"}
                  </button>
                </form>
              </div>

              {/* Results Table */}
              {results.length > 0 && (
                <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Generation Results ({results.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Student</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Course</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Cert Number</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Email Delivery</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {results.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                              {r.name}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.course}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">{r.certNumber || "—"}</td>
                            <td className="px-6 py-4">
                              {r.status === "success" ? (
                                <div className="flex flex-col gap-1 items-start">
                                  <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold dark:bg-green-900/30 dark:text-green-400">✅ Success</span>
                                  {r.dbError && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold dark:bg-amber-900/30 dark:text-amber-400" title={r.dbError}>⚠️ DB RLS Bypassed</span>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold dark:bg-red-900/30 dark:text-red-400" title={r.error}>❌ Error</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {sendEmail ? (
                                r.emailSent ? (
                                  <span className="text-green-600 dark:text-green-400 font-semibold text-xs">📧 Delivered</span>
                                ) : (
                                  <span className="text-red-500 dark:text-red-400 font-semibold text-xs">⚠️ Failed</span>
                                )
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 text-xs">Skipped</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {r.cloudinaryUrl && (
                                <a href={r.cloudinaryUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold dark:text-indigo-400">View ↗</a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "history" && (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Issued Certificates ({filteredCerts.length})</h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <select 
                      value={historyTypeFilter} 
                      onChange={(e) => setHistoryTypeFilter(e.target.value)} 
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none w-full sm:w-48"
                    >
                      <option value="all">All Types</option>
                      <option value="internship">Internship</option>
                      <option value="workshop">Workshop</option>
                    </select>
                    <input type="text" placeholder="Search by name, course, or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none w-full sm:w-72" />
                  </div>
                </div>
                {loadingCerts ? (
                  <div className="p-12 text-center"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : filteredCerts.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">No certificates found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Student</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Course</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Cert ID</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Issued</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredCerts.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{c.student_name}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.course_name}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">{c.certificate_number}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.issue_date}</td>
                            <td className="px-6 py-4 flex flex-wrap gap-3">
                              {c.pdf_url && <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold dark:text-indigo-400">View ↗</a>}
                              <a href={`/verify?id=${c.certificate_number}`} target="_blank" className="text-emerald-600 hover:text-emerald-800 text-xs font-bold dark:text-emerald-400">Verify</a>
                              <button 
                                onClick={() => handleSendEmail(c)}
                                disabled={sendingEmailId === c.id}
                                className="text-blue-600 hover:text-blue-800 text-xs font-bold dark:text-blue-400 disabled:opacity-50"
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
  );
}
