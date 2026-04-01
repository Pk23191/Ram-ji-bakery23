import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import Seo from "../components/Seo";
import SectionHeader from "../components/SectionHeader";
import api from "../utils/api";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token, status: statusQuery } = router.query;
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (statusQuery === "success") {
      setStatus("success");
      return;
    }

    if (!token) return;

    let active = true;

    async function verify() {
      try {
        await api.post("/users/verify-email", { token });
        if (active) {
          setStatus("success");
          toast.success("Email verified successfully");
        }
      } catch (error) {
        if (active) {
          setStatus("error");
          toast.error(error.response?.data?.message || "Verification failed");
        }
      }
    }

    verify();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <>
      <Seo title="Verify Email" description="Verify your Ramji Bakery account email." path="/verify-email" />
      <section className="section-shell py-12">
        <SectionHeader
          eyebrow="Verify email"
          title="Confirming your account"
          description="We are validating your email address so you can access your account."
        />
        <div className="glass-panel mt-10 p-8 text-sm text-mocha/70">
          {status === "loading" && "Verifying your email..."}
          {status === "success" && "Email verified. You can now log in."}
          {status === "error" && "Verification failed. Please request a new link."}
        </div>
      </section>
    </>
  );
}
