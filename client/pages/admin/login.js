import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Seo from "../../components/Seo";
import { useShop } from "../../context/ShopContext";
import api from "../../utils/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdminToken, setAdminUser } = useShop();
  const [credentials, setCredentials] = useState({ email: "admin@ramjibakery.in", password: "admin123" });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setIsLoggingIn(true);
      const { data } = await api.post("/admin/login", credentials);
      setAdminToken(data.token);
      setAdminUser(data.admin);
      toast.success("Admin login successful");
      router.push("/admin");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to login");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Seo title="Admin Login" description="Admin login for Ramji Bakery dashboard." path="/admin/login" />
      <section className="section-shell py-16">
        <form onSubmit={handleLogin} className="glass-panel mx-auto max-w-lg space-y-5 p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-caramel">Admin access</p>
            <h1 className="mt-3 font-heading text-4xl text-cocoa">Manage products and orders</h1>
          </div>
          <input
            className="soft-input"
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
          />
          <input
            className="soft-input"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
          />
          <button className="btn-primary w-full" disabled={isLoggingIn}>
            {isLoggingIn ? "Signing in..." : "Login"}
          </button>
        </form>
      </section>
    </>
  );
}
