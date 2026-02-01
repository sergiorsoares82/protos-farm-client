import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Search,
  Loader2,
  Briefcase,
  Calendar,
  X,
} from 'lucide-react';
import {
  apiService,
  Person,
  PersonRole,
  PersonType,
  CreatePersonRequest,
  UpdatePersonRequest,
} from '@/services/api';

const ITEMS_PER_PAGE = 10;

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Tempo integral',
  PART_TIME: 'Meio período',
  CONTRACT: 'Contrato',
  SEASONAL: 'Sazonal',
};

export const Funcionarios = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    nome: '',
    personType: PersonType.FISICA as PersonType,
    cpfCnpj: '',
    email: '',
    phone: '',
    position: '',
    hireDate: '',
    hourlyRate: '' as string | number,
    employmentType: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const employees = useMemo(
    () => persons.filter((p) => p.roles?.WORKER),
    [persons]
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.roles?.WORKER?.position ?? '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    loadPersons();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadPersons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPersons();
      setPersons(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar funcionários');
      console.error('Error loading persons:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      personType: PersonType.FISICA,
      cpfCnpj: '',
      email: '',
      phone: '',
      position: '',
      hireDate: '',
      hourlyRate: '',
      employmentType: '',
    });
    setFieldErrors({});
    setFormError(null);
  };

  const validateCreate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!formData.email.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Informe um e-mail válido';
      } else if (formData.email.includes('..')) {
        errors.email = 'E-mail não pode conter pontos consecutivos (..)';
      }
    }
    if (!formData.position.trim()) errors.position = 'Cargo é obrigatório';
    if (!formData.hireDate) errors.hireDate = 'Data de admissão é obrigatória';
    if (!formData.employmentType) errors.employmentType = 'Tipo de vínculo é obrigatório';
    setFieldErrors(errors);
    setFormError(Object.keys(errors).length > 0 ? 'Corrija os campos indicados.' : null);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    try {
      setFormError(null);
      const newPerson: CreatePersonRequest = {
        nome: formData.nome.trim(),
        personType: formData.personType,
        cpfCnpj: formData.cpfCnpj || undefined,
        email: formData.email.trim(),
        phone: formData.phone || undefined,
        roles: [
          {
            type: PersonRole.WORKER,
            data: {
              position: formData.position.trim(),
              hireDate: formData.hireDate,
              employmentType: formData.employmentType,
              ...(formData.hourlyRate !== '' && formData.hourlyRate !== null && {
                hourlyRate: Number(formData.hourlyRate),
              }),
            },
          },
        ],
      };
      await apiService.createPerson(newPerson);
      await loadPersons();
      setShowCreateModal(false);
      resetForm();
    } catch (err: unknown) {
      console.error('Error creating employee:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao cadastrar funcionário');
    }
  };

  const handleUpdate = async () => {
    if (!selectedPerson) return;
    const errors: Record<string, string> = {};
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!formData.email.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) errors.email = 'Informe um e-mail válido';
    }
    if (!formData.position.trim()) errors.position = 'Cargo é obrigatório';
    if (!formData.hireDate) errors.hireDate = 'Data de admissão é obrigatória';
    if (!formData.employmentType) errors.employmentType = 'Tipo de vínculo é obrigatório';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    try {
      setError(null);
      const updates: UpdatePersonRequest = {
        nome: formData.nome.trim(),
        personType: formData.personType,
        cpfCnpj: formData.cpfCnpj || undefined,
        email: formData.email.trim(),
        phone: formData.phone || undefined,
      };
      await apiService.updatePerson(selectedPerson.id, updates);
      await apiService.removeRole(selectedPerson.id, PersonRole.WORKER);
      await apiService.assignRole(selectedPerson.id, PersonRole.WORKER, {
        position: formData.position.trim(),
        hireDate: formData.hireDate,
        employmentType: formData.employmentType,
        ...(formData.hourlyRate !== '' && formData.hourlyRate != null && {
          hourlyRate: Number(formData.hourlyRate),
        }),
      });
      await loadPersons();
      setShowEditModal(false);
      setSelectedPerson(null);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar funcionário');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) return;
    try {
      setError(null);
      await apiService.deletePerson(id);
      await loadPersons();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir funcionário');
    }
  };

  const openEdit = (person: Person) => {
    const worker = person.roles?.WORKER;
    setSelectedPerson(person);
    setFormData({
      nome: person.nome,
      personType: person.personType,
      cpfCnpj: person.cpfCnpj ?? '',
      email: person.email,
      phone: person.phone ?? '',
      position: worker?.position ?? '',
      hireDate: worker?.hireDate
        ? new Date(worker.hireDate).toISOString().slice(0, 10)
        : '',
      hourlyRate:
        worker?.hourlyRate != null ? String(worker.hourlyRate) : '',
      employmentType: worker?.employmentType ?? '',
    });
    setFieldErrors({});
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">Funcionários</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie os funcionários da fazenda
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo funcionário
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="ghost" size="icon" onClick={() => setError(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {paginatedEmployees.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Nenhum funcionário encontrado com esse filtro.'
                  : 'Nenhum funcionário cadastrado. Clique em "Novo funcionário" para cadastrar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {paginatedEmployees.map((person) => {
              const worker = person.roles?.WORKER;
              return (
                <Card key={person.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{person.nome}</h3>
                        {worker && (
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-4 w-4" />
                              {worker.position}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {worker.hireDate
                                ? new Date(worker.hireDate).toLocaleDateString('pt-BR')
                                : '—'}
                            </span>
                            <span>
                              {EMPLOYMENT_TYPE_LABELS[worker.employmentType] ?? worker.employmentType}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {person.email}
                          </span>
                          {person.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {person.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openEdit(person)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(person.id)}
                          title="Excluir"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Total de funcionários cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{employees.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Novo funcionário */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar funcionário</DialogTitle>
            <DialogDescription>
              Preencha os dados do funcionário. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Dados pessoais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="create-nome">Nome *</Label>
                  <Input
                    id="create-nome"
                    value={formData.nome}
                    onChange={(e) => {
                      setFormData({ ...formData, nome: e.target.value });
                      if (fieldErrors.nome) setFieldErrors({ ...fieldErrors, nome: '' });
                    }}
                    placeholder="Nome completo"
                    className={fieldErrors.nome ? 'border-destructive' : ''}
                  />
                  {fieldErrors.nome && (
                    <p className="text-sm text-destructive">{fieldErrors.nome}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tipo de pessoa</Label>
                  <Select
                    value={formData.personType}
                    onValueChange={(v) => setFormData({ ...formData, personType: v as PersonType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PersonType.FISICA}>Pessoa física</SelectItem>
                      <SelectItem value={PersonType.JURIDICA}>Pessoa jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-cpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="create-cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-email">E-mail *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                    }}
                    placeholder="email@exemplo.com"
                    className={fieldErrors.email ? 'border-destructive' : ''}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-phone">Telefone</Label>
                  <Input
                    id="create-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Dados profissionais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="create-position">Cargo *</Label>
                  <Input
                    id="create-position"
                    value={formData.position}
                    onChange={(e) => {
                      setFormData({ ...formData, position: e.target.value });
                      if (fieldErrors.position) setFieldErrors({ ...fieldErrors, position: '' });
                    }}
                    placeholder="Ex.: Operador de máquina, Gerente"
                    className={fieldErrors.position ? 'border-destructive' : ''}
                  />
                  {fieldErrors.position && (
                    <p className="text-sm text-destructive">{fieldErrors.position}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-hireDate">Data de admissão *</Label>
                  <Input
                    id="create-hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => {
                      setFormData({ ...formData, hireDate: e.target.value });
                      if (fieldErrors.hireDate) setFieldErrors({ ...fieldErrors, hireDate: '' });
                    }}
                    className={fieldErrors.hireDate ? 'border-destructive' : ''}
                  />
                  {fieldErrors.hireDate && (
                    <p className="text-sm text-destructive">{fieldErrors.hireDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-employmentType">Tipo de vínculo *</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(v) => {
                      setFormData({ ...formData, employmentType: v });
                      if (fieldErrors.employmentType)
                        setFieldErrors({ ...fieldErrors, employmentType: '' });
                    }}
                  >
                    <SelectTrigger className={fieldErrors.employmentType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Tempo integral</SelectItem>
                      <SelectItem value="PART_TIME">Meio período</SelectItem>
                      <SelectItem value="CONTRACT">Contrato</SelectItem>
                      <SelectItem value="SEASONAL">Sazonal</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.employmentType && (
                    <p className="text-sm text-destructive">{fieldErrors.employmentType}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-hourlyRate">Salário por hora (opcional)</Label>
                  <Input
                    id="create-hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyRate: e.target.value === '' ? '' : e.target.value,
                      })
                    }
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar funcionário */}
      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) {
            setSelectedPerson(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar funcionário</DialogTitle>
            <DialogDescription>
              Altere os dados do funcionário. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Dados pessoais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="edit-nome">Nome *</Label>
                  <Input
                    id="edit-nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome completo"
                    className={fieldErrors.nome ? 'border-destructive' : ''}
                  />
                  {fieldErrors.nome && (
                    <p className="text-sm text-destructive">{fieldErrors.nome}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Tipo de pessoa</Label>
                  <Select
                    value={formData.personType}
                    onValueChange={(v) => setFormData({ ...formData, personType: v as PersonType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PersonType.FISICA}>Pessoa física</SelectItem>
                      <SelectItem value={PersonType.JURIDICA}>Pessoa jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cpfCnpj">CPF/CNPJ</Label>
                  <Input
                    id="edit-cpfCnpj"
                    value={formData.cpfCnpj}
                    onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-email">E-mail *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className={fieldErrors.email ? 'border-destructive' : ''}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Dados profissionais</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="edit-position">Cargo *</Label>
                  <Input
                    id="edit-position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    placeholder="Ex.: Operador de máquina"
                    className={fieldErrors.position ? 'border-destructive' : ''}
                  />
                  {fieldErrors.position && (
                    <p className="text-sm text-destructive">{fieldErrors.position}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-hireDate">Data de admissão *</Label>
                  <Input
                    id="edit-hireDate"
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className={fieldErrors.hireDate ? 'border-destructive' : ''}
                  />
                  {fieldErrors.hireDate && (
                    <p className="text-sm text-destructive">{fieldErrors.hireDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-employmentType">Tipo de vínculo *</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(v) => setFormData({ ...formData, employmentType: v })}
                  >
                    <SelectTrigger className={fieldErrors.employmentType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FULL_TIME">Tempo integral</SelectItem>
                      <SelectItem value="PART_TIME">Meio período</SelectItem>
                      <SelectItem value="CONTRACT">Contrato</SelectItem>
                      <SelectItem value="SEASONAL">Sazonal</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.employmentType && (
                    <p className="text-sm text-destructive">{fieldErrors.employmentType}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-hourlyRate">Salário por hora (opcional)</Label>
                  <Input
                    id="edit-hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyRate: e.target.value === '' ? '' : e.target.value,
                      })
                    }
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedPerson(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
