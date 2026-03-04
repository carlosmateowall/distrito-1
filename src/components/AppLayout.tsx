import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import NoiseOverlay from "./NoiseOverlay";

const AppLayout = () => (
  <div className="min-h-screen bg-background relative">
    <NoiseOverlay />
    <div className="relative z-10">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AppLayout;
