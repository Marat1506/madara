import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { TeacherManagement } from "@/components/TeacherManagement";
import { ClassManagement } from "@/components/ClassManagement";
import { SchoolManagement } from "@/components/SchoolManagement";
import { StudentManagement } from "@/components/StudentManagement";
import {
  Users,
  GraduationCap,
  Building2,
  UserCheck
} from "lucide-react";


export default function Management() {
  const { t } = useLanguage();

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
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

        <div className={`flex-1 ${isMobile ? 'p-3 safe-area-bottom' : 'p-3 md:p-6'} overflow-y-auto`}>
          {/* Page Header */}
          <div className={`${isMobile ? 'mb-4' : 'mb-4 md:mb-6'}`}>
            <h1 className={`${isMobile ? 'text-xl' : 'text-xl md:text-2xl'} font-bold text-gray-900 ${isMobile ? 'mb-1' : 'mb-2'}`}>
              {t('management')}
            </h1>
            {!isMobile && (
              <p className="text-sm md:text-base text-gray-600">
                Управление системой исламского образования
              </p>
            )}
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="teachers" className="space-y-6">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} ${isMobile ? 'h-auto' : ''}`}>
              <TabsTrigger 
                value="students" 
                className={`flex items-center gap-2 ${isMobile ? 'flex-col text-xs py-3' : ''}`}
              >
                <Users className="h-4 w-4" />
                <span>Ученики</span>
              </TabsTrigger>
              <TabsTrigger
                value="teachers"
                className={`flex items-center gap-2 ${isMobile ? 'flex-col text-xs py-3' : ''}`}
              >
                <UserCheck className="h-4 w-4" />
                <span>Преподаватели</span>
              </TabsTrigger>
              {!isMobile && (
                <>
                  <TabsTrigger value="classes" className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Классы</span>
                  </TabsTrigger>
                  <TabsTrigger value="schools" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Школы</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Mobile additional tabs */}
            {isMobile && (
              <TabsList className="grid w-full grid-cols-2 mt-2">
                <TabsTrigger value="classes" className="flex items-center gap-2 flex-col text-xs py-3">
                  <GraduationCap className="h-4 w-4" />
                  <span>Классы</span>
                </TabsTrigger>
                <TabsTrigger value="schools" className="flex items-center gap-2 flex-col text-xs py-3">
                  <Building2 className="h-4 w-4" />
                  <span>Школы</span>
                </TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="students" className="space-y-6">
              <StudentManagement />
            </TabsContent>

            <TabsContent value="teachers" className="space-y-6">
              <TeacherManagement />
            </TabsContent>

            <TabsContent value="classes" className="space-y-6">
              <ClassManagement />
            </TabsContent>

            <TabsContent value="schools" className="space-y-6">
              <SchoolManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
