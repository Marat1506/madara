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
  Building2,
  Users,
  GraduationCap,
  UserCheck,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

interface School {
  id: number;
  name: string;
  type: "madrasa" | "islamic_school" | "regular_school";
  foundedYear: number;
  languages: string[];
  address?: string;
  phone?: string;
  email?: string;
  studentsCount: number;
  teachersCount: number;
  classesCount: number;
}

export function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    type: "madrasa" as "madrasa" | "islamic_school" | "regular_school",
    foundedYear: new Date().getFullYear(),
    languages: [] as string[],
    address: "",
    phone: "",
    email: ""
  });

  // Available languages
  const availableLanguages = ["Русский", "Арабский", "Английский"];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  // Pagination calculations
  const totalPages = Math.ceil(schools.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchools = schools.slice(startIndex, startIndex + itemsPerPage);

  // Fetch schools
  const fetchSchools = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("auth_token");
      
      const response = await fetch("/api/schools", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSchools(data.data.schools || []);
      } else {
        setError("Ошибка загрузки школ");
      }
    } catch (err) {
      setError("Ошибка загрузки школ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      type: "madrasa",
      foundedYear: new Date().getFullYear(),
      languages: [],
      address: "",
      phone: "",
      email: ""
    });
    setEditingSchool(null);
  };

  // Handle add school
  const handleAddSchool = async () => {
    if (!formData.name.trim() || formData.languages.length === 0) {
      setError("Заполните обязательные поля: название и языки обучения");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchSchools();
        setIsDialogOpen(false);
        resetForm();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Ошибка создания школы");
      }
    } catch (err) {
      setError("Ошибка создания школы");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit school
  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      type: school.type,
      foundedYear: school.foundedYear,
      languages: school.languages,
      address: school.address || "",
      phone: school.phone || "",
      email: school.email || ""
    });
    setIsDialogOpen(true);
  };

  // Handle update school
  const handleUpdateSchool = async () => {
    if (!editingSchool || !formData.name.trim()) {
      setError("Заполните обязательные поля");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/schools/${editingSchool.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchSchools();
        setIsDialogOpen(false);
        resetForm();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Ошибка обновления школы");
      }
    } catch (err) {
      setError("Ошибка обновления школы");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete school
  const handleDeleteSchool = async (schoolId: number, schoolName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить "${schoolName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchSchools();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.error?.message || "Ошибка удаления школы");
      }
    } catch (err) {
      setError("Ошибка удаления школы");
    }
  };

  // Handle language selection
  const handleLanguageChange = (language: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      languages: checked 
        ? [...prev.languages, language]
        : prev.languages.filter(l => l !== language)
    }));
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "madrasa": return "Медресе";
      case "islamic_school": return "Исламская школа";
      case "regular_school": return "Обычная школа";
      default: return type;
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Загрузка учебных заведений...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Управление учебными заведениями</h2>
          <p className="text-sm md:text-base text-gray-600">Добавление, редактирование и удаление медресе и школ</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить учреждение
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] md:w-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchool ? "Редактировать учреждение" : "Добавить учреждение"}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию об учебном заведении
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Название учреждения"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Тип учреждения</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="madrasa">Медресе</SelectItem>
                      <SelectItem value="islamic_school">Исламская школа</SelectItem>
                      <SelectItem value="regular_school">Обычная школа</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="foundedYear">Год основания</Label>
                  <Input
                    id="foundedYear"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.foundedYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, foundedYear: parseInt(e.target.value) || new Date().getFullYear() }))}
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="info@school.ru"
                />
              </div>

              <div>
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Полный адрес учреждения"
                />
              </div>

              {editingSchool && (
                <div>
                  <Label>Статистика учреждения</Label>
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Количество учеников</div>
                      <div className="text-lg font-semibold text-gray-900">{editingSchool.studentsCount}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Преподавателей</div>
                      <div className="text-lg font-semibold text-gray-900">{editingSchool.teachersCount}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Классов</div>
                      <div className="text-lg font-semibold text-gray-900">{editingSchool.classesCount}</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>Языки обучения *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {availableLanguages.map(language => (
                    <div key={language} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={language}
                        checked={formData.languages.includes(language)}
                        onChange={(e) => handleLanguageChange(language, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={language}>{language}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                onClick={editingSchool ? handleUpdateSchool : handleAddSchool}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSchool ? "Обновить" : "Добавить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && !isDialogOpen && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Schools List */}
      <div className="grid gap-4">
        {schools.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет учебных заведений</h3>
              <p className="text-gray-500 mb-4">Добавьте первое учебное заведение в систему</p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить учреждение
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {paginatedSchools.map(school => (
              <Card key={school.id} className="hover:shadow-md transition-shadow flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-green-500" />
                      {school.name}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mt-1">
                      {getTypeDisplayName(school.type)} • Основано в {school.foundedYear}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-6">
                  {/* Content Area - grows to fill available space */}
                  <div className="flex-1 space-y-4">
                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center text-sm text-gray-500 mb-1">
                        <Users className="h-4 w-4 mr-1" />
                        Ученики
                      </div>
                      <div className="font-semibold">{school.studentsCount}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center text-sm text-gray-500 mb-1">
                        <UserCheck className="h-4 w-4 mr-1" />
                        Учителя
                      </div>
                      <div className="font-semibold">{school.teachersCount}</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center text-sm text-gray-500 mb-1">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        Классы
                      </div>
                      <div className="font-semibold">{school.classesCount}</div>
                    </div>
                  </div>

                  {/* Languages */}
                  {school.languages && school.languages.length > 0 && (
                    <div>
                      <div className="font-medium text-sm text-gray-700 mb-2">Языки обучения:</div>
                      <div className="flex flex-wrap gap-1">
                        {school.languages.slice(0, 3).map((language, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                        {school.languages.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{school.languages.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                    {/* Contact Information */}
                    <div className="space-y-2">
                    {school.address && (
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="break-words">{school.address}</span>
                      </div>
                    )}
                    {school.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        <span>{school.phone}</span>
                      </div>
                    )}
                    {school.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="break-words">{school.email}</span>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t mt-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSchool(school)}
                      className="flex-1 h-10"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSchool(school.id, school.name)}
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
              totalItems={schools.length}
              className="mt-6"
            />
          </>
        )}
      </div>
    </div>
  );
}
