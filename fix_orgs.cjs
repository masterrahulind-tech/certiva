const fs = require('fs');
let c = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const fetchStatsRegex = /const fetchStats = async \(\) => \{[\s\S]*?fetchStats\(\);/m;

const newFetchStats = `const fetchStats = async () => {
    const { data } = await supabase.from('certificates').select('*');
    if (data) {
      const orgMap = new Map();
      let totalPremium = 0;
      
      data.forEach((cert) => {
        const isPremium = cert.grade === 'Premium' || cert.certificate_type === 'premium';
        if (isPremium) totalPremium++;
        
        const prefix = cert.certificate_number ? cert.certificate_number.split('-')[0] : 'Unknown';
        const orgName = prefix === 'NLIT' ? 'NLIT EDU (OPC) PVT. LTD.' : 
                       prefix === 'CCUE' ? 'Careercue' : prefix;
        
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
  fetchStats();`;

c = c.replace(fetchStatsRegex, newFetchStats);

const orgTabRegex = /\{tab === "organizations" && \([\s\S]*?<\/motion\.div>\s+\)\}/;

const newOrgTab = `{tab === "organizations" && (
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
          )}`;

c = c.replace(orgTabRegex, newOrgTab);

fs.writeFileSync('src/pages/Admin.tsx', c);
