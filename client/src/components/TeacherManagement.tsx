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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building2,
  Loader2,
  Users,
  User
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

interface Teacher {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  subjects: string[];
  schoolIds: number[];
  qualifications?: string[];
  joinDate: string;
  classesCount: number;
  studentsCount: number;
  schools: { id: number; name: string }[];
}

interface School {
  id: number;
  name: string;
}

export function TeacherManagement() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subjects: [] as string[],
    schoolIds: [] as number[],
    qualifications: [] as string[]
  });

  // User account management state
  const [createAccount, setCreateAccount] = useState(false);
  const [accountData, setAccountData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  // Islamic subjects for selection
  const islamicSubjects = [
    "Коран", "Намаз", "Таджвид", "Хадис", "Муаллим Сани",
    "Основы религии", "Дуа и Азкар", "Алиф-Ба", "Табарак джуз",
    "Амма джуз", "Фикх", "Акыда", "Исламская история",
    "Арабская грамматика", "Сира"
  ];

  // Pagination calculations
  const totalPages = Math.ceil(teachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeachers = teachers.slice(startIndex, startIndex + itemsPerPage);

  // Fetch teachers and schools
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");
      
      const [teachersResponse, schoolsResponse] = await Promise.all([
        fetch("/api/teachers", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/schools", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (teachersResponse.ok && schoolsResponse.ok) {
        const teachersData = await teachersResponse.json();
        const schoolsData = await schoolsResponse.json();
        
        setTeachers(teachersData.data.teachers || []);
        setSchools(schoolsData.data.schools || []);
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
      email: "",
      phone: "",
      subjects: [],
      schoolIds: [],
      qualifications: []
    });
    setCreateAccount(false);
    setAccountData({
      username: "",
      password: "",
      confirmPassword: ""
    });
    setEditingTeacher(null);
  };

  // Handle add teacher
  const handleAddTeacher = async () => {
    if (!formData.name.trim() || formData.subjects.length === 0 || formData.schoolIds.length === 0) {
      setError("Заполните обязательные поля: имя, предметы и школы");
      return;
    }

    // Validate account creation fields if creating account
    if (createAccount) {
      if (!accountData.username.trim() || !accountData.password.trim()) {
        setError("Заполните логин и пароль для создания аккаунта");
        return;
      }
      if (accountData.password !== accountData.confirmPassword) {
        setError("Пароли не совпадают");
        return;
      }
      if (accountData.password.length < 6) {
        setError("Пароль должен содержать минимум 6 символов");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");

      // Create teacher first
      const teacherResponse = await fetch("/api/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!teacherResponse.ok) {
        const errorData = await teacherResponse.json();
        setError(errorData.error?.message || "Ошибка создания преподавателя");
        return;
      }

      // Create user account if requested
      if (createAccount) {
        const userResponse = await fetch("/api/auth/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            username: accountData.username,
            password: accountData.password,
            role: "teacher",
            name: formData.name,
            email: formData.email,
            schoolIds: formData.schoolIds,
            permissions: [
              "view_students",
              "manage_grades",
              "view_classes",
              "view_schedules"
            ]
          })
        });

        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          setError(`Преподаватель создан, но ошибка создания аккаунта: ${errorData.error?.message || "Неизвестная ошибка"}`);
          await fetchData();
          return;
        }
      }

      await fetchData();
      setIsAddDialogOpen(false);
      resetForm();
      setError("");
    } catch (err) {
      setError("Ошибка создания преподавателя");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit teacher
  const handleEditTeacher = (teacher: Teacher) => {
    // Clear any previous errors
    setError("");
    // Set editing state and form data
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name,
      email: teacher.email || "",
      phone: teacher.phone || "",
      subjects: teacher.subjects,
      schoolIds: teacher.schoolIds,
      qualifications: teacher.qualifications || []
    });
    // Open the dialog
    setIsAddDialogOpen(true);
  };

  // Handle update teacher
  const handleUpdateTeacher = async () => {
    if (!editingTeacher || !formData.name.trim()) {
      setError("Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/teachers/${editingTeacher.id}`, {
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
        setError(errorData.error?.message || "Ошибка обновления преподавателя");
      }
    } catch (err) {
      setError("Ошибка обновления преподавателя");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete teacher
  const handleDeleteTeacher = async (teacherId: number, teacherName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить преподавателя "${teacherName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/teachers/${teacherId}`, {
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
        setError(errorData.error?.message || "Ошибка удаления преподавателя");
      }
    } catch (err) {
      setError("Ошибка удаления преподавателя");
    }
  };

  // Handle subject selection
  const handleSubjectChange = (subject: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      subjects: checked 
        ? [...prev.subjects, subject]
        : prev.subjects.filter(s => s !== subject)
    }));
  };

  // Handle school selection
  const handleSchoolChange = (schoolId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      schoolIds: checked 
        ? [...prev.schoolIds, schoolId]
        : prev.schoolIds.filter(id => id !== schoolId)
    }));
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка преподавателей...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Управление преподавателями</h2>
          <p className="text-sm md:text-base text-gray-600">Добавление, редактирование и удаление преподавателей</p>
        </div>
        <Button onClick={() => {
          setEditingTeacher(null);
          setError("");
          resetForm();
          setIsAddDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Добавить преподавателя
        </Button>

        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            // Reset when closing dialog
            setEditingTeacher(null);
            setError("");
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] md:w-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? "Редактировать преподавателя" : "Добавить преподавателя"}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о преподавателе
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="name">Имя *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Полное имя преподавателя"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+7 (xxx) xxx-xx-xx"
                  />
                </div>
              </div>

              <div>
                <Label>Преподаваемые предметы *</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2 max-h-32 overflow-y-auto border rounded p-2">
                  {islamicSubjects.map(subject => (
                    <div key={subject} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject}
                        checked={formData.subjects.includes(subject)}
                        onCheckedChange={(checked) => handleSubjectChange(subject, checked as boolean)}
                      />
                      <Label htmlFor={subject} className="text-sm">{subject}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Школы *</Label>
                <div className="space-y-2 mt-2">
                  {schools.map(school => (
                    <div key={school.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`school-${school.id}`}
                        checked={formData.schoolIds.includes(school.id)}
                        onCheckedChange={(checked) => handleSchoolChange(school.id, checked as boolean)}
                      />
                      <Label htmlFor={`school-${school.id}`}>{school.name}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="qualifications">Квалификации</Label>
                <Input
                  id="qualifications"
                  value={formData.qualifications.join(", ")}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    qualifications: e.target.value.split(",").map(q => q.trim()).filter(Boolean)
                  }))}
                  placeholder="Хафиз Корана, Магистр исламских наук (разделите запятыми)"
                />
              </div>

              {/* Account Management Section */}
              {!editingTeacher && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox
                      id="createAccount"
                      checked={createAccount}
                      onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                    />
                    <Label htmlFor="createAccount" className="font-medium">
                      Создать аккаунт для входа в систему
                    </Label>
                  </div>

                  {createAccount && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <Label htmlFor="username">Логин *</Label>
                        <Input
                          id="username"
                          value={accountData.username}
                          onChange={(e) => setAccountData(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="Введите логин для преподавателя"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="password">Пароль *</Label>
                          <Input
                            id="password"
                            type="password"
                            value={accountData.password}
                            onChange={(e) => setAccountData(prev => ({ ...prev, password: e.target.value }))}
                            placeholder="Минимум 6 символов"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={accountData.confirmPassword}
                            onChange={(e) => setAccountData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Повторите пароль"
                          />
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>Права доступа:</strong> Просмотр студентов, управление оценками, просмотр классов и расписания</p>
                        <p><strong>Доступ к школам:</strong> Будет ограничен выбранными медресе</p>
                        <p>После создания аккаунта преподаватель сможет войти в систему используя указанный логин и пароль.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                onClick={editingTeacher ? handleUpdateTeacher : handleAddTeacher}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTeacher ? "Обновить преподавателя" : (createAccount ? "Создать преподавателя и аккаунт" : "Создать преподавателя")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isAddDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Teachers Table */}
      {teachers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет преподавателей</h3>
            <p className="text-gray-500 mb-4">Добавьте первого преподавателя в систему</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить преподавателя
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
            {paginatedTeachers.map((teacher) => (
            <Card key={teacher.id} className="hover:shadow-lg transition-shadow flex flex-col h-full">
              <CardHeader className="pb-3">
                <div>
                  <CardTitle className="text-lg">{teacher.name}</CardTitle>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <span>{teacher.classesCount} классов</span>
                    <span className="mx-2">•</span>
                    <span>{teacher.studentsCount} учеников</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6">
                {/* Content Area - grows to fill available space */}
                <div className="flex-1 space-y-4">
                  {/* Contact Info */}
                  {(teacher.email || teacher.phone) && (
                  <div className="space-y-2">
                    {teacher.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Schools */}
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="h-4 w-4 mr-2" />
                    Медресе
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {teacher.schools.slice(0, 2).map((school) => (
                      <Badge key={school.id} variant="secondary" className="text-xs">
                        {school.name}
                      </Badge>
                    ))}
                    {teacher.schools.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{teacher.schools.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Предметы
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.slice(0, 3).map((subject, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                    {teacher.subjects.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{teacher.subjects.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Qualifications */}
                {teacher.qualifications && teacher.qualifications.length > 0 && (
                  <div>
                    <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 mr-2" />
                      Квалификации
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {teacher.qualifications.slice(0, 2).map((qualification, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {qualification}
                        </Badge>
                      ))}
                      {teacher.qualifications.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{teacher.qualifications.length - 2}
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
                    onClick={() => handleEditTeacher(teacher)}
                    className="flex-1 h-10"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteTeacher(teacher.id, teacher.name)}
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
            totalItems={teachers.length}
            className="mt-6"
          />
        </>
      )}
    </div>
  );
}
