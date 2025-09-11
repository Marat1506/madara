import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building2,
  Calendar,
  Search,
  Filter,
  Loader2
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Student {
  id: number;
  name: string;
  fullName: string;
  dateOfBirth?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  enrollmentDate: string;
  academicYear: string;
  enrollments?: {
    id: number;
    class: { id: number; name: string };
    school: { id: number; name: string };
    status: string;
    enrollmentDate: string;
  }[];
  currentClasses?: { id: number; name: string }[];
}

interface School {
  id: number;
  name: string;
}

interface Class {
  id: number;
  name: string;
  schoolId: number;
}

export function StudentManagement() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSchool, setFilterSchool] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    fullName: "",
    dateOfBirth: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    address: "",
    enrollmentDate: new Date().toISOString().split('T')[0],
    academicYear: "2025-2026"
  });


  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");
      
      const [studentsResponse, schoolsResponse, classesResponse] = await Promise.all([
        fetch("/api/students", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/schools", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/classes", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (studentsResponse.ok && schoolsResponse.ok && classesResponse.ok) {
        const studentsData = await studentsResponse.json();
        const schoolsData = await schoolsResponse.json();
        const classesData = await classesResponse.json();
        
        setStudents(studentsData.data.students || []);
        setSchools(schoolsData.data.schools || []);
        setClasses(classesData.data.classes || []);
      } else {
        setError("Ошибка загрузки данных");
      }
    } catch (err) {
      setError("Ошибка загрузки данных");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      fullName: "",
      dateOfBirth: "",
      parentName: "",
      parentPhone: "",
      parentEmail: "",
      address: "",
      enrollmentDate: new Date().toISOString().split('T')[0],
      academicYear: "2025-2026"
    });
    setEditingStudent(null);
  };

  // Handle add student
  const handleAddStudent = async () => {
    if (!formData.name.trim() || !formData.fullName.trim()) {
      setError("Заполните обязательные поля: имя и полное имя");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        setIsAddDialogOpen(false);
        resetForm();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Ошибка создания ученика");
      }
    } catch (err) {
      setError("Ошибка создания ученика");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit student
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      fullName: student.fullName,
      dateOfBirth: student.dateOfBirth || "",
      parentName: student.parentName || "",
      parentPhone: student.parentPhone || "",
      parentEmail: student.parentEmail || "",
      address: student.address || "",
      enrollmentDate: student.enrollmentDate,
      academicYear: student.academicYear
    });
    setIsAddDialogOpen(true);
  };

  // Handle update student
  const handleUpdateStudent = async () => {
    if (!editingStudent || !formData.name.trim() || !formData.fullName.trim()) {
      setError("Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/students/${editingStudent.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchData();
        setIsAddDialogOpen(false);
        resetForm();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Ошибка обновления ученика");
      }
    } catch (err) {
      setError("Ошибка обновления ученика");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete student
  const handleDeleteStudent = async (studentId: number, studentName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить ученика "${studentName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/students/${studentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchData();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Ошибка удаления ученика");
      }
    } catch (err) {
      setError("Ошибка удаления ученика");
    }
  };

  // Filter students with memoization for performance
  const filteredStudents = React.useMemo(() => students.filter(student => {
    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        student.name.toLowerCase().includes(searchLower) ||
        student.fullName.toLowerCase().includes(searchLower) ||
        (student.parentName && student.parentName.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
    }

    // School filter
    if (filterSchool && filterSchool !== "all") {
      const hasSchool = student.enrollments?.some(enrollment =>
        enrollment.school.id.toString() === filterSchool
      );
      if (!hasSchool) return false;
    }

    return true;
  }), [students, searchQuery, filterSchool]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSchool]);


  // Get student's schools and classes
  const getStudentInfo = (student: Student) => {
    const schools = new Set();
    const classes = new Set();
    
    student.enrollments?.forEach(enrollment => {
      if (enrollment.status === "active") {
        schools.add(enrollment.school.name);
        classes.add(enrollment.class.name);
      }
    });

    return {
      schools: Array.from(schools),
      classes: Array.from(classes)
    };
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка учеников...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Управление учениками</h2>
          <p className="text-gray-600">Добавление, редактирование и удаление учеников</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить ученика
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStudent ? "Редактировать ученика" : "Добавить ученика"}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию об ученике
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Краткое имя *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Например: Ahmad S"
                  />
                </div>
                <div>
                  <Label htmlFor="fullName">Полное имя *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Полное имя ученика"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth">Дата рождения</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentName">Имя родителя</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                    placeholder="Имя родителя или опекуна"
                  />
                </div>
                <div>
                  <Label htmlFor="parentPhone">Телефон родителя</Label>
                  <Input
                    id="parentPhone"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentPhone: e.target.value }))}
                    placeholder="+7 (xxx) xxx-xx-xx"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parentEmail">Email родителя</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="enrollmentDate">Дата поступления</Label>
                  <Input
                    id="enrollmentDate"
                    type="date"
                    value={formData.enrollmentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, enrollmentDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicYear">Учебный год</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                    placeholder="2025-2026"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Адрес</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Полный адрес"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                onClick={editingStudent ? handleUpdateStudent : handleAddStudent}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingStudent ? "Обновить" : "Добавить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Поиск по имени или родителю..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterSchool} onValueChange={setFilterSchool}>
              <SelectTrigger>
                <SelectValue placeholder="Все медресе" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все медресе</SelectItem>
                {schools.map(school => (
                  <SelectItem key={school.id} value={school.id.toString()}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>


          </div>
        </CardContent>
      </Card>

      {error && !isAddDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Students Cards */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {students.length === 0 ? "Нет учеников" : "Ученики не найдены"}
            </h3>
            <p className="text-gray-500 mb-4">
              {students.length === 0
                ? "Добавьте первого ученика в систему"
                : "Попробуйте изменить фильтры поиска"
              }
            </p>
            {students.length === 0 && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить ученика
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {paginatedStudents.map((student) => {
            const studentInfo = getStudentInfo(student);
            return (
              <Card key={student.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                    <CardTitle className="text-lg">{student.fullName}</CardTitle>
                  </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-6">
                  {/* Content Area - grows to fill available space */}
                  <div className="flex-1 space-y-3">
                    {/* Schools and Classes */}
                    <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="h-4 w-4 mr-2" />
                      <span className="font-medium">Медресе:</span>
                      <span className="ml-1">
                        {studentInfo.schools.length > 0
                          ? studentInfo.schools.slice(0, 2).join(", ")
                          : "Не записан"
                        }
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      <span className="font-medium">Группы:</span>
                      <span className="ml-1">
                        {studentInfo.classes.length > 0
                          ? studentInfo.classes.slice(0, 2).join(", ")
                          : "Не записан"
                        }
                      </span>
                    </div>
                  </div>

                  {/* Parent Info */}
                  {student.parentName && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span className="font-medium">Родитель:</span>
                        <span className="ml-1">{student.parentName}</span>
                      </div>
                      {student.parentPhone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>{student.parentPhone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  {student.address && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="break-words">{student.address}</span>
                    </div>
                  )}

                    {/* Enrollment Date */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="font-medium">Поступил:</span>
                      <span className="ml-1">
                        {new Date(student.enrollmentDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditStudent(student)}
                      className="flex-1 h-10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteStudent(student.id, student.fullName)}
                      className="flex-1 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredStudents.length}
            className="mt-6"
          />
        </>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-sm text-gray-600">
            <span>
              Всего найдено: {filteredStudents.length} из {students.length} учеников
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
