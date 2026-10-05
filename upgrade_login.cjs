const fs = require('fs');
let c = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const loginRegex = /if \(!isAuthenticated\) \{\s+return \(\s+<div className="min-h-screen[\s\S]*?<\/div>\s+\);\s+\}/;

const newLogin = `if (!isAuthenticated) {
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
  }`;

c = c.replace(loginRegex, newLogin);

fs.writeFileSync('src/pages/Admin.tsx', c);
