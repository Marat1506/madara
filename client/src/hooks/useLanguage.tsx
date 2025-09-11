import { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'ru' | 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  ru: {
    // Login page
    'emadrasa': 'eMadrasa',
    'welcome': 'Добро пожаловать в eMadrasa',
    'loginSubtitle': 'Введите свои учетные данные для доступа к аккаунту.',
    'email': 'Электронная почта',
    'password': 'Пароль',
    'rememberMe': 'Запомнить меня',
    'forgotPassword': 'Забыли пароль?',
    'signIn': 'Войти',
    'alreadyHaveAccount': 'Уже есть аккаунт?',
    'logIn': 'Войти',
    
    // Forgot password page
    'resetPassword': 'Сбросить пароль',
    'resetPasswordSubtitle': 'Введите адрес электронной почты для сброса пароля. Мы отправим вам ссылку для создания нового пароля.',
    'emailAddress': 'Адрес электронной почты',
    'emailPlaceholder': 'Введите адрес электронной почты',
    'sendResetLink': 'Отправить ссылку сброса',
    'backToSignIn': 'Вернуться к входу',

    // Dashboard page
    'dashboard': 'Панель управления',
    'analytics': 'Аналитика',
    'schedule': 'Расписание',
    'management': 'Управление',
    'teacher': 'Преподаватель',
    'profile': 'Профиль',
    'logout': 'Выйти',
    'lessons': 'Уроки',
    'students': 'Ученики',
    'grade': 'Оценка',
    'generateReport': 'Создать отчет',
    'totalStudents': 'Всего учеников',
    'averageGrade': 'Средняя оценка',
    'completedTasks': 'Выполненные задания',
    'achievements': 'Достижения',
    'performanceTrend': 'Динамика успеваемости',
    'topStudents': 'Лучшие ученики',
    'studentPerformance': 'Успеваемость учеников',

    // Islamic subjects
    'quran': 'Коран',
    'namaz': 'Намаз',
    'tajweed': 'Таджвид',
    'hadith': 'Хадис',
    'muallimSani': 'Муаллим Сани',
    'fundamentalsOfReligion': 'Основы религии',
    'duasAzkar': 'Дуа и Азкар',
    'alifBa': 'Алиф-Ба',
    'tabarakJuz': 'Джуз Табарак',
    'ammaJuz': 'Джуз Амма',

    // Grading interface
    'attendanceAndGrades': 'Посещаемость и оценки',
    'day': 'День',
    'month': 'Месяц',
    'year': 'Год',
    'student': 'Ученик',
    'lesson': 'Урок',
    'selectStudent': 'Выберите ученика',
    'selectLesson': 'Выберите урок',
    'gradeEntry': 'Выставление оценки',
    'selectGrade': 'Выберите оценку',
    'poor': 'Плохо',
    'good': 'Хорошо',
    'excellent': 'Отлично',
    'attendanceStatus': 'Статус посещения',
    'notPresent': 'Отсутствует',
    'sick': 'Болен',
    'saveGrade': 'Сохранить оценку',
    'reset': 'Сбросить',
    'recentEntries': 'Последние записи',
    'date': 'Дата',
    'status': 'Статус',
    'present': 'Присутствует',
    'journal': 'Журнал',
    'studentJournal': 'Журнал учеников',
    'save': 'Сохранить',
    'average': 'Среднее',
    'legend': 'Легенда',
    'clickToEdit': 'Нажмите для редактирования',
    'all': 'Все'
  },
  ar: {
    // Login page
    'emadrasa': 'eMadrasa',
    'welcome': 'مرحباً بك في إي مدرسة',
    'loginSubtitle': 'أدخل بيانات الاعتماد الخاصة بك للوصول إلى حسابك.',
    'email': 'البريد الإلكتروني',
    'password': 'كلمة المرور',
    'rememberMe': 'تذكرني',
    'forgotPassword': 'نسيت كلمة المرور؟',
    'signIn': 'تسجيل الدخول',
    'alreadyHaveAccount': 'هل لديك حساب بالفعل؟',
    'logIn': 'تسجيل الدخول',
    
    // Forgot password page
    'resetPassword': 'إعادة تعيين كلمة المرور',
    'resetPasswordSubtitle': 'يرجى إدخال عنوان البريد الإلكتروني لإعادة تعيين كلمة المرور. سنرسل لك رابط لإنشاء كلمة مرور جديدة.',
    'emailAddress': 'عنوان البريد الإلكتروني',
    'emailPlaceholder': 'أدخل عنوان البريد الإلكتروني',
    'sendResetLink': 'إرسال رابط الإعادة تعيين',
    'backToSignIn': 'العودة إلى تسجيل الدخول',

    // Dashboard page
    'dashboard': 'لوحة التحكم',
    'analytics': 'التحليلات',
    'schedule': 'جدول الحصص',
    'management': 'الإدارة',
    'teacher': 'المعلم',
    'profile': 'الملف الشخصي',
    'logout': 'تسجيل الخروج',
    'lessons': 'الدروس',
    'students': 'الطلاب',
    'grade': 'الدرجة',
    'generateReport': 'إنشاء تقرير',
    'totalStudents': 'إجمالي الطلاب',
    'averageGrade': 'المتوسط العام',
    'completedTasks': 'المهام المكتملة',
    'achievements': 'الإنجازات',
    'performanceTrend': 'اتجاه الأداء',
    'topStudents': 'أفضل الطلاب',
    'studentPerformance': 'أداء الطلاب',

    // Islamic subjects
    'quran': 'القرآن',
    'namaz': 'الصلاة',
    'tajweed': 'التجويد',
    'hadith': 'الحديث',
    'muallimSani': 'المعلم الثاني',
    'fundamentalsOfReligion': 'أصول الدين',
    'duasAzkar': 'الأدعية والأذكار',
    'alifBa': 'الألف باء',
    'tabarakJuz': 'جزء تبارك',
    'ammaJuz': 'جزء عم',

    // Grading interface
    'attendanceAndGrades': 'الحضور والدرجات',
    'day': 'اليوم',
    'month': 'الشهر',
    'year': 'السنة',
    'student': 'الطالب',
    'lesson': 'الدرس',
    'selectStudent': 'اختر الطالب',
    'selectLesson': 'اختر الدرس',
    'gradeEntry': 'إدخال الدرجة',
    'selectGrade': 'اختر الدرجة',
    'poor': 'ضعيف',
    'good': 'جيد',
    'excellent': 'ممتاز',
    'attendanceStatus': 'حالة الحضور',
    'notPresent': 'غائب',
    'sick': 'مريض',
    'saveGrade': 'حفظ الدرجة',
    'reset': 'إعادة تعيين',
    'recentEntries': 'الإدخالات الأخيرة',
    'date': 'التاريخ',
    'status': 'الحالة',
    'present': 'حاضر',
    'journal': 'السجل',
    'studentJournal': 'سجل الطلاب',
    'save': 'حفظ',
    'average': 'المتوسط',
    'legend': 'المفتاح',
    'clickToEdit': 'انقر للتحرير',
    'all': 'الكل'
  },
  en: {
    // Login page
    'emadrasa': 'eMadrasa',
    'welcome': 'Welcome to eMadrasa',
    'loginSubtitle': 'Enter your credentials to access your account.',
    'email': 'Email',
    'password': 'Password',
    'rememberMe': 'Remember me',
    'forgotPassword': 'Forgot password?',
    'signIn': 'Sign in',
    'alreadyHaveAccount': 'Already have an account?',
    'logIn': 'Log in',
    
    // Forgot password page
    'resetPassword': 'Reset Your Password',
    'resetPasswordSubtitle': 'Please enter your email address to reset your password. We will send you a link to create a new password.',
    'emailAddress': 'Email Address',
    'emailPlaceholder': 'Enter your email address',
    'sendResetLink': 'Send Reset Link',
    'backToSignIn': 'Back to Sign In',

    // Dashboard page
    'dashboard': 'Dashboard',
    'analytics': 'Analytics',
    'schedule': 'Schedule',
    'management': 'Management',
    'teacher': 'Teacher',
    'profile': 'Profile',
    'logout': 'Logout',
    'lessons': 'Lessons',
    'students': 'Students',
    'grade': 'Grade',
    'generateReport': 'Generate Report',
    'totalStudents': 'Total Students',
    'averageGrade': 'Average Grade',
    'completedTasks': 'Completed Tasks',
    'achievements': 'Achievements',
    'performanceTrend': 'Performance Trend',
    'topStudents': 'Top Students',
    'studentPerformance': 'Student Performance',

    // Islamic subjects
    'quran': 'Quran',
    'namaz': 'Namaz',
    'tajweed': 'Tajweed',
    'hadith': 'Hadith',
    'muallimSani': 'Muallim Sani',
    'fundamentalsOfReligion': 'Fundamentals of Religion',
    'duasAzkar': 'Duas & Azkar',
    'alifBa': 'Alif-Ba',
    'tabarakJuz': 'Tabarak Juz',
    'ammaJuz': 'Amma Juz',

    // Grading interface
    'attendanceAndGrades': 'Attendance and Grades',
    'day': 'Day',
    'month': 'Month',
    'year': 'Year',
    'student': 'Student',
    'lesson': 'Lesson',
    'selectStudent': 'Select Student',
    'selectLesson': 'Select Lesson',
    'gradeEntry': 'Grade Entry',
    'selectGrade': 'Select Grade',
    'poor': 'Poor',
    'good': 'Good',
    'excellent': 'Excellent',
    'attendanceStatus': 'Attendance Status',
    'notPresent': 'Not Present',
    'sick': 'Sick',
    'saveGrade': 'Save Grade',
    'reset': 'Reset',
    'recentEntries': 'Recent Entries',
    'date': 'Date',
    'status': 'Status',
    'present': 'Present',
    'journal': 'Journal',
    'studentJournal': 'Student Journal',
    'save': 'Save',
    'average': 'Average',
    'legend': 'Legend',
    'clickToEdit': 'Click to edit',
    'all': 'All'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('ru');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ru']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
