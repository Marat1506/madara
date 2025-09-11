import React, { useState, useEffect } from "react";
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
import {
  Plus,
  Edit,
  Trash2,
  GraduationCap,
  Users,
  User,
  Building2,
  Calendar,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

interface Class {
  id: number;
  name: string;
  school: { id: number; name: string };
  teacher?: { id: number; name: string };
  subjects: { id: number; name: string; nameArabic?: string }[];
  students: { id: number; name: string; fullName: string }[];
  maxStudents: number;
  currentStudents: number;
  academicYear: string;
}

export function ClassManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<{id: number; name: string}[]>([]);
  const [subjects, setSubjects] = useState<{id: number; name: string}[]>([]);
  const [schools, setSchools] = useState<{id: number; name: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    schoolId: 0,
    teacherId: 0,
    maxStudents: 30,
    academicYear: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    subjectIds: [] as number[],
    primarySubjectId: 0
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  // Pagination calculations
  const totalPages = Math.ceil(classes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClasses = classes.slice(startIndex, startIndex + itemsPerPage);

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch("/api/classes", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(data.data.classes || []);
      } else {
        setError("Ошибка загрузки классов");
      }
    } catch (err) {
      setError("Ошибка загрузки классов");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  // Handle edit class
  const handleEditClass = (cls: Class) => {
    setEditingClass(cls);
    setFormData({
      name: cls.name,
      schoolId: cls.school.id,
      teacherId: cls.teacher?.id || 0,
      maxStudents: cls.maxStudents,
      academicYear: cls.academicYear,
      subjectIds: cls.subjects.map(s => s.id),
      primarySubjectId: cls.subjects[0]?.id || 0
    });
    setIsDialogOpen(true);
  };

  // Handle update class
  const handleUpdateClass = async () => {
    if (!editingClass || !formData.name.trim()) {
      setError("Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/classes/${editingClass.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          maxStudents: formData.maxStudents,
          academicYear: formData.academicYear
        })
      });

      if (response.ok) {
        await fetchClasses();
        setIsDialogOpen(false);
        setEditingClass(null);
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Ошибка обновления класса");
      }
    } catch (err) {
      setError("Ошибка обновления класса");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete class
  const handleDeleteClass = async (classId: number, className: string) => {
    if (!confirm(`Вы уверены, что хотите удалить класс "${className}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchClasses();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Ошибка удаления класса");
      }
    } catch (err) {
      setError("Ошибка удаления класса");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка классов...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Управление классами</h2>
          <p className="text-sm md:text-base text-gray-600">Редактирование информации о классах</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Classes List */}
      <div className="grid gap-4">
        {classes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет классов</h3>
              <p className="text-gray-500">Классы пока не созданы в системе</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {paginatedClasses.map(cls => (
              <Card key={cls.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-blue-500" />
                      {cls.name}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {cls.school.name}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-6">
                  {/* Content Area - grows to fill available space */}
                  <div className="flex-1 space-y-4">
                    {/* Students Info */}
                    <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="font-medium">Ученики:</span>
                    <span className="ml-1">
                      {cls.currentStudents} из {cls.maxStudents}
                    </span>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span className="font-medium">Преподаватель:</span>
                    <span className="ml-1">
                      {cls.teacher ? cls.teacher.name : "Не назначен"}
                    </span>
                  </div>

                  {/* Academic Year */}
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Учебный год:</span>
                    <span className="ml-1">{cls.academicYear}</span>
                  </div>

                  {/* Subjects */}
                  {cls.subjects.length > 0 && (
                    <div>
                      <div className="font-medium text-sm text-gray-700 mb-2">Предметы:</div>
                      <div className="flex flex-wrap gap-1">
                        {cls.subjects.slice(0, 3).map(subject => (
                          <Badge key={subject.id} variant="secondary" className="text-xs">
                            {subject.name}
                          </Badge>
                        ))}
                        {cls.subjects.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{cls.subjects.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClass(cls)}
                      className="flex-1 h-10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      className="flex-1 h-10 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={classes.length}
              className="mt-6"
            />
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] md:w-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать класс</DialogTitle>
            <DialogDescription>
              Изменение информации о классе
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="name">Название класса</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Название класса"
              />
            </div>

            <div>
              <Label htmlFor="maxStudents">Максимум учеников</Label>
              <Input
                id="maxStudents"
                type="number"
                min="1"
                max="100"
                value={formData.maxStudents}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="academicYear">Учебный год</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                  placeholder="2025-2026"
                />
              </div>

              {editingClass && (
                <div>
                  <Label>Текущее количество учеников</Label>
                  <div className="p-2 border border-gray-200 rounded bg-gray-50 text-sm">
                    {editingClass.currentStudents} из {formData.maxStudents}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="teacherId">Преподаватель</Label>
              <Select
                value={formData.teacherId.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, teacherId: parseInt(value) || 0 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите преподавателя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Не назначен</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subjects.length > 0 && (
              <>
                <div>
                  <Label htmlFor="primarySubjectId">Основной предмет</Label>
                  <Select
                    value={formData.primarySubjectId.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, primarySubjectId: parseInt(value) || 0 }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите основной предмет" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Предметы для изучения</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-3">
                    {subjects.map(subject => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`subject-${subject.id}`}
                          checked={formData.subjectIds.includes(subject.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, subjectIds: [...prev.subjectIds, subject.id] }));
                            } else {
                              setFormData(prev => ({ ...prev, subjectIds: prev.subjectIds.filter(id => id !== subject.id) }));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor={`subject-${subject.id}`} className="text-sm">{subject.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleUpdateClass}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
