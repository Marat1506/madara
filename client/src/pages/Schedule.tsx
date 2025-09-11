import { DashboardHeader } from "@/components/DashboardHeader";
import { StudentSidebar } from "@/components/StudentSidebar";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Users, BookOpen, ChevronLeft, ChevronRight, Edit2, Save, X, Filter, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Schedule() {
  const { t } = useLanguage();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
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
  const [editingCell, setEditingCell] = useState<{day: number, classId: number} | null>(null);
  const [editTime, setEditTime] = useState("");
  const [addingClass, setAddingClass] = useState<{day: number, timeSlot: string} | null>(null);
  const [newClassData, setNewClassData] = useState({
    subject: "",
    class: "",
    teacher: "",
    room: "",
    time: ""
  });
  const [scheduleData, setScheduleData] = useState([
    {
      day: "Понедельник",
      date: "15 янв",
      classes: [
        { id: 1, time: "08:00-09:30", subject: "Коран", class: "Группа А", teacher: "Устаз Ахмад", room: "Аудитория 1" },
        { id: 2, time: "10:00-11:30", subject: "Намаз", class: "Группа Б", teacher: "Устаз Мухаммад", room: "Аудитория 2" },
        { id: 3, time: "12:00-13:30", subject: "Таджвид", class: "Группа В", teacher: "Устаз Омар", room: "Аудитория 3" },
        { id: 4, time: "14:00-15:30", subject: "Хадис", class: "Группа А", teacher: "Устаз Фатима", room: "Аудитория 1" },
      ]
    },
    {
      day: "Вторник", 
      date: "16 янв",
      classes: [
        { id: 5, time: "08:00-09:30", subject: "Арабский язык", class: "Группа Б", teacher: "Устаз Али", room: "Аудитория 2" },
        { id: 6, time: "10:00-11:30", subject: "Коран", class: "Группа В", teacher: "Устаз Ахмад", room: "Аудитория 1" },
        { id: 8, time: "14:00-15:30", subject: "Таджвид", class: "Группа Б", teacher: "Устаз Омар", room: "Аудитория 2" },
      ]
    },
    {
      day: "Среда",
      date: "17 янв", 
      classes: [
        { id: 9, time: "08:00-09:30", subject: "Намаз", class: "Группа А", teacher: "Устаз Мухаммад", room: "Аудитория 1" },
        { id: 10, time: "10:00-11:30", subject: "Хадис", class: "Группа В", teacher: "Устаз Фатима", room: "Аудитория 3" },
        { id: 11, time: "12:00-13:30", subject: "Коран", class: "Группа Б", teacher: "Устаз Ахмад", room: "Аудитория 2" },
        { id: 12, time: "14:00-15:30", subject: "Арабский язык", class: "Группа А", teacher: "Устаз Али", room: "Аудитория 1" },
      ]
    },
    {
      day: "Четверг",
      date: "18 янв",
      classes: [
        { id: 13, time: "08:00-09:30", subject: "Таджвид", class: "Группа А", teacher: "Устаз Омар", room: "Аудитория 1" },
        { id: 15, time: "12:00-13:30", subject: "Намаз", class: "Группа В", teacher: "Устаз Мухаммад", room: "Аудитория 3" },
        { id: 16, time: "14:00-15:30", subject: "Коран", class: "Группа А", teacher: "Устаз Ахмад", room: "Аудитория 1" },
      ]
    },
    {
      day: "Пятница",
      date: "19 янв",
      classes: [
        { id: 17, time: "08:00-09:30", subject: "Хадис", class: "Группа Б", teacher: "Устаз Фатима", room: "Аудитория 2" },
        { id: 18, time: "10:00-11:30", subject: "Арабский язык", class: "Группа В", teacher: "Устаз Али", room: "Аудитория 3" },
        { id: 19, time: "12:00-13:30", subject: "Джума-намаз", class: "Все группы", teacher: "Имам", room: "Мечеть" },
      ]
    },
    {
      day: "Суббота",
      date: "20 янв",
      isWeekend: true,
      classes: [
        { id: 20, time: "10:00-11:30", subject: "Коран (доп.)", class: "Группа А", teacher: "Устаз Ахмад", room: "Аудитория 1" },
      ]
    },
    {
      day: "Воскресенье",
      date: "21 янв",
      isWeekend: true,
      classes: []
    }
  ]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  const timeSlots = ["08:00-09:30", "10:00-11:30", "12:00-13:30", "14:00-15:30"];
  
  // Smooth week navigation
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    if (tableRef.current) {
      tableRef.current.style.transform = `translateX(${direction === 'next' ? '-100%' : '100%'})`;
      tableRef.current.style.opacity = '0.3';
      
      setTimeout(() => {
        setCurrentWeek(prev => direction === 'next' ? prev + 1 : prev - 1);
        if (tableRef.current) {
          tableRef.current.style.transform = `translateX(${direction === 'next' ? '100%' : '-100%'})`;
        }
        
        setTimeout(() => {
          if (tableRef.current) {
            tableRef.current.style.transition = 'all 0.3s ease-in-out';
            tableRef.current.style.transform = 'translateX(0)';
            tableRef.current.style.opacity = '1';
          }
          
          setTimeout(() => {
            if (tableRef.current) {
              tableRef.current.style.transition = '';
            }
            setIsAnimating(false);
          }, 300);
        }, 50);
      }, 150);
    }
  };
  
  // Time editing functions
  const handleEditTime = (dayIndex: number, classId: number, currentTime: string) => {
    setEditingCell({ day: dayIndex, classId });
    setEditTime(currentTime);
  };
  
  const handleSaveTime = () => {
    if (!editingCell) return;

    setScheduleData(prev => prev.map((day, dayIndex) => {
      if (dayIndex === editingCell.day) {
        return {
          ...day,
          classes: day.classes.map(cls =>
            cls.id === editingCell.classId
              ? { ...cls, time: editTime }
              : cls
          )
        };
      }
      return day;
    }));

    setEditingCell(null);
    setEditTime("");
  };
  
  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditTime("");
  };

  // Add new class functions
  const handleAddClass = (dayIndex: number, timeSlot: string) => {
    setAddingClass({ day: dayIndex, timeSlot });
    setNewClassData({
      subject: "",
      class: "",
      teacher: "",
      room: "",
      time: timeSlot
    });
  };

  const handleSaveNewClass = () => {
    if (!addingClass || !newClassData.subject || !newClassData.class) return;

    const newClass = {
      id: Math.max(...scheduleData.flatMap(day => day.classes.map(cls => cls.id))) + 1,
      ...newClassData
    };

    setScheduleData(prev => prev.map((day, dayIndex) => {
      if (dayIndex === addingClass.day) {
        return {
          ...day,
          classes: [...day.classes, newClass]
        };
      }
      return day;
    }));

    setAddingClass(null);
    setNewClassData({ subject: "", class: "", teacher: "", room: "", time: "" });
  };

  const handleCancelAddClass = () => {
    setAddingClass(null);
    setNewClassData({ subject: "", class: "", teacher: "", room: "", time: "" });
  };
  
  // Get filtered schedule data
  const getFilteredScheduleData = () => {
    return scheduleData.map(day => ({
      ...day,
      classes: day.classes.filter(cls => {
        return (
          (selectedTeacher === "" || cls.teacher === selectedTeacher) &&
          (selectedSubject === "" || cls.subject === selectedSubject) &&
          (selectedClass === "" || cls.class === selectedClass)
        );
      })
    }));
  };
  
  const filteredScheduleData = getFilteredScheduleData();
  
  // Calculate statistics
  const totalClasses = filteredScheduleData.reduce((sum, day) => sum + day.classes.length, 0);
  const uniqueTeachers = new Set(filteredScheduleData.flatMap(day => day.classes.map(cls => cls.teacher))).size;
  const uniqueSubjects = new Set(filteredScheduleData.flatMap(day => day.classes.map(cls => cls.subject))).size;
  const dailyHours = totalClasses * 1.5; // 1.5 hours per class

  const getClassForTimeSlot = (day: any, time: string) => {
    return day.classes.find((cls: any) => cls.time === time);
  };
  
  // Islamic subjects for schedule creation
  const islamicSubjects = [
    "Коран", "Намаз", "Таджвид", "Хадис", "Муалим Санни",
    "Основы религии", "Дуа и Азкары", "Алиф-Ба", "Табарак-джуз", "Амма джуз"
  ];

  // Get unique values for filters
  const allTeachers = [...new Set(scheduleData.flatMap(day => day.classes.map(cls => cls.teacher)))];
  const currentSubjects = [...new Set(scheduleData.flatMap(day => day.classes.map(cls => cls.subject)))];
  const allSubjects = [...new Set([...islamicSubjects, ...currentSubjects])];
  const allClasses = [...new Set(scheduleData.flatMap(day => day.classes.map(cls => cls.class)))];

  const availableTeachers = [
    "Устаз Ахмад", "Устаз Мухаммад", "Устаз Омар", "Устаз Фатима",
    "Устаз Али", "Устаз Хасан", "Устаз Айша", "Имам"
  ];

  const availableClasses = ["Группа А", "Группа Б", "Группа В", "Все группы"];
  const availableRooms = ["Аудитория 1", "Аудитория 2", "Аудитория 3", "Мечеть"];

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      "Коран": "bg-green-100 text-green-800 border-green-200",
      "Намаз": "bg-blue-100 text-blue-800 border-blue-200",
      "Таджвид": "bg-purple-100 text-purple-800 border-purple-200",
      "Хадис": "bg-orange-100 text-orange-800 border-orange-200",
      "Арабский язык": "bg-indigo-100 text-indigo-800 border-indigo-200",
      "Джума-намаз": "bg-yellow-100 text-yellow-800 border-yellow-200"
    };
    return colors[subject] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

        <main className={`flex-1 ${isMobile ? 'p-3 safe-area-bottom' : 'p-6'} overflow-y-auto`}>
          {/* Header */}
          <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 ${isMobile ? 'mb-1' : 'mb-2'}`}>Расписание занятий</h1>
            {!isMobile && <p className="text-gray-600">Просмотр и управление расписанием занятий</p>}
          </div>

          {/* Schedule Card with integrated statistics and filters */}
          <Card className={`${isMobile ? 'shadow-sm' : ''}`}>
            <CardHeader className={`${isMobile ? 'p-4' : ''}`}>
              <CardTitle className={`flex items-center ${isMobile ? 'text-base' : 'text-lg'}`}>
                <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`} />
                Расписание на неделю
              </CardTitle>
            </CardHeader>
            
            <CardContent className={`${isMobile ? 'space-y-3 p-4' : 'space-y-4'}`}>
              {/* Combined Filters and Statistics Block */}
              <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'} border border-gray-200`}>
                <div className={`flex flex-col ${isMobile ? 'space-y-3' : 'space-y-4'}`}>
                  {/* Statistics Section */}
                  <div className={`bg-white rounded-lg ${isMobile ? 'p-3' : 'p-3'} border border-gray-200`}>
                    <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'} text-center`}>
                      <div className="flex flex-col items-center">
                        <BookOpen className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600 mb-1`} />
                        <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>{totalClasses}</div>
                        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 leading-tight`}>Занятий в неделю</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <Users className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-green-600 mb-1`} />
                        <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>{uniqueTeachers}</div>
                        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 leading-tight`}>Преподавателей</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-purple-600 mb-1`} />
                        <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>{uniqueSubjects}</div>
                        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 leading-tight`}>Предметов</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <Clock className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-orange-600 mb-1`} />
                        <div className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900`}>{dailyHours}</div>
                        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 leading-tight`}>Часов в неделю</div>
                      </div>
                    </div>
                  </div>

                  {/* Filters Section */}
                  <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
                    <div className={`${isMobile ? 'space-y-3' : 'flex items-center space-x-3'}`}>
                      <div className="flex items-center space-x-2">
                        <Filter className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'} text-gray-500`} />
                        <span className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700`}>Фильтры:</span>
                      </div>

                      <div className={`${isMobile ? 'grid grid-cols-1 gap-3' : 'flex space-x-3'}`}>
                        <select
                          value={selectedTeacher}
                          onChange={(e) => setSelectedTeacher(e.target.value)}
                          className={`${isMobile ? 'text-sm px-3 py-2 h-11' : 'text-xs px-2 py-1'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${isMobile ? 'touch-manipulation' : ''}`}
                        >
                          <option value="">Все преподаватели</option>
                          {allTeachers.map(teacher => (
                            <option key={teacher} value={teacher}>{teacher}</option>
                          ))}
                        </select>

                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className={`${isMobile ? 'text-sm px-3 py-2 h-11' : 'text-xs px-2 py-1'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${isMobile ? 'touch-manipulation' : ''}`}
                        >
                          <option value="">Все предметы</option>
                          {allSubjects.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                          ))}
                        </select>

                        <select
                          value={selectedClass}
                          onChange={(e) => setSelectedClass(e.target.value)}
                          className={`${isMobile ? 'text-sm px-3 py-2 h-11' : 'text-xs px-2 py-1'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${isMobile ? 'touch-manipulation' : ''}`}
                        >
                          <option value="">Все группы</option>
                          {allClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>

                        {(selectedTeacher || selectedSubject || selectedClass) && (
                          <Button
                            variant="outline"
                            size={isMobile ? "default" : "sm"}
                            onClick={() => {
                              setSelectedTeacher("");
                              setSelectedSubject("");
                              setSelectedClass("");
                            }}
                            className={`${isMobile ? 'h-11 px-4 text-sm touch-manipulation' : 'h-6 text-xs'}`}
                          >
                            Сбросить
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Week Navigation */}
                    <div className={`flex items-center ${isMobile ? 'justify-center space-x-4' : 'space-x-2'}`}>
                      <button
                        onClick={() => navigateWeek('prev')}
                        disabled={isAnimating}
                        className={`${isMobile ? 'p-3 h-11 w-11' : 'p-1'} text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors touch-manipulation rounded-lg hover:bg-gray-100`}
                      >
                        <ChevronLeft className={`${isMobile ? 'h-5 w-5' : 'h-3 w-3'}`} />
                      </button>
                      <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 ${isMobile ? 'min-w-[80px]' : 'min-w-[60px]'} text-center font-medium`}>
                        Неделя {Math.abs(currentWeek) + 1}
                      </span>
                      <button
                        onClick={() => navigateWeek('next')}
                        disabled={isAnimating}
                        className={`${isMobile ? 'p-3 h-11 w-11' : 'p-1'} text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors touch-manipulation rounded-lg hover:bg-gray-100`}
                      >
                        <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-3 w-3'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule Table */}
              <div className="overflow-x-auto">
                {isMobile && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                    <p className="text-sm text-blue-700 text-center font-medium">Проведите пальцем для просмотра расписания</p>
                  </div>
                )}
                <div
                  ref={tableRef}
                  className="transition-all duration-300 ease-in-out"
                >
                  <table className={`w-full border-collapse border border-gray-300 ${isMobile ? 'text-sm' : ''}`}>
                    <thead>
                      <tr>
                        <th className={`border border-gray-300 ${isMobile ? 'p-3' : 'p-2'} bg-gray-50 text-center font-medium text-gray-700 ${isMobile ? 'text-sm min-w-[90px]' : 'text-sm min-w-[100px]'}`}>
                          Время
                        </th>
                        {filteredScheduleData.map((day, index) => (
                          <th key={index} className={`border border-gray-300 ${isMobile ? 'p-3' : 'p-2'} ${day.isWeekend ? 'bg-red-100' : 'bg-gray-50'} text-center font-medium ${day.isWeekend ? 'text-red-700' : 'text-gray-700'} ${isMobile ? 'text-sm min-w-[150px]' : 'text-sm min-w-[180px]'}`}>
                            <div className={`${isMobile ? 'text-sm' : ''} ${day.isWeekend ? 'font-semibold' : ''}`}>{day.day}</div>
                            <div className={`${isMobile ? 'text-xs' : 'text-xs'} ${day.isWeekend ? 'text-red-500' : 'text-gray-500'} mt-1`}>{day.date}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((timeSlot, timeIndex) => (
                        <tr key={timeIndex}>
                          <td className={`border border-gray-300 ${isMobile ? 'p-3' : 'p-2'} bg-gray-50 text-center ${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700`}>
                            {timeSlot}
                          </td>
                          {filteredScheduleData.map((day, dayIndex) => {
                            const classData = getClassForTimeSlot(day, timeSlot);
                            const isEditing = editingCell?.day === dayIndex && editingCell?.classId === classData?.id;
                            const isAdding = addingClass?.day === dayIndex && addingClass?.timeSlot === timeSlot;

                            return (
                              <td key={dayIndex} className={`border border-gray-300 ${isMobile ? 'p-2' : 'p-2'} ${isMobile ? 'h-24' : 'h-20'} align-top relative ${filteredScheduleData[dayIndex]?.isWeekend ? 'bg-red-50' : 'bg-white'}`}>
                                {classData ? (
                                  <div className={`${isMobile ? 'p-2' : 'p-2'} h-full relative group ${getSubjectColor(classData.subject)} ${isMobile ? 'rounded-md' : ''}`}>
                                    {/* Edit button */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditTime(dayIndex, classData.id, classData.time)}
                                      className={`absolute ${isMobile ? 'top-1 right-1 h-7 w-7' : 'top-1 right-1 h-5 w-5'} p-0 ${isMobile ? 'opacity-70' : 'opacity-0 group-hover:opacity-100'} transition-opacity touch-manipulation`}
                                    >
                                      <Edit2 className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                    </Button>

                                    {isEditing ? (
                                      <div className={`${isMobile ? 'space-y-2' : 'space-y-1'}`}>
                                        <Input
                                          value={editTime}
                                          onChange={(e) => setEditTime(e.target.value)}
                                          className={`${isMobile ? 'h-8 text-sm' : 'h-6 text-xs'} touch-manipulation`}
                                          placeholder="08:00-09:30"
                                        />
                                        <div className={`flex ${isMobile ? 'space-x-2' : 'space-x-1'}`}>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleSaveTime}
                                            className={`${isMobile ? 'h-7 px-3 text-sm' : 'h-5 px-2 text-xs'} touch-manipulation`}
                                          >
                                            <Save className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCancelEdit}
                                            className={`${isMobile ? 'h-7 px-3 text-sm' : 'h-5 px-2 text-xs'} touch-manipulation`}
                                          >
                                            <X className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} font-semibold mb-1`}>{classData.subject}</div>
                                        <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600 mb-1`}>{classData.class}</div>
                                        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>{classData.teacher}</div>
                                        <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>{classData.room}</div>
                                      </>
                                    )}
                                  </div>
                                ) : isAdding ? (
                                  <div className="p-2 h-full bg-blue-50 border border-blue-200 rounded-md">
                                    <div className="space-y-1">
                                      <select
                                        value={newClassData.subject}
                                        onChange={(e) => setNewClassData({...newClassData, subject: e.target.value})}
                                        className="w-full text-xs px-1 py-1 border border-gray-300 rounded"
                                      >
                                        <option value="">Предмет</option>
                                        {islamicSubjects.map(subject => (
                                          <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                      </select>

                                      <select
                                        value={newClassData.class}
                                        onChange={(e) => setNewClassData({...newClassData, class: e.target.value})}
                                        className="w-full text-xs px-1 py-1 border border-gray-300 rounded"
                                      >
                                        <option value="">Группа</option>
                                        {availableClasses.map(cls => (
                                          <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                      </select>

                                      <select
                                        value={newClassData.teacher}
                                        onChange={(e) => setNewClassData({...newClassData, teacher: e.target.value})}
                                        className="w-full text-xs px-1 py-1 border border-gray-300 rounded"
                                      >
                                        <option value="">Учитель</option>
                                        {availableTeachers.map(teacher => (
                                          <option key={teacher} value={teacher}>{teacher}</option>
                                        ))}
                                      </select>

                                      <select
                                        value={newClassData.room}
                                        onChange={(e) => setNewClassData({...newClassData, room: e.target.value})}
                                        className="w-full text-xs px-1 py-1 border border-gray-300 rounded"
                                      >
                                        <option value="">Аудитория</option>
                                        {availableRooms.map(room => (
                                          <option key={room} value={room}>{room}</option>
                                        ))}
                                      </select>

                                      <div className="flex space-x-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleSaveNewClass}
                                          className="h-5 px-2 text-xs flex-1"
                                        >
                                          <Save className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={handleCancelAddClass}
                                          className="h-5 px-2 text-xs flex-1"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center group">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAddClass(dayIndex, timeSlot)}
                                      className={`${isMobile ? 'opacity-60' : 'opacity-0 group-hover:opacity-100'} transition-opacity border-2 border-dashed border-gray-300 hover:border-blue-400 w-full h-full text-gray-500 hover:text-blue-600 touch-manipulation`}
                                    >
                                      <Plus className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} ${isMobile ? '' : 'mr-1'}`} />
                                      {!isMobile && "Добавить"}
                                      {isMobile && <span className="ml-1 text-xs">Добавить</span>}
                                    </Button>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
