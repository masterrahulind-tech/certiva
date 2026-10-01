import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, Award, ShieldCheck, ArrowRight, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

const Home: React.FC = () => {
  const [credentialId, setCredentialId] = useState('');
  const navigate = useNavigate();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentialId.trim()) {
      navigate(`/verify/${credentialId.trim()}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden flex items-center min-h-[85vh]">
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[60%] bg-purple-400/15 rounded-full blur-[100px]" />
           <div className="absolute top-[20%] right-[10%] w-[30%] h-[40%] bg-emerald-400/10 rounded-full blur-[90px]" />
           
           {/* Grid Pattern overlay */}
           <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgyMHYyMEgxVjF6IiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMCwwLDAsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        </div>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 pt-8 lg:pt-0">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex-1 text-center lg:text-left w-full"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-[10px] lg:text-xs font-black uppercase tracking-widest mb-6 lg:mb-8 shadow-sm backdrop-blur-sm">
                 <ShieldCheck size={16} />
                 <span>Official Credential Registry</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.15] mb-5 lg:mb-6">
                Verify Skills with <br className="hidden lg:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Absolute Trust.
                </span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 mb-8 lg:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed px-2 lg:px-0">
                The global standard for digital credentials. Instantly verify authentic certificates, badges, and achievements issued by top institutions worldwide.
              </p>
              
              {/* Massive Search Form */}
              <form onSubmit={handleVerify} className="relative w-full max-w-2xl mx-auto lg:mx-0 shadow-2xl shadow-blue-900/10 rounded-2xl bg-white p-2 border border-slate-100">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 flex items-center w-full">
                    <Search className="absolute left-4 lg:left-5 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      className="w-full pl-12 lg:pl-14 pr-4 py-4 lg:py-5 bg-transparent outline-none font-semibold text-base lg:text-lg text-slate-800 placeholder:text-slate-400"
                      placeholder="Enter Credential ID..." 
                      value={credentialId}
                      onChange={(e) => setCredentialId(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!credentialId.trim()}
                    className="w-full sm:w-auto py-3.5 lg:py-4 px-6 lg:px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-base lg:text-lg rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center justify-center gap-2 group cursor-pointer whitespace-nowrap"
                  >
                    Verify 
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>

              {/* Quick stats/trust markers */}
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 sm:gap-8 opacity-70">
                 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 justify-center">
                    <CheckCircle2 size={16} className="text-emerald-500" /> 100% Tamper-proof
                 </div>
                 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 justify-center">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Blockchain Secured
                 </div>
                 <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 justify-center">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Instant Validation
                 </div>
              </div>
            </motion.div>

            {/* Right Visual/Illustration (abstract cards) */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 hidden lg:block relative w-full h-[500px]"
            >
               {/* Decorative floating certificate cards */}
               <div className="absolute top-[10%] right-[10%] w-[350px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 rotate-6 transform hover:rotate-0 transition-transform duration-500 z-20">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"><Award size={24} /></div>
                     <div>
                        <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 w-20 bg-slate-100 rounded"></div>
                     </div>
                  </div>
                  <div className="h-3 w-full bg-slate-100 rounded mb-3"></div>
                  <div className="h-3 w-5/6 bg-slate-100 rounded mb-8"></div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                     <div className="h-3 w-24 bg-emerald-50 rounded"></div>
                     <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white"></div>
                        <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white"></div>
                     </div>
                  </div>
               </div>

               <div className="absolute top-[30%] left-[5%] w-[320px] bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-100 -rotate-3 transform hover:rotate-0 transition-transform duration-500 z-10">
                  <div className="flex items-center gap-4 mb-4">
                     <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><ShieldCheck size={20} /></div>
                     <div className="h-4 w-28 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-24 w-full bg-slate-50 rounded-xl mb-4"></div>
                  <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Strip */}
      <div className="border-y border-slate-200 bg-white py-8 md:py-10 overflow-hidden">
         <div className="container mx-auto px-4 max-w-6xl mb-6">
            <p className="text-center text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">
               Trusted by Top Institutions & Organizations in India
            </p>
         </div>
         
         <div className="flex w-max animate-marquee opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
            {/* First Set */}
            <div className="flex items-center gap-12 md:gap-16 px-6 md:px-8">
               <div className="flex items-center gap-3">
                 <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/Indian_Institute_of_Technology_Bombay_Logo.svg" alt="IIT Bombay" className="h-10 md:h-14 w-auto object-contain" />
                 <span className="font-bold text-slate-800 text-base md:text-lg hidden md:block">IIT Bombay</span>
               </div>
               <div className="flex items-center gap-3">
                 <img src="https://upload.wikimedia.org/wikipedia/en/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg" alt="IIT Delhi" className="h-10 md:h-14 w-auto object-contain" />
                 <span className="font-bold text-slate-800 text-base md:text-lg hidden md:block">IIT Delhi</span>
               </div>
               <div className="flex items-center gap-3">
                 <img src="https://upload.wikimedia.org/wikipedia/en/e/eb/All_India_Council_for_Technical_Education_logo.png" alt="AICTE" className="h-10 md:h-14 w-auto object-contain" />
                 <span className="font-bold text-slate-800 text-base md:text-lg hidden md:block">AICTE</span>
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://www.skillindiadigital.gov.in/assets/new-ux-img/skill-india-big-logo.svg" alt="Skill India" className="h-10 md:h-14 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://www.india.gov.in/image/npi_logo.svg" alt="India.gov.in" className="h-10 md:h-14 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://internshala.com/static/images/common/new_internshala_logo.svg" alt="Internshala" className="h-8 md:h-10 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://info.credly.com/hubfs/Credly%20by%20Pearson%20Purple_RGB-1.svg" alt="Credly" className="h-8 md:h-10 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://www.nlitedu.com/company/logo.png" alt="NLIT EDU" className="h-10 md:h-12 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://careercue.in/assets/careercue.webp" alt="CareerCue" className="h-8 md:h-10 w-auto object-contain" />
               </div>
            </div>

            {/* Duplicate Set for infinite scroll */}
            <div className="flex items-center gap-12 md:gap-16 px-6 md:px-8">
               <div className="flex items-center gap-3">
                 <img src="https://upload.wikimedia.org/wikipedia/en/1/1d/Indian_Institute_of_Technology_Bombay_Logo.svg" alt="IIT Bombay" className="h-10 md:h-14 w-auto object-contain" />
                 <span className="font-bold text-slate-800 text-base md:text-lg hidden md:block">IIT Bombay</span>
               </div>
               <div className="flex items-center gap-3">
                 <img src="https://upload.wikimedia.org/wikipedia/en/f/fd/Indian_Institute_of_Technology_Delhi_Logo.svg" alt="IIT Delhi" className="h-10 md:h-14 w-auto object-contain" />
                 <span className="font-bold text-slate-800 text-base md:text-lg hidden md:block">IIT Delhi</span>
               </div>
               <div className="flex items-center gap-3">
                 <img src="https://upload.wikimedia.org/wikipedia/en/e/eb/All_India_Council_for_Technical_Education_logo.png" alt="AICTE" className="h-10 md:h-14 w-auto object-contain" />
                 <span className="font-bold text-slate-800 text-base md:text-lg hidden md:block">AICTE</span>
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://www.skillindiadigital.gov.in/assets/new-ux-img/skill-india-big-logo.svg" alt="Skill India" className="h-10 md:h-14 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://www.india.gov.in/image/npi_logo.svg" alt="India.gov.in" className="h-10 md:h-14 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://internshala.com/static/images/common/new_internshala_logo.svg" alt="Internshala" className="h-8 md:h-10 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://info.credly.com/hubfs/Credly%20by%20Pearson%20Purple_RGB-1.svg" alt="Credly" className="h-8 md:h-10 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://www.nlitedu.com/company/logo.png" alt="NLIT EDU" className="h-10 md:h-12 w-auto object-contain" />
               </div>
               <div className="flex items-center gap-3">
                  <img src="https://careercue.in/assets/careercue.webp" alt="CareerCue" className="h-8 md:h-10 w-auto object-contain" />
               </div>
            </div>
         </div>
      </div>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
           <div className="absolute top-20 right-[-10%] w-[30%] h-[50%] bg-blue-100/40 rounded-full blur-[100px]" />
           <div className="absolute bottom-10 left-[-10%] w-[40%] h-[40%] bg-emerald-100/40 rounded-full blur-[120px]" />
        </div>

        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="text-center mb-20">
             <span className="px-4 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-widest inline-block mb-4">
               Why Choose Certiva
             </span>
             <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">The Global Standard for Verification</h2>
             <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
               Certiva provides a seamless, secure, and universally recognized platform to issue, manage, and verify digital credentials with absolute cryptographic certainty.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-100 group"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Real-Time Validation</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Direct integration with official institutional databases ensures that every verification is 100% accurate, tamper-proof, and up-to-date instantly.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-900/10 hover:border-purple-100 group"
            >
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <LayoutDashboard size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Universal Portability</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Easily share verified credentials across LinkedIn, portfolios, and job applications with a single, universally recognized permanent link.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-10 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-900/10 hover:border-emerald-100 group"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Cryptographic Security</h3>
              <p className="text-slate-500 leading-relaxed text-lg">
                Every issued certificate is cryptographically signed, preventing fraud and guaranteeing the absolute integrity of your professional achievements.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default Home;
