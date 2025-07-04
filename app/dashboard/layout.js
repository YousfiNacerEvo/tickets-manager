import Sidebar from "./components/Sidebar";
import AuthGuard from "../components/AuthGuard";

export default function DashboardLayout({ children }) {
  return (
   
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
   
  );
} 