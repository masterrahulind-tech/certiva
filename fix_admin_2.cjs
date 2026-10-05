const fs = require('fs');
let c = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

c = c.replace(
  /const \[historyCollegeFilter, setHistoryCollegeFilter\] = useState\("all"\);\s+const uniqueColleges = useMemo\(\(\) => \{\s+const colleges = new Set\(certificates\.map\(c => c\.college_name\)\.filter\(Boolean\)\);\s+return Array\.from\(colleges\)\.sort\(\);\s+\}, \[certificates\]\);/,
  `const [historyClientFilter, setHistoryClientFilter] = useState("all");

  const uniqueClients = useMemo(() => {
    const clients = new Set(certificates.map(c => c.certificate_number ? c.certificate_number.split('-')[0] : 'Unknown').filter(Boolean));
    return Array.from(clients).sort();
  }, [certificates]);`
);

c = c.replace(
  /const cCollege = c\.college_name \|\| "Unknown";\s+const matchesCollege = historyCollegeFilter === "all" \|\| cCollege === historyCollegeFilter;\s+return matchesSearch && matchesType && matchesCollege;/,
  `const cClient = c.certificate_number ? c.certificate_number.split('-')[0] : 'Unknown';
    const matchesClient = historyClientFilter === "all" || cClient === historyClientFilter;

    return matchesSearch && matchesType && matchesClient;`
);

c = c.replace(
  /<select \s+value=\{historyCollegeFilter\} \s+onChange=\{\(e\) => setHistoryCollegeFilter\(e\.target\.value\)\} \s+className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none w-full sm:w-48"\s+>\s+<option value="all">All Colleges<\/option>\s+\{uniqueColleges\.map\(\(col\) => \(\s+<option key=\{col\} value=\{col\}>\{col\}<\/option>\s+\)\)\}\s+<\/select>/,
  `<select 
                      value={historyClientFilter} 
                      onChange={(e) => setHistoryClientFilter(e.target.value)} 
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none w-full sm:w-48"
                    >
                      <option value="all">All Organizations</option>
                      {uniqueClients.map((client) => (
                        <option key={client} value={client}>{client}</option>
                      ))}
                    </select>`
);

c = c.replace(
  '<th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">College</th>',
  '<th className="px-6 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Organization</th>'
);

c = c.replace(
  '<td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.college_name || "Unknown"}</td>',
  '<td className="px-6 py-4 text-slate-600 dark:text-slate-400">{c.certificate_number ? c.certificate_number.split("-")[0] : "Unknown"}</td>'
);

fs.writeFileSync('src/pages/Admin.tsx', c);
