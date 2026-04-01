import { useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import { useShop } from "../context/ShopContext";
import api from "../utils/api";

export default function RegisterPage() {
  const router = useRouter();
  const { customerSession, setCustomerSession } = useShop();
  const [formData, setFormData] = useState({
    name: "",
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
      const { data } = await api.post("/auth/signup", formData);
      setCustomerSession({
        ...data.user,
        token: data.token,
        phone: ""
      });
      toast.success("Account created successfully.");
      router.push("/account");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Register" description="Create your Ramji Bakery customer account." path="/register" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Create account"
          title="Save your profile for faster bakery orders"
          description="Register once to manage your profile and check your own order history."
        />
        <form onSubmit={handleSubmit} className="glass-panel mx-auto mt-10 max-w-xl space-y-4 p-6 sm:p-8">
          <input
            className="soft-input"
            placeholder="Full name"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
          />
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
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>
      </section>
    </>
  );
}
