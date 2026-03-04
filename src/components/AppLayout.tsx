import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import NoiseOverlay from "./NoiseOverlay";

const AppLayout = () => (
  <div className="min-h-screen bg-background relative">
    <NoiseOverlay />
    <div className="relative z-10">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  </div>
);

export default AppLayout;
