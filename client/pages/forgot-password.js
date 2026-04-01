import { useState } from "react";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import api from "../utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await api.post("/users/password/forgot", { email });
      toast.success("Password reset email sent");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to send reset email");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Forgot Password" description="Reset your Ramji Bakery account password." path="/forgot-password" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Forgot password"
          title="Recover your bakery account"
          description="We will send you a secure reset link to update your password."
        />
        <form onSubmit={handleSubmit} className="glass-panel mx-auto mt-10 max-w-xl space-y-4 p-6 sm:p-8">
          <input
            className="soft-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </section>
    </>
  );
}
