import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import api from "../utils/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/users/password/reset", {
        token,
        password
      });
      toast.success("Password updated successfully");
      router.push("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Seo title="Reset Password" description="Set a new password for your Ramji Bakery account." path="/reset-password" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Reset password"
          title="Choose a new password"
          description="Enter a new password to regain access to your bakery account."
        />
        <form onSubmit={handleSubmit} className="glass-panel mx-auto mt-10 max-w-xl space-y-4 p-6 sm:p-8">
          <input
            className="soft-input"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>
    </>
  );
}
