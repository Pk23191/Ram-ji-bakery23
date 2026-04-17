import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Seo from "../../components/Seo";
import { useShop } from "../../context/ShopContext";
import api from "../../utils/api";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { setAdminToken, setAdminUser } = useShop();
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setIsLoggingIn(true);
      // Using the dedicated super-login endpoint
      const { data } = await api.post("/admin/super-login", credentials);
      setAdminToken(data.token);
      setAdminUser(data.admin);
      toast.success("Super Admin access granted");
      router.push("/admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Super Admin credentials invalid");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Seo title="Super Admin Login" description="Restricted access for Ramji Bakery Super Admin." path="/admin/super-login" />
      <section className="section-shell py-24 bg-[#0a0a1a] min-h-screen flex items-center">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-5 pointer-events-none"></div>
        <form onSubmit={handleLogin} className="glass-panel mx-auto max-w-lg space-y-6 p-10 border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)]" autoComplete="off">
          <div className="text-center">
            <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">
              Restricted System
            </div>
            <h1 className="font-heading text-4xl text-white">Super Admin Access</h1>
            <p className="mt-2 text-mocha/50 text-sm">Enter master credentials to override system locks.</p>
          </div>
          
          <div className="space-y-4 pt-4">
            <input
              className="soft-input !bg-white/5 !border-white/10 !text-white focus:!border-purple-500/50"
              type="email"
              placeholder="Master Email"
              autoComplete="off"
              value={credentials.email}
              onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="soft-input !bg-white/5 !border-white/10 !text-white focus:!border-purple-500/50"
              type="password"
              placeholder="Master Password"
              autoComplete="new-password"
              value={credentials.password}
              onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <button className="btn-primary w-full !bg-purple-600 hover:!bg-purple-500 shadow-lg shadow-purple-600/20" disabled={isLoggingIn}>
            {isLoggingIn ? "Authorizing..." : "Authenticate"}
          </button>
          
          <p className="text-center text-[10px] text-mocha/30 uppercase tracking-widest">
            Encryption Type: AES-256-GCM
          </p>
        </form>
      </section>
    </>
  );
}
