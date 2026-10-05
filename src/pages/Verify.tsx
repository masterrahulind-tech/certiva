import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Share2, Download, Award, ShieldCheck, Search, QrCode } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Certificate {
  id: string;
  recipient_name: string;
  course_name: string;
  issuer_name: string;
  issue_date: string;
  expiration_date?: string | null;
  skills: string[];
  status: 'valid' | 'revoked';
  pdf_url?: string;
  preview_url?: string;
}

const Verify: React.FC = () => {
  const { credentialId } = useParams<{ credentialId: string }>();
  const navigate = useNavigate();
  
  const [searchVal, setSearchVal] = useState(credentialId || '');
  const [loading, setLoading] = useState(!!credentialId);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(!!credentialId);
  const [copied, setCopied] = useState(false);

  const fetchCertificate = async (idToFetch: string) => {
    if (!idToFetch.trim()) return;
    
    setLoading(true);
    setSearched(true);
    setError(null);
    setCertificate(null);

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('certificate_number', idToFetch.trim())
        .single();

      if (error || !data) {
         throw new Error('No matching certificate record found. Please verify the ID or format.');
      }

      // Apply the updated Cloudinary path fix used in the mobile app yesterday
      // replacing /certificates_/ with /certificates/
      const realPdfUrl = data.pdf_url?.replace(/\/certificates_?\//, '/certificates/');
      const previewImageUrl = realPdfUrl;

      setCertificate({
        id: data.certificate_number,
        recipient_name: data.student_name,
        course_name: data.course_title,
        issuer_name: 'NLIT EDU (OPC) PVT. LTD.',
        issue_date: data.issue_date,
        skills: ['Certified Professional'],
        status: 'valid',
        pdf_url: realPdfUrl,
        preview_url: previewImageUrl
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred while connecting to the verification database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (credentialId) {
      setSearchVal(credentialId);
      fetchCertificate(credentialId);
    }
  }, [credentialId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/verify/${searchVal.trim()}`);
    }
  };

  const handleCopyLink = () => {
    if (!certificate) return;
    const shareUrl = `${window.location.origin}/verify/${certificate.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header Title */}
        <div className="text-center mb-12">
          <span className="px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest inline-block mb-4">
            Certiva Security Ledger
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight mb-4 m-0">
            Certificate Verification Portal
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-lg">
            Verify the authenticity and status of academic credentials and certificates issued by NLIT EDU (OPC) PVT. LTD.
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl mb-12 backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -z-10" />

          <h2 className="text-xl font-bold text-black mb-6 flex items-center gap-2.5">
            <QrCode className="text-blue-600 text-2xl" />
            Enter Certificate Credentials
          </h2>

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl" />
              <input
                type="text"
                placeholder="e.g. NLIT-2026-1001 or Enrollment UUID"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-semibold text-black focus:border-blue-600 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchVal.trim()}
              className="py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 border-none cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                  Verifying...
                </>
              ) : (
                "Verify Certificate"
              )}
            </button>
          </form>

          <p className="text-xs text-slate-400 mt-4 leading-relaxed m-0">
            * Note: Certificates scanned via QR codes will automatically populate the credentials. Recruiter inquiries can also verify status by student registration UUID.
          </p>
        </div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-slate-500 font-bold animate-pulse">
                Querying security ledger nodes...
              </p>
            </motion.div>
          )}

          {!loading && searched && certificate && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="print-section"
            >
              {/* Premium Verification Badge */}
              <div className="bg-white border-2 border-green-500/30 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
                {/* Header status bar */}
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-6 md:px-8 md:py-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-4">
                  <div className="flex items-center gap-4 md:gap-3">
                    <CheckCircle className="text-4xl shrink-0" />
                    <div>
                      <h3 className="font-black text-lg md:text-xl tracking-tight uppercase m-0 leading-tight">Credential Verified</h3>
                      <p className="text-xs md:text-sm text-green-100 m-0 mt-0.5">Secured & registered in NLIT registry</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-2 justify-start md:justify-end">
                    {certificate.pdf_url && (
                      <a
                        href={certificate.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none justify-center px-4 py-2.5 md:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs md:text-sm font-extrabold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/30 border border-emerald-500/20 no-underline"
                      >
                        <Download size={16} /> Download PDF
                      </a>
                    )}
                    <button
                      onClick={handleCopyLink}
                      className="flex-1 md:flex-none justify-center px-4 py-2.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer border-none text-white"
                    >
                      {copied ? <CheckCircle size={16} /> : <Share2 size={16} />}
                      {copied ? "Copied!" : "Share Link"}
                    </button>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://certiva.careercue.in/verify/${certificate.certificate_number}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 md:flex-none justify-center px-4 py-2.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer border-none text-white no-underline"
                    >
                      <FaLinkedin size={16} /> Share
                    </a>
                    <button
                      onClick={handlePrint}
                      className="flex-1 md:flex-none justify-center px-4 py-2.5 md:py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer border-none text-white"
                    >
                      Print
                    </button>
                  </div>
                </div>

                {/* Details layout */}
                <div className="p-8 md:p-10 space-y-8">
                  {/* Student Name */}
                  <div className="border-b border-slate-100 pb-6 text-center sm:text-left">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 m-0">
                      Certified Candidate
                    </p>
                    <h2 className="text-3xl font-black text-black m-0">
                      {certificate.recipient_name}
                    </h2>
                  </div>

                  {/* Core Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Award className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">
                          Course Program
                        </p>
                        <p className="font-bold text-slate-800 mt-0.5 m-0">
                          {certificate.course_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <ShieldCheck className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider m-0">
                          Issuing Institution
                        </p>
                        <p className="font-bold text-slate-800 mt-0.5 m-0">
                          {certificate.issuer_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer status card details */}
                  <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left bg-slate-50 p-6 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">
                        Verification ID
                      </p>
                      <p className="text-sm font-black text-slate-800 font-mono mt-0.5 select-all m-0">
                        {certificate.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">
                        Date of Issue
                      </p>
                      <p className="text-sm font-black text-slate-800 mt-0.5 m-0">
                        {certificate.issue_date}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider m-0">
                        Status
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 mt-0.5 uppercase m-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse block" />
                        ACTIVE
                      </span>
                    </div>
                  </div>

                  {/* Certificate Image Preview */}
                  {certificate.preview_url && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="mt-8 pt-8 border-t border-slate-100"
                    >
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 m-0 text-center sm:text-left">Certificate Preview</p>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xl group relative bg-slate-50">
                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-500 z-10 pointer-events-none" />
                        <motion.img 
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.4 }}
                          src={certificate.preview_url} 
                          alt={`Certificate for ${certificate.recipient_name}`} 
                          className="w-full h-auto block transform origin-center" 
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {!loading && searched && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white border-2 border-red-500/20 p-8 rounded-3xl shadow-xl text-center mt-12"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="text-4xl text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-black mb-2 m-0">
                Verification Failed
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Verify;
