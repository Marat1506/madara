import { ISLAMIC_SUBJECTS } from '@shared/api';
import {
  School,
  Teacher,
  Subject,
  Student,
  Class,
  Enrollment,
  ClassSchedule
} from '../models';

export async function seedDatabase() {
  try {
    // Clear existing data
    await Promise.all([
      School.deleteMany({}),
      Teacher.deleteMany({}),
      Subject.deleteMany({}),
      Student.deleteMany({}),
      Class.deleteMany({}),
      Enrollment.deleteMany({}),
      ClassSchedule.deleteMany({})
    ]);

    console.log('🧹 Cleared existing data');

    const academicYear = getCurrentAcademicYear();

    // Seed Schools
    const schools = await School.insertMany([
      {
        name: "Медресе №1",
        type: "madrasa",
        foundedYear: 2010,
        languages: ["Русский", "Арабский"],
        address: "ул. Мира, 25, Дагестан",
        phone: "+7 (843) 123-45-67",
        email: "info@madrasa1.ru"
      },
      {
        name: "Медресе №2",
        type: "madrasa",
        foundedYear: 2015,
        languages: ["Русский", "Арабский"],
        address: "ул. Победы, 12, Дагестан",
        phone: "+7 (843) 234-56-78",
        email: "contact@madrasa2.ru"
      },
      {
        name: "Исламская школа Нур",
        type: "islamic_school",
        foundedYear: 2018,
        languages: ["Русский", "Арабский"],
        address: "пр. Ямашева, 89, Дагестан",
        phone: "+7 (843) 345-67-89",
        email: "info@nur-school.ru"
      }
    ]);

    // Seed Subjects from predefined Islamic subjects
    const subjects = await Subject.insertMany(
      ISLAMIC_SUBJECTS.map((subject, index) => ({
        name: subject.name,
        nameArabic: subject.nameArabic,
        category: subject.category,
        level: index < 5 ? "beginner" : index < 10 ? "intermediate" : "advanced",
        description: `Изучение ${subject.name} в соответствии с исламскими традициями`
      }))
    );

    // Seed Teachers
    const teachers = await Teacher.insertMany([
      {
        name: "Устаз Ахмад Салманов",
        email: "ahmad.salmanov@madrasa1.ru",
        phone: "+7 (843) 111-11-11",
        subjects: ["Коран", "Таджвид", "Хафс"],
        schoolIds: [schools[0]._id],
        qualifications: ["Хафиз Корана", "Магистр исламских наук"],
        joinDate: new Date("2010-09-01")
      },
      {
        name: "Устаз Ибрагим Ахметов",
        email: "ibrahim.ahmetov@madrasa1.ru",
        phone: "+7 (843) 222-22-22",
        subjects: ["Намаз", "Фикх", "Основы религии"],
        schoolIds: [schools[0]._id, schools[1]._id],
        qualifications: ["Бакалавр исламского права", "Специалист по исламскому образованию"],
        joinDate: new Date("2012-01-15")
      },
      {
        name: "Устаз Мухаммад Хасанов",
        email: "muhammad.hasanov@madrasa2.ru",
        phone: "+7 (843) 333-33-33",
        subjects: ["Хадис", "Сира", "Исламская история"],
        schoolIds: [schools[1]._id],
        qualifications: ["Магистр хадисоведения", "Доктор исламских наук"],
        joinDate: new Date("2015-08-20")
      },
      {
        name: "Устаз Юсуф Ахмедов",
        email: "yusuf.ahmedov@nur-school.ru",
        phone: "+7 (843) 444-44-44",
        subjects: ["Арабский язык", "Муаллим Сани", "Алиф-Ба"],
        schoolIds: [schools[2]._id],
        qualifications: ["Филолог арабского языка", "Методист начального обучения"],
        joinDate: new Date("2018-09-01")
      },
      {
        name: "Устаз Омар Ибрагимов",
        email: "omar.ibragimov@madrasa1.ru",
        phone: "+7 (843) 555-55-55",
        subjects: ["Дуа и Азкар", "Акыда", "Исламская этика"],
        schoolIds: [schools[0]._id],
        qualifications: ["Имам-хатыб", "Специалист по духовному воспитанию"],
        joinDate: new Date("2011-02-10")
      }
    ]);

    // Seed Classes
    const classes = await Class.insertMany([
      {
        name: "Группа А",
        schoolId: schools[0]._id,
        teacherId: teachers[0]._id,
        subjectIds: [subjects[0]._id, subjects[2]._id, subjects[8]._id],
        primarySubjectId: subjects[0]._id,
        maxStudents: 30,
        currentStudents: 0,
        academicYear
      },
      {
        name: "Группа Б",
        schoolId: schools[0]._id,
        teacherId: teachers[1]._id,
        subjectIds: [subjects[1]._id, subjects[10]._id, subjects[5]._id],
        primarySubjectId: subjects[1]._id,
        maxStudents: 25,
        currentStudents: 0,
        academicYear
      },
      {
        name: "Группа В",
        schoolId: schools[1]._id,
        teacherId: teachers[2]._id,
        subjectIds: [subjects[3]._id, subjects[12]._id, subjects[14]._id],
        primarySubjectId: subjects[3]._id,
        maxStudents: 20,
        currentStudents: 0,
        academicYear
      },
      {
        name: "Начальная группа",
        schoolId: schools[2]._id,
        teacherId: teachers[3]._id,
        subjectIds: [subjects[7]._id, subjects[4]._id, subjects[9]._id],
        primarySubjectId: subjects[7]._id,
        maxStudents: 15,
        currentStudents: 0,
        academicYear
      },
      {
        name: "Духовная подготовка",
        schoolId: schools[0]._id,
        teacherId: teachers[4]._id,
        subjectIds: [subjects[6]._id, subjects[11]._id],
        primarySubjectId: subjects[6]._id,
        maxStudents: 35,
        currentStudents: 0,
        academicYear
      }
    ]);

    // Seed Students
    const students = await Student.insertMany([
      {
        name: "Ahmad S",
        fullName: "Ahmad Salman Rashidov",
        dateOfBirth: new Date("2010-03-15"),
        gender: "male",
        parentName: "Salman Rashidov",
        parentPhone: "+7 (843) 111-22-33",
        parentEmail: "salman.rashidov@email.ru",
        address: "ул. Баумана, 45, кв. 12, Дагестан",
        enrollmentDate: new Date("2023-09-01"),
        academicYear,
        level: "intermediate"
      },
      {
        name: "Fatima A",
        fullName: "Fatima Al-Zahra Ahmedova",
        dateOfBirth: new Date("2011-07-22"),
        gender: "female",
        parentName: "Ahmed Ahmedov",
        parentPhone: "+7 (843) 222-33-44",
        parentEmail: "ahmed.ahmedov@email.ru",
        address: "ул. Пушкина, 78, кв. 5, Дагестан",
        enrollmentDate: new Date("2023-09-01"),
        academicYear,
        level: "beginner"
      },
      {
        name: "Aisha M",
        fullName: "Aisha Malik Sultanovna",
        dateOfBirth: new Date("2009-11-08"),
        gender: "female",
        parentName: "Malik Sultanov",
        parentPhone: "+7 (843) 333-44-55",
        parentEmail: "malik.sultanov@email.ru",
        address: "пр. Победы, 123, кв. 67, Дагестан",
        enrollmentDate: new Date("2022-09-01"),
        academicYear,
        level: "advanced"
      },
      {
        name: "Omar K",
        fullName: "Omar Khalil Ibragimovich",
        dateOfBirth: new Date("2010-05-30"),
        gender: "male",
        parentName: "Khalil Ibragimov",
        parentPhone: "+7 (843) 444-55-66",
        parentEmail: "khalil.ibragimov@email.ru",
        address: "ул. Дагестан, 56, кв. 89, Дагестан",
        enrollmentDate: new Date("2023-09-01"),
        academicYear,
        level: "intermediate"
      },
      {
        name: "Yusuf H",
        fullName: "Yusuf Hassan Muradovich",
        dateOfBirth: new Date("2012-01-18"),
        gender: "male",
        parentName: "Hassan Muradov",
        parentPhone: "+7 (843) 555-66-77",
        parentEmail: "hassan.muradov@email.ru",
        address: "ул. Кремлевская, 34, кв. 12, Дагестан",
        enrollmentDate: new Date("2024-01-15"),
        academicYear,
        level: "beginner"
      },
      {
        name: "Khadija R",
        fullName: "Khadija Rahima Aminovna",
        dateOfBirth: new Date("2009-09-25"),
        gender: "female",
        parentName: "Amin Rahimov",
        parentPhone: "+7 (843) 666-77-88",
        parentEmail: "amin.rahimov@email.ru",
        address: "ул. Дагестан, 67, кв. 23, Дагестан",
        enrollmentDate: new Date("2022-09-01"),
        academicYear,
        level: "advanced"
      },
      {
        name: "Hassan T",
        fullName: "Hassan Tariq Zakarovich",
        dateOfBirth: new Date("2011-04-12"),
        gender: "male",
        parentName: "Tariq Zakarov",
        parentPhone: "+7 (843) 777-88-99",
        parentEmail: "tariq.zakarov@email.ru",
        address: "ул. Декабристов, 89, кв. 45, Дагестан",
        enrollmentDate: new Date("2023-09-01"),
        academicYear,
        level: "intermediate"
      },
      {
        name: "Maryam I",
        fullName: "Maryam Ibrahim Faridovna",
        dateOfBirth: new Date("2010-08-07"),
        gender: "female",
        parentName: "Farid Ibragimov",
        parentPhone: "+7 (843) 888-99-00",
        parentEmail: "farid.ibragimov@email.ru",
        address: "ул. Горького, 12, кв. 78, Дагестан",
        enrollmentDate: new Date("2023-09-01"),
        academicYear,
        level: "intermediate"
      },
      {
        name: "Ibrahim N",
        fullName: "Ibrahim Nazir Osmanovich",
        dateOfBirth: new Date("2011-12-03"),
        gender: "male",
        parentName: "Nazir Osmanov",
        parentPhone: "+7 (843) 999-00-11",
        parentEmail: "nazir.osmanov@email.ru",
        address: "ул. Чернышевского, 45, кв. 67, Дагестан",
        enrollmentDate: new Date("2023-09-01"),
        academicYear,
        level: "beginner"
      },
      {
        name: "Zainab F",
        fullName: "Zainab Farouk Halilovna",
        dateOfBirth: new Date("2009-06-14"),
        gender: "female",
        parentName: "Halil Faroukov",
        parentPhone: "+7 (843) 000-11-22",
        parentEmail: "halil.faroukov@email.ru",
        address: "ул. Лесгафта, 78, кв. 90, Дагестан",
        enrollmentDate: new Date("2022-09-01"),
        academicYear,
        level: "advanced"
      }
    ]);

    // Seed Enrollments
    const enrollments = await Enrollment.insertMany([
      { studentId: students[0]._id, classId: classes[0]._id, enrollmentDate: new Date("2023-09-01"), academicYear },
      { studentId: students[3]._id, classId: classes[0]._id, enrollmentDate: new Date("2023-09-01"), academicYear },
      { studentId: students[7]._id, classId: classes[0]._id, enrollmentDate: new Date("2023-09-01"), academicYear },
      { studentId: students[1]._id, classId: classes[1]._id, enrollmentDate: new Date("2023-09-01"), academicYear },
      { studentId: students[6]._id, classId: classes[1]._id, enrollmentDate: new Date("2023-09-01"), academicYear },
      { studentId: students[8]._id, classId: classes[1]._id, enrollmentDate: new Date("2023-09-01"), academicYear },
      { studentId: students[2]._id, classId: classes[2]._id, enrollmentDate: new Date("2022-09-01"), academicYear },
      { studentId: students[5]._id, classId: classes[2]._id, enrollmentDate: new Date("2022-09-01"), academicYear },
      { studentId: students[9]._id, classId: classes[2]._id, enrollmentDate: new Date("2022-09-01"), academicYear },
      { studentId: students[4]._id, classId: classes[3]._id, enrollmentDate: new Date("2024-01-15"), academicYear }
    ]);

    // Update class student counts
    for (const cls of classes) {
      const count = enrollments.filter(e => e.classId.toString() === cls._id.toString()).length;
      await Class.findByIdAndUpdate(cls._id, { currentStudents: count });
    }

    // Seed Class Schedules
    await ClassSchedule.insertMany([
      {
        classId: classes[0]._id,
        subjectId: subjects[0]._id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "10:30",
        room: "Зал №1"
      },
      {
        classId: classes[0]._id,
        subjectId: subjects[2]._id,
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "10:30",
        room: "Зал №1"
      },
      {
        classId: classes[1]._id,
        subjectId: subjects[1]._id,
        dayOfWeek: 2,
        startTime: "11:00",
        endTime: "12:30",
        room: "Зал №2"
      },
      {
        classId: classes[2]._id,
        subjectId: subjects[3]._id,
        dayOfWeek: 1,
        startTime: "14:00",
        endTime: "15:30",
        room: "Аудитория №3"
      }
    ]);

    console.log('🌱 Database seeded successfully!');
    console.log(`📊 Created: ${schools.length} schools, ${teachers.length} teachers, ${subjects.length} subjects, ${classes.length} classes, ${students.length} students, ${enrollments.length} enrollments`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}