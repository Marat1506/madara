import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { StudentCapAvatar } from "@/components/StudentCapAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronRight,
  ChevronDown,
  Users,
  GraduationCap,
  Building2,
  X,
  BookOpen,
  UserCheck
} from "lucide-react";

interface StudentSidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function StudentSidebar({ isMobile = false, onClose }: StudentSidebarProps) {
  const { t } = useLanguage();
  
  // Mock user role - in real app this would come from authentication
  const userRole = "admin"; // "admin" or "teacher"
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    students: true,
    classes: false,
    schools: false
  });

  // Selected class/school state
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  // Supervising class state
  const [supervisingClass, setSupervisingClass] = useState<any>(null);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleClassClick = (classItem: any) => {
    setSelectedClass(classItem);
    setShowClassDetails(true);
  };

  const handleSchoolClick = (school: any) => {
    setSelectedSchool(school);
    setShowSchoolModal(true);
  };

  const handleSupervisingClassSelect = (classItem: any) => {
    setSupervisingClass(classItem);
  };

  const clearSupervisingClass = () => {
    setSupervisingClass(null);
  };

  const allStudents = [
    { name: "Ahmad S", grade: "4" },
    { name: "Fatima A", grade: "3" },
    { name: "Aisha M", grade: "5" },
    { name: "Omar K", grade: "4" },
    { name: "Yusuf H", grade: "2" },
    { name: "Khadija R", grade: "5" },
    { name: "Hassan T", grade: "3" },
    { name: "Maryam I", grade: "4" },
    { name: "Ibrahim N", grade: "3" },
    { name: "Zainab F", grade: "5" },
  ];

  // Filter students based on supervising class
  const students = supervisingClass
    ? allStudents.filter(student => supervisingClass.studentList.includes(student.name))
    : allStudents;

  const classes = [
    {
      id: 1,
      name: "Группа А",
      students: 25,
      subject: "Коран",
      subjects: ["Коран", "Намаз", "Арабский язык"],
      studentList: ["Ahmad S", "Fatima A", "Aisha M", "Omar K", "Yusuf H"]
    },
    {
      id: 2,
      name: "Группа Б",
      students: 20,
      subject: "Намаз",
      subjects: ["Намаз", "Таджвид", "Хадис"],
      studentList: ["Khadija R", "Hassan T", "Maryam I", "Ibrahim N"]
    },
    {
      id: 3,
      name: "Группа В",
      students: 18,
      subject: "Таджвид",
      subjects: ["Таджвид", "Коран", "Исламская этика"],
      studentList: ["Zainab F", "Ahmad S", "Omar K"]
    },
  ];

  const schools = [
    {
      id: 1,
      name: "Медресе №1",
      students: 150,
      teachers: 12,
      teacherList: ["Устаз Ахмад", "Устаз Мухаммад", "Устаз Омар", "Устаз Фатима"]
    },
    {
      id: 2,
      name: "Медресе №2",
      students: 120,
      teachers: 8,
      teacherList: ["Устаз Али", "Устаз Хасан", "Устаз Айша"]
    },
  ];

  return (
    <div className={`${isMobile ? 'w-85 h-full max-w-[85vw]' : 'w-64'} bg-white border-r border-gray-200 h-full overflow-y-auto relative safe-area-left`}>
      {/* Mobile Close Button */}
      {isMobile && onClose && (
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10 safe-area-top">
          <h3 className="font-semibold text-gray-900 text-lg">Навигация</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-11 w-11 p-0 touch-manipulation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      {/* Students Section */}
      <div className="border-b border-gray-200">
        <div className={`${isMobile ? 'p-4' : 'p-3'}`}>
          <button
            onClick={() => toggleSection('students')}
            className={`flex items-center justify-between w-full text-left ${isMobile ? 'py-2' : ''} touch-manipulation`}
          >
            <div className="flex items-center">
              <Users className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2 text-gray-600`} />
              <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>{t('students')}</h3>
              {supervisingClass && (
                <span className={`ml-2 ${isMobile ? 'text-sm' : 'text-xs'} bg-blue-100 text-blue-800 px-2 py-1 rounded-full`}>
                  {supervisingClass.name}
                </span>
              )}
            </div>
            {expandedSections.students ?
              <ChevronDown className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-500`} /> :
              <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-500`} />
            }
          </button>
        </div>
        
        {expandedSections.students && (
          <div className={`${isMobile ? 'pb-4' : 'pb-3'}`}>
            {/* Students List */}
            <div className={`space-y-1 ${isMobile ? 'px-4' : 'px-3'}`}>
              {students.map((student, index) => (
                <div key={index} className={`flex items-center space-x-3 ${isMobile ? 'p-3' : 'p-1'} rounded-lg hover:bg-gray-50 cursor-pointer touch-manipulation transition-colors`}>
                  <StudentCapAvatar name={student.name} size={isMobile ? "md" : "md"} />
                  <div className="flex-1 min-w-0">
                    <div className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-gray-900 truncate`}>{student.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Classes Section */}
      <div className="border-b border-gray-200">
        <div className={`${isMobile ? 'p-4' : 'p-3'}`}>
          <button
            onClick={() => toggleSection('classes')}
            className={`flex items-center justify-between w-full text-left ${isMobile ? 'py-2' : ''} touch-manipulation`}
          >
            <div className="flex items-center">
              <GraduationCap className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2 text-gray-600`} />
              <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>Классы</h3>
            </div>
            {expandedSections.classes ?
              <ChevronDown className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-500`} /> :
              <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-500`} />
            }
          </button>
        </div>

        {expandedSections.classes && (
          <div className={`${isMobile ? 'pb-4' : 'pb-3'}`}>
            {/* Supervising Class Selection */}
            <div className={`${isMobile ? 'px-4 pb-4' : 'px-3 pb-3'} border-b border-gray-100`}>
              <div className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-gray-700 mb-3`}>Курируемый класс:</div>
              {supervisingClass ? (
                <div className={`flex items-center justify-between ${isMobile ? 'p-3' : 'p-2'} bg-blue-50 rounded-lg border border-blue-200`}>
                  <div className="flex items-center space-x-3">
                    <div className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} rounded bg-blue-500 flex items-center justify-center`}>
                      <BookOpen className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} text-white`} />
                    </div>
                    <div>
                      <div className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-blue-900`}>{supervisingClass.name}</div>
                      <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-blue-700`}>{supervisingClass.studentList.length} учеников</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSupervisingClass}
                    className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} p-0 text-blue-600 hover:text-blue-800 touch-manipulation`}
                  >
                    <X className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                  </Button>
                </div>
              ) : (
                <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500 ${isMobile ? 'p-3' : 'p-2'} bg-gray-50 rounded-lg text-center`}>
                  Выберите класс для кураторства
                </div>
              )}
            </div>

            {/* Classes List */}
            <div className={`space-y-2 ${isMobile ? 'px-4 pt-4' : 'px-3 pt-3'}`}>
              {classes.map((classItem, index) => (
                <div key={index} className={`${isMobile ? 'p-3' : 'p-2'} rounded-lg hover:bg-gray-50 transition-colors touch-manipulation`}>
                  <div className="flex items-center space-x-3">
                    <div className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'} rounded-lg bg-blue-100 flex items-center justify-center`}>
                      <BookOpen className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} text-blue-600`} />
                    </div>
                    <div
                      className="flex-1 cursor-pointer touch-manipulation"
                      onClick={() => handleClassClick(classItem)}
                    >
                      <div className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-gray-900`}>{classItem.name}</div>
                      <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500`}>{classItem.students} {t('students')} • {classItem.subjects.length} предметов</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSupervisingClassSelect(classItem);
                      }}
                      className={`${isMobile ? 'h-8 w-16 text-sm' : 'h-6 w-12 text-xs'} px-1 touch-manipulation ${
                        supervisingClass?.id === classItem.id
                          ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                      }`}
                      disabled={supervisingClass?.id === classItem.id}
                    >
                      {supervisingClass?.id === classItem.id ? '✓' : (isMobile ? 'Выбрать' : 'Выбрать')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schools Section - Admin Only */}
      {userRole === "admin" && (
        <div className="border-b border-gray-200">
          <div className={`${isMobile ? 'p-4' : 'p-3'}`}>
            <button
              onClick={() => toggleSection('schools')}
              className={`flex items-center justify-between w-full text-left ${isMobile ? 'py-2' : ''} touch-manipulation`}
            >
              <div className="flex items-center">
                <Building2 className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} mr-2 text-gray-600`} />
                <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>Школы</h3>
              </div>
              {expandedSections.schools ?
                <ChevronDown className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-500`} /> :
                <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-500`} />
              }
            </button>
          </div>

          {expandedSections.schools && (
            <div className={`${isMobile ? 'pb-4' : 'pb-3'}`}>
              {/* Schools List */}
              <div className={`space-y-2 ${isMobile ? 'px-4' : 'px-3'}`}>
                {schools.map((school, index) => (
                  <div
                    key={index}
                    className={`${isMobile ? 'p-3' : 'p-2'} rounded-lg hover:bg-gray-50 cursor-pointer transition-colors touch-manipulation`}
                    onClick={() => handleSchoolClick(school)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'} rounded-lg bg-green-100 flex items-center justify-center`}>
                        <Building2 className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} text-green-600`} />
                      </div>
                      <div className="flex-1">
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-gray-900`}>{school.name}</div>
                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500`}>{school.students} {t('students')} • {school.teachers} {t('teachers')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Class Details Modal */}
      {showClassDetails && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center safe-area-top safe-area-bottom">
          <div className={`bg-white rounded-lg w-full ${isMobile ? 'mx-4 max-w-none' : 'max-w-lg'} max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200`}>
            {/* Simple Header */}
            <div className={`bg-gray-100 ${isMobile ? 'p-4 pb-3' : 'p-4'} rounded-t-lg border-b border-gray-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>{selectedClass.name}</h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'} mt-1`}>Детали класса и информация</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClassDetails(false)}
                  className={`${isMobile ? 'h-11 w-11' : 'h-8 w-8'} p-0 touch-manipulation`}
                >
                  <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                </Button>
              </div>
            </div>

            <div className={`${isMobile ? 'p-4 space-y-5' : 'p-4 space-y-4'}`}>
              {/* Class Information Card */}
              <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-4' : 'p-4'} border border-gray-200`}>
                <h4 className={`${isMobile ? 'text-base' : 'text-base'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-3'} flex items-center`}>
                  <GraduationCap className={`${isMobile ? 'h-5 w-5 mr-3' : 'h-4 w-4 mr-2'} text-gray-600`} />
                  Информация о классе
                </h4>
                <div className="overflow-hidden">
                  <table className={`w-full ${isMobile ? 'text-base' : 'text-sm'}`}>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className={`${isMobile ? 'py-3' : 'py-2'} text-gray-600`}>Количество учеников:</td>
                        <td className={`${isMobile ? 'py-3' : 'py-2'} text-right font-medium text-gray-900`}>{selectedClass.students}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className={`${isMobile ? 'py-3' : 'py-2'} text-gray-600`}>Изучаемых предметов:</td>
                        <td className={`${isMobile ? 'py-3' : 'py-2'} text-right font-medium text-gray-900`}>{selectedClass.subjects.length}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className={`${isMobile ? 'py-3' : 'py-2'} text-gray-600`}>Основной предмет:</td>
                        <td className={`${isMobile ? 'py-3' : 'py-2'} text-right font-medium text-gray-900`}>{selectedClass.subject}</td>
                      </tr>
                      <tr>
                        <td className={`${isMobile ? 'py-3' : 'py-2'} text-gray-600`}>Учебный год:</td>
                        <td className={`${isMobile ? 'py-3' : 'py-2'} text-right font-medium text-gray-900`}>2025-2026</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subjects List */}
              <div>
                <h4 className={`${isMobile ? 'text-base' : 'text-base'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-3'}`}>Изучаемые предметы</h4>
                <div className={`${isMobile ? 'space-y-3' : 'space-y-2'}`}>
                  {selectedClass.subjects.map((subject: string, index: number) => (
                    <div key={index} className={`flex items-center ${isMobile ? 'space-x-4 p-3' : 'space-x-3 p-2'} bg-gray-50 rounded border border-gray-200 touch-manipulation`}>
                      <div className={`${isMobile ? 'w-3 h-3' : 'w-2 h-2'} bg-blue-500 rounded-full`}></div>
                      <span className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-900`}>{subject}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Students List */}
              <div>
                <h4 className={`${isMobile ? 'text-base' : 'text-base'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-3'}`}>Список учеников</h4>
                <div className={`${isMobile ? 'space-y-3 max-h-60' : 'space-y-2 max-h-48'} overflow-y-auto`}>
                  {selectedClass.studentList.map((student: string, index: number) => (
                    <div key={index} className={`flex items-center ${isMobile ? 'space-x-4 p-3' : 'space-x-3 p-2'} bg-gray-50 rounded border border-gray-200 touch-manipulation`}>
                      <StudentCapAvatar name={student} size={isMobile ? "md" : "sm"} />
                      <span className={`${isMobile ? 'text-base' : 'text-sm'} text-gray-900`}>{student}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* School Modal */}
      {showSchoolModal && selectedSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center safe-area-top safe-area-bottom">
          <div className={`bg-white rounded-lg w-full ${isMobile ? 'mx-4 max-w-none' : 'max-w-xl'} max-h-[90vh] overflow-y-auto shadow-lg border border-gray-200`}>
            {/* Simple Header */}
            <div className={`bg-gray-100 ${isMobile ? 'p-4 pb-3' : 'p-4'} rounded-t-lg border-b border-gray-200`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 flex items-center`}>
                    <Building2 className={`${isMobile ? 'h-5 w-5 mr-3' : 'h-5 w-5 mr-2'}`} />
                    <span className="truncate">{selectedSchool.name}</span>
                  </h3>
                  <p className={`text-gray-600 ${isMobile ? 'text-sm' : 'text-sm'} mt-1`}>Исламское образовательное учреждение</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSchoolModal(false)}
                  className={`${isMobile ? 'h-11 w-11 ml-3' : 'h-8 w-8'} p-0 touch-manipulation flex-shrink-0`}
                >
                  <X className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* School Information Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                  <Building2 className="h-4 w-4 mr-2 text-gray-600" />
                  Информация об учреждении
                </h4>
                <div className="overflow-hidden">
                  <table className={`w-full ${isMobile ? 'text-base' : 'text-sm'}`}>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Количество учеников:</td>
                        <td className="py-2 text-right font-medium text-gray-900">{selectedSchool.students}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Преподавателей:</td>
                        <td className="py-2 text-right font-medium text-gray-900">{selectedSchool.teachers}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Классов:</td>
                        <td className="py-2 text-right font-medium text-gray-900">12</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Тип учреждения:</td>
                        <td className="py-2 text-right font-medium text-gray-900">Исламская школа</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Год основания:</td>
                        <td className="py-2 text-right font-medium text-gray-900">2010</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Язык обучения:</td>
                        <td className="py-2 text-right font-medium text-gray-900">Русский, Арабский</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Teachers List */}
              <div>
                <h4 className={`${isMobile ? 'text-base' : 'text-base'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-3'}`}>Педагогический состав</h4>
                <div className={`${isMobile ? 'space-y-3' : 'space-y-2'}`}>
                  {selectedSchool.teacherList.map((teacher: string, index: number) => {
                    const subjects = [['Коран', 'Таджвид'], ['Намаз', 'Хадис'], ['Арабский язык'], ['Основы религии']];
                    const currentSubjects = subjects[index % subjects.length];

                    return (
                      <div key={index} className={`flex items-center ${isMobile ? 'space-x-4 p-4' : 'space-x-3 p-3'} bg-gray-50 rounded border border-gray-200 touch-manipulation`}>
                        <div className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0`}>
                          <UserCheck className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-gray-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-900 truncate`}>{teacher}</div>
                          <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 mt-1`}>
                            Предметы: {currentSubjects.join(', ')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
