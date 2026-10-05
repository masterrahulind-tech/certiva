const fs = require('fs');
let c = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

if (!c.includes('import { useState, useEffect, useMemo } from "react";')) {
  c = c.replace(
    'import { useState, useEffect } from "react";',
    'import { useState, useEffect, useMemo } from "react";'
  );
}

c = c.replace(
  /const \[historyTypeFilter, setHistoryTypeFilter\] = useState\("all"\);\s+const filteredCerts = certificates\.filter\(\(c\) => {/,
  `const [historyTypeFilter, setHistoryTypeFilter] = useState("all");
  const [historyOrgFilter, setHistoryOrgFilter] = useState("all");

  const uniqueOrgs = useMemo(() => {
    const orgs = new Set(certificates.map(c => c.college_name).filter(Boolean));
    return Array.from(orgs).sort();
  }, [certificates]);

  const filteredCerts = certificates.filter((c) => {`
);

c = c.replace(
  /const cType = c\.certificate_type \|\| "internship";\s+const matchesType = historyTypeFilter === "all" \|\| cType === historyTypeFilter;\s+return matchesSearch && matchesType;\s+}\);/,
  `const cType = c.certificate_type || "internship";
    const matchesType = historyTypeFilter === "all" || cType === historyTypeFilter;
    
    const cOrg = c.college_name || "Unknown";
    const matchesOrg = historyOrgFilter === "all" || cOrg === historyOrgFilter;

    return matchesSearch && matchesType && matchesOrg;
  });`
);

const ledgerHtml = `          )}

          {tab === "history" && (
            <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Global Ledger ({filteredCerts.length})</h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <select 
                      value={historyOrgFilter} 
                      onChange={(e) => setHistoryOrgFilter(e.target.value)} 
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none w-full sm:w-48"
                    >
                      <option value="all">All Organizations</option>
                      {uniqueOrgs.map((org) => (
                        <option key={org} value={org}>{org}</option>
                      ))}
                    </select>
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
                          <th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Organization</th>
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
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.college_name || "Unknown"}</td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-700 dark:text-slate-300">{c.certificate_number}</td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.issue_date}</td>
                            <td className="px-6 py-4 flex flex-wrap gap-3">
                              {c.pdf_url && <a href={c.pdf_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-xs font-bold dark:text-indigo-400">View ↗</a>}
                              <a href={\`/verify?id=\${c.certificate_number}\`} target="_blank" className="text-emerald-600 hover:text-emerald-800 text-xs font-bold dark:text-emerald-400">Verify</a>
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

        </AnimatePresence>`;

c = c.replace(/          \)\}\s+<\/AnimatePresence>/, ledgerHtml);

fs.writeFileSync('src/pages/Admin.tsx', c);
