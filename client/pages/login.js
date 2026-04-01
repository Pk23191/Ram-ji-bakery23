import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import { useShop } from "../context/ShopContext";
import api from "../utils/api";

export default function LoginPage() {
  const router = useRouter();
  const { customerSession, setCustomerSession } = useShop();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (customerSession?.token && customerSession?.email) {
    router.replace("/account");
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      const { data } = await api.post("/auth/login", formData);
      setCustomerSession({
        ...data.user,
        token: data.token,
        phone: customerSession?.phone || ""
      });
      toast.success("Logged in successfully");
      router.push("/account");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Login" description="Login to your Ramji Bakery account." path="/login" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Login"
          title="Open your bakery account"
          description="Login securely to view your profile and your own orders."
        />
        <div className="glass-panel mx-auto mt-10 max-w-xl space-y-4 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="soft-input"
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
            />
            <input
              className="soft-input"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
            />
            <button className="btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="flex flex-col gap-2 text-center text-sm text-mocha/70">
            <a href="/forgot-password" className="underline underline-offset-4">
              Forgot password?
            </a>
            <a href="/register" className="underline underline-offset-4">
              Create an account
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
