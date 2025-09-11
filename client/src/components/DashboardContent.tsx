import { useState, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { StudentCapAvatar } from "@/components/StudentCapAvatar";
import { Calendar, Save, Plus, ChevronLeft, ChevronRight, RotateCcw, Download } from "lucide-react";
import jsPDF from 'jspdf';

interface DashboardContentProps {
  isMobile?: boolean;
}

export function DashboardContent({ isMobile = false }: DashboardContentProps) {
  const { t } = useLanguage();
  
  // Academic year quarters configuration
  const quarters = [
    { id: 1, name: '1 четверть', weeks: 8, color: 'blue' },
    { id: 2, name: '2 четверть', weeks: 8, color: 'green' },
    { id: 3, name: '3 четверть', weeks: 11, color: 'orange' },
    { id: 4, name: '4 четверть', weeks: 7, color: 'purple' }
  ];

  // State management
  const [selectedLesson, setSelectedLesson] = useState("quran");
  const [grades, setGrades] = useState<{[key: string]: string}>({});
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [currentWeekInQuarter, setCurrentWeekInQuarter] = useState(1);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // Sample data
  const students = [
    { id: 1, name: "Ahmad S" },
    { id: 2, name: "Fatima A" },
    { id: 3, name: "Aisha M" },
    { id: 4, name: "Omar K" },
    { id: 5, name: "Yusuf H" },
    { id: 6, name: "Khadija R" },
    { id: 7, name: "Hassan T" },
    { id: 8, name: "Maryam I" },
    { id: 9, name: "Ibrahim N" },
    { id: 10, name: "Zainab F" },
  ];

  const lessons = [
    { key: 'quran', name: t('quran') },
    { key: 'namaz', name: t('namaz') },
    { key: 'tajweed', name: t('tajweed') },
    { key: 'hadith', name: t('hadith') },
    { key: 'muallimSani', name: t('muallimSani') },
    { key: 'fundamentalsOfReligion', name: t('fundamentalsOfReligion') },
    { key: 'duasAzkar', name: t('duasAzkar') },
    { key: 'alifBa', name: t('alifBa') },
    { key: 'tabarakJuz', name: t('tabarakJuz') },
    { key: 'ammaJuz', name: t('ammaJuz') },
  ];

  // Generate week dates starting from Monday
  const getWeekDates = (startDate: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dayName = date.toLocaleDateString('ru', { weekday: 'short' });
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Saturday (6) or Sunday (0)
      dates.push({
        day: date.getDate(),
        dayName: dayName,
        fullDate: date.toISOString().split('T')[0],
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        isWeekend: isWeekend
      });
    }
    return dates;
  };

  const dates = getWeekDates(currentWeekStart);

  // Quarter and week navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (isAnimating) return;

    setIsAnimating(true);

    const currentQuarterData = quarters[currentQuarter - 1];
    let newQuarter = currentQuarter;
    let newWeekInQuarter = currentWeekInQuarter;

    if (direction === 'next') {
      if (currentWeekInQuarter < currentQuarterData.weeks) {
        newWeekInQuarter++;
      } else if (currentQuarter < 4) {
        newQuarter++;
        newWeekInQuarter = 1;
      } else {
        // End of academic year, stay at last week
        setIsAnimating(false);
        return;
      }
    } else {
      if (currentWeekInQuarter > 1) {
        newWeekInQuarter--;
      } else if (currentQuarter > 1) {
        newQuarter--;
        newWeekInQuarter = quarters[newQuarter - 1].weeks;
      } else {
        // Beginning of academic year, stay at first week
        setIsAnimating(false);
        return;
      }
    }

    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + (direction === 'next' ? 7 : -7));

    // Apply slide animation
    if (tableRef.current) {
      tableRef.current.style.transform = `translateX(${direction === 'next' ? '-100%' : '100%'})`;
      tableRef.current.style.opacity = '0.3';

      setTimeout(() => {
        setCurrentQuarter(newQuarter);
        setCurrentWeekInQuarter(newWeekInQuarter);
        setCurrentWeekStart(newWeekStart);
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

  const navigateToQuarter = (quarterId: number) => {
    if (isAnimating || quarterId === currentQuarter) return;

    setCurrentQuarter(quarterId);
    setCurrentWeekInQuarter(1);
    // Note: In a real app, you'd calculate the actual week start date based on quarter
  };

  const getWeekRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);

    const startStr = currentWeekStart.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
    const endStr = endDate.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });

    return `${startStr} - ${endStr}`;
  };

  const getCurrentQuarterData = () => quarters[currentQuarter - 1];

  const getQuarterProgress = () => {
    const quarterData = getCurrentQuarterData();
    return `${currentWeekInQuarter} / ${quarterData.weeks}`;
  };

  // Grade input handler
  const handleGradeChange = (studentId: number, date: string, value: string) => {
    const key = `${studentId}-${date}`;
    setGrades(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get grade for student and date
  const getGrade = (studentId: number, date: string) => {
    const key = `${studentId}-${date}`;
    return grades[key] || '';
  };

  // Grade cell styling
  const getGradeStyle = (grade: string, isWeekend: boolean = false) => {
    // For weekend days, always use red styling regardless of grade
    if (isWeekend) {
      return 'bg-red-100 text-red-700';
    }

    if (grade === 'N') return 'bg-gray-100 text-gray-600';
    if (grade === 'B') return 'bg-purple-100 text-purple-600';
    if (grade === '1' || grade === '2') return 'bg-red-100 text-red-600';
    if (grade === '3' || grade === '4') return 'bg-orange-100 text-orange-600';
    if (grade === '5') return 'bg-green-100 text-green-600';
    return 'bg-white';
  };

  // PDF Download functionality
  const downloadGradesPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text('Оценки учеников', 20, 20);

    // Add lesson and period info
    doc.setFontSize(12);
    const currentLesson = lessons.find(l => l.key === selectedLesson);
    doc.text(`Предмет: ${currentLesson?.name || selectedLesson}`, 20, 35);
    doc.text(`Четверть: ${getCurrentQuarterData().name}`, 20, 45);
    doc.text(`Неделя: ${getQuarterProgress()}`, 20, 55);
    doc.text(`Период: ${getWeekRange()}`, 20, 65);
    doc.text(`Дата создания: ${new Date().toLocaleDateString('ru')}`, 20, 75);

    // Add table headers
    let yPosition = 95;
    doc.setFontSize(10);
    doc.text('Ученик', 20, yPosition);

    // Add date headers
    dates.forEach((date, index) => {
      const xPos = 80 + (index * 15);
      doc.text(`${date.day}/${date.month}`, xPos, yPosition - 5);
      doc.text(date.dayName, xPos, yPosition);
    });
    doc.text('Средний', 80 + (dates.length * 15), yPosition);

    // Add student data
    yPosition += 10;
    students.forEach((student, studentIndex) => {
      yPosition += 8;

      // Student name
      doc.text(student.name, 20, yPosition);

      // Grades for each date
      let validGrades: number[] = [];
      dates.forEach((date, dateIndex) => {
        const grade = getGrade(student.id, date.fullDate);
        const xPos = 80 + (dateIndex * 15);
        doc.text(grade || '—', xPos + 5, yPosition);

        // Collect valid numeric grades for average calculation
        if (grade && !isNaN(Number(grade)) && Number(grade) >= 1 && Number(grade) <= 5) {
          validGrades.push(Number(grade));
        }
      });

      // Calculate and display average
      const average = validGrades.length > 0
        ? (validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length).toFixed(1)
        : '—';
      doc.text(average, 80 + (dates.length * 15) + 5, yPosition);
    });

    // Add footer
    yPosition += 20;
    doc.setFontSize(8);
    doc.text('Легенда: 1-2 (неудовлетворительно), 3-4 (удовлетворительно), 5 (отлично), N (отсутствие), B (болен)', 20, yPosition);

    // Save the PDF
    const fileName = `оценки_${currentLesson?.name || selectedLesson}_неделя${getQuarterProgress()}_четверть${currentQuarter}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className={`flex-1 ${isMobile ? 'p-3 safe-area-bottom' : 'p-4'} overflow-hidden bg-gray-50`}>
      {/* Compact Header */}
      <div className={`bg-white rounded-xl border border-gray-200 mb-4 ${isMobile ? 'p-4' : 'p-3'} shadow-sm`}>
        {/* Title Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'} text-gray-500`} />
            <h2 className={`${isMobile ? 'text-lg' : 'text-base'} font-semibold text-gray-900`}>{t('studentJournal')}</h2>
          </div>

          <div className="flex items-center space-x-2">
            {!isMobile && (
              <button
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title={t('save')}
              >
                <Save className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={downloadGradesPDF}
              className={`${isMobile ? 'flex items-center space-x-2 px-3 py-2 h-10' : 'p-1'} text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors touch-manipulation`}
              title="Скачать PDF"
            >
              <Download className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
              {isMobile && <span className="text-sm font-medium">Скачать PDF</span>}
            </button>
          </div>
        </div>

        {/* Controls Row - Stacked on Mobile */}
        <div className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}>
          {/* Quarter Selector */}
          <div className="flex items-center space-x-3">
            <label className={`${isMobile ? 'text-sm font-medium' : 'text-xs'} text-gray-600 whitespace-nowrap`}>Четверть:</label>
            <select
              value={currentQuarter}
              onChange={(e) => navigateToQuarter(Number(e.target.value))}
              className={`${isMobile ? 'text-sm px-3 py-2 h-11' : 'text-xs px-2 py-1'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'flex-1 touch-manipulation' : ''} bg-white`}
            >
              {quarters.map(quarter => (
                <option key={quarter.id} value={quarter.id}>
                  {quarter.name} ({quarter.weeks} нед)
                </option>
              ))}
            </select>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              disabled={isAnimating}
              className={`${isMobile ? 'p-3 h-11 w-11' : 'p-1'} text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors touch-manipulation rounded-lg hover:bg-gray-100`}
            >
              <ChevronLeft className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
            </button>

            <div className={`${isMobile ? 'text-sm' : 'text-sm'} font-medium text-gray-700 text-center ${isMobile ? 'min-w-[140px]' : 'min-w-[140px]'}`}>
              <div className={`${isMobile ? 'text-sm' : 'text-sm'}`}>{getWeekRange()}</div>
              <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500 mt-1`}>
                {getCurrentQuarterData().name} - Неделя {getQuarterProgress()}
              </div>
            </div>

            <button
              onClick={() => navigateWeek('next')}
              disabled={isAnimating}
              className={`${isMobile ? 'p-3 h-11 w-11' : 'p-1'} text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors touch-manipulation rounded-lg hover:bg-gray-100`}
            >
              <ChevronRight className={`${isMobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
            </button>
          </div>

          {/* Lesson Filter */}
          <div className="flex items-center space-x-3">
            <label className={`${isMobile ? 'text-sm font-medium' : 'text-xs'} text-gray-600 whitespace-nowrap`}>{t('lesson')}:</label>
            <select
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
              className={`${isMobile ? 'text-sm px-3 py-2 h-11' : 'text-xs px-2 py-1'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isMobile ? 'flex-1 touch-manipulation' : ''} bg-white`}
            >
              {lessons.map(lesson => (
                <option key={lesson.key} value={lesson.key}>{lesson.name}</option>
              ))}
            </select>
          </div>

          {/* Mobile Save Button */}
          {isMobile && (
            <div className="flex justify-center">
              <Button variant="outline" size="default" className="px-6 py-3 h-11 touch-manipulation">
                <Save className="h-5 w-5 mr-2" />
                {t('save')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Journal Table */}
      <div className={`bg-white ${isMobile ? 'rounded-xl shadow-sm' : 'rounded-lg'} border border-gray-200 overflow-hidden`}>
        {isMobile && (
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <p className="text-sm text-blue-700 text-center font-medium">Проведите пальцем для просмотра дат</p>
          </div>
        )}
        <div
          ref={tableRef}
          className={`overflow-x-auto overflow-y-auto transition-all duration-300 ease-in-out ${
            isMobile ? 'max-h-[calc(100vh-320px)]' : 'max-h-[calc(100vh-200px)]'
          }`}
        >
          <table className={`w-full ${isMobile ? 'text-sm' : 'text-xs'}`}>
            {/* Table Header */}
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className={`${isMobile ? 'w-32 px-3 py-3' : 'w-40 px-3 py-2'} text-left font-semibold text-gray-700 border-r border-gray-200 bg-gray-50 sticky left-0 z-20`}>
                  {t('student')}
                </th>
                {dates.map(date => (
                  <th key={`${date.year}-${date.month}-${date.day}`} className={`${isMobile ? 'w-12 px-1 py-3' : 'w-12 px-1 py-2'} text-center font-medium border-r border-gray-200 ${
                    date.isWeekend
                      ? 'bg-red-200 text-red-800'
                      : 'bg-gray-50 text-gray-600'
                  }`}>
                    <div className={`${isMobile ? 'text-xs' : 'text-xs'} leading-tight`}>{isMobile ? date.dayName.slice(0, 2) : date.dayName}</div>
                    <div className={`${isMobile ? 'text-sm' : 'text-xs'} font-bold mt-1`}>{date.day}</div>
                    {date.month !== dates[0].month && (
                      <div className="text-xs text-gray-400 mt-1">{date.month}</div>
                    )}
                  </th>
                ))}
                <th className={`${isMobile ? 'w-12 px-1 py-2' : 'w-16 px-2 py-2'} text-center font-semibold text-gray-700 bg-gray-50`}>
                  {isMobile ? 'Ср' : t('average')}
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'} hover:bg-blue-25 border-b border-gray-100`}>
                  {/* Student Name Cell */}
                  <td className={`${isMobile ? 'px-3 py-3' : 'px-3 py-2'} border-r border-gray-200 bg-gray-50 sticky left-0 z-10`}>
                    <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-2'}`}>
                      <StudentCapAvatar name={student.name} size={isMobile ? "md" : "sm"} />
                      <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-medium text-gray-900 truncate`}>
                        {isMobile ? student.name.split(' ')[0] : student.name}
                      </span>
                    </div>
                  </td>

                  {/* Grade Cells */}
                  {dates.map(date => (
                    <td key={`${student.id}-${date.fullDate}`} className={`p-0 border-r border-gray-200 relative ${
                      date.isWeekend ? 'bg-red-100' : ''
                    }`}>
                      <input
                        type="text"
                        value={getGrade(student.id, date.fullDate)}
                        onChange={(e) => handleGradeChange(student.id, date.fullDate, e.target.value)}
                        disabled={date.isWeekend}
                        className={`w-full ${isMobile ? 'h-12 text-base' : 'h-8 text-xs'} text-center border-0 focus:ring-2 focus:ring-blue-400 focus:outline-none touch-manipulation ${
                          date.isWeekend
                            ? 'bg-red-100 text-red-700 cursor-not-allowed font-medium'
                            : getGradeStyle(getGrade(student.id, date.fullDate), false)
                        }`}
                        placeholder={date.isWeekend ? "—" : "—"}
                        maxLength={1}
                        title={date.isWeekend ? "Оценки не ставятся в выходные дни" : ""}
                        inputMode="numeric"
                      />
                    </td>
                  ))}

                  {/* Average Cell */}
                  <td className={`${isMobile ? 'px-2 py-3' : 'px-2 py-2'} text-center bg-gray-50`}>
                    <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-semibold text-gray-700`}>4.2</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className={`mt-4 bg-white ${isMobile ? 'rounded-xl shadow-sm' : 'rounded-lg'} border border-gray-200 ${isMobile ? 'p-4' : 'p-3'}`}>
        <div className={`${isMobile ? 'space-y-3' : 'flex items-center justify-between'}`}>
          <div className={`${isMobile ? 'grid grid-cols-2 gap-3' : 'flex items-center space-x-4'} ${isMobile ? 'text-sm' : 'text-xs'}`}>
            <span className={`${isMobile ? 'col-span-2 text-center' : ''} text-gray-600 font-semibold ${isMobile ? 'text-base' : ''}`}>Оценки:</span>
            <div className="flex items-center space-x-2">
              <div className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'} bg-red-100 rounded border`}></div>
              <span className="text-gray-600">1-2</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'} bg-orange-100 rounded border`}></div>
              <span className="text-gray-600">3-4</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'} bg-green-100 rounded border`}></div>
              <span className="text-gray-600">5</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'} bg-gray-100 rounded border`}></div>
              <span className="text-gray-600">N - {t('notPresent')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'} bg-purple-100 rounded border`}></div>
              <span className="text-gray-600">B - {t('sick')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
