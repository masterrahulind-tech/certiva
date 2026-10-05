const fs = require('fs');
let c = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const helper = `
const getOrgName = (prefix: string) => {
  if (prefix === 'NLIT' || prefix === 'NLITW') return 'NLIT EDU (OPC) PVT. LTD.';
  if (prefix === 'CCUE') return 'Careercue';
  return prefix;
};
`;

// Insert the helper right after the imports
if (!c.includes('const getOrgName =')) {
  c = c.replace('import { supabase } from \'../lib/supabase\';', 'import { supabase } from \'../lib/supabase\';\n' + helper);
}

// Update fetchStats
const fetchStatsRegex = /const orgName = prefix === 'NLIT' \? 'NLIT EDU \(OPC\) PVT\. LTD\.' : [\s\S]*?prefix;/;
c = c.replace(fetchStatsRegex, 'const orgName = getOrgName(prefix);');

// Update uniqueClients mapping
const uniqueClientsRegex = /const clients = new Set\(certificates\.map\(c => c\.certificate_number \? c\.certificate_number\.split\('-'\)\[0\] : 'Unknown'\)\.filter\(Boolean\)\);/;
c = c.replace(uniqueClientsRegex, 'const clients = new Set(certificates.map(c => c.certificate_number ? getOrgName(c.certificate_number.split(\'-\')[0]) : \'Unknown\').filter(Boolean));');

// Update filteredCerts logic
const filteredCertsRegex = /const cClient = c\.certificate_number \? c\.certificate_number\.split\('-'\)\[0\] : 'Unknown';/;
c = c.replace(filteredCertsRegex, 'const cClient = c.certificate_number ? getOrgName(c.certificate_number.split(\'-\')[0]) : \'Unknown\';');

// Update the ledger table column
const tableColRegex = /<td className="px-6 py-4 text-slate-600">\{c\.certificate_number \? c\.certificate_number\.split\("-"\)\[0\] : "Unknown"\}<\/td>/;
c = c.replace(tableColRegex, '<td className="px-6 py-4 text-slate-600">{c.certificate_number ? getOrgName(c.certificate_number.split("-")[0]) : "Unknown"}</td>');

fs.writeFileSync('src/pages/Admin.tsx', c);
