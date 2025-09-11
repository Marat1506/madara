import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { DashboardContent } from "@/components/DashboardContent";

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false); // Close mobile sidebar on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 relative">
      <DashboardHeader
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className={`${isMobile ? 'hidden' : 'block'}`}>
          <StudentSidebar isMobile={false} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 md:hidden">
              <StudentSidebar
                isMobile={true}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </>
        )}

        <DashboardContent isMobile={isMobile} />
      </div>
    </div>
  );
}
