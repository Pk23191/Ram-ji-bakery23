import { Toaster } from "react-hot-toast";
import Footer from "./Footer";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";

export default function Layout({ children }) {
  return (
    <div className="relative overflow-hidden">
      <Navbar />
      <main>{children}</main>
      <Footer />
      <MobileBottomNav />
      <Toaster position="top-right" />
    </div>
  );
}
