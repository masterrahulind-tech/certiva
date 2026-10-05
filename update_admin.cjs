const fs = require('fs');
let c = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

c = c.replaceAll('fetch(`${API_BASE}/api/generate_certificates?action=courses&adminId=${encodeURIComponent(savedId)}&adminPass=${encodeURIComponent(savedPass)}`)', 'fetch(`${API_BASE}/api/generate_certificates?action=courses&adminId=${encodeURIComponent(savedId)}&adminPass=${encodeURIComponent(savedPass)}&firebaseToken=${encodeURIComponent(sessionStorage.getItem("firebaseToken") || "")}`)');
c = c.replaceAll('fetch(`${API_BASE}/api/generate_certificates?action=courses&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`)', 'fetch(`${API_BASE}/api/generate_certificates?action=courses&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}&firebaseToken=${encodeURIComponent(sessionStorage.getItem("firebaseToken") || "")}`)');
c = c.replaceAll('fetch(`${API_BASE}/api/generate_certificates?action=certificates&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`)', 'fetch(`${API_BASE}/api/generate_certificates?action=certificates&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}&firebaseToken=${encodeURIComponent(sessionStorage.getItem("firebaseToken") || "")}`)');
c = c.replaceAll('fetch(`${API_BASE}/api/generate_certificates?action=enrollments&course=${encodeURIComponent(courseFilter)}&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}`)', 'fetch(`${API_BASE}/api/generate_certificates?action=enrollments&course=${encodeURIComponent(courseFilter)}&adminId=${encodeURIComponent(adminId)}&adminPass=${encodeURIComponent(adminPass)}&firebaseToken=${encodeURIComponent(sessionStorage.getItem("firebaseToken") || "")}`)');

const googleLoginFn = `const handleGoogleLogin = async () => {
  try {
    const result = await signInWithGoogle();
    const token = await result.user.getIdToken();
    sessionStorage.setItem("firebaseToken", token);
    setIsLoading(true);
    fetch(\`\${API_BASE}/api/generate_certificates?action=courses&firebaseToken=\${encodeURIComponent(token)}\`)
    .then((r) => {
      if (r.ok) {
        setIsAuthenticated(true);
        return r.json();
      } else {
        throw new Error("Unauthorized Google Account.");
      }
    })
    .then((d) => setCourses(d.courses || []))
    .catch((err) => {
      setMessage({ type: "error", text: err.message || "Failed to authenticate with Google." });
    })
    .finally(() => {
      setIsLoading(false);
    });
  } catch (error) {
    console.error(error);
    setMessage({ type: "error", text: "Google Sign-In failed." });
  }
};

const handleLogin = (e: React.FormEvent) => {`;

c = c.replace('const handleLogin = (e: React.FormEvent) => {', googleLoginFn);

const googleBtn = `</form>

          <div className="mt-4 flex items-center justify-center">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="px-4 text-sm text-slate-400">OR</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>`;

c = c.replace('</form>', googleBtn);

fs.writeFileSync('src/pages/Admin.tsx', c);
console.log("Updated!");
