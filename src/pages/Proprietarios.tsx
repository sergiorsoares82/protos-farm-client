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
  MapPin,
  Sprout,
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

const OWNERSHIP_TYPE_LABELS: Record<string, string> = {
  OWNED: 'Própria',
  LEASED: 'Arrendada',
  PARTNERSHIP: 'Parceria',
};

export const Proprietarios = () => {
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
    farmName: '',
    farmLocation: '',
    totalArea: '' as string | number,
    ownershipType: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const farmOwners = useMemo(
    () => persons.filter((p) => p.roles?.FARM_OWNER),
    [persons]
  );

  const filteredFarmOwners = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return farmOwners.filter(
      (p) =>
        p.nome.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        (p.roles?.FARM_OWNER?.farmName ?? '').toLowerCase().includes(term)
    );
  }, [farmOwners, searchTerm]);

  const totalPages = Math.ceil(filteredFarmOwners.length / ITEMS_PER_PAGE);
  const paginatedFarmOwners = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFarmOwners.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFarmOwners, currentPage]);

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
      setError(err instanceof Error ? err.message : 'Falha ao carregar proprietários');
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
      farmName: '',
      farmLocation: '',
      totalArea: '',
      ownershipType: '',
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
    if (!formData.farmName.trim()) errors.farmName = 'Nome da fazenda é obrigatório';
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
            type: PersonRole.FARM_OWNER,
            data: {
              farmName: formData.farmName.trim(),
              ...(formData.farmLocation.trim() && { farmLocation: formData.farmLocation.trim() }),
              ...(formData.totalArea !== '' && formData.totalArea !== null && {
                totalArea: Number(formData.totalArea),
              }),
              ...(formData.ownershipType && { ownershipType: formData.ownershipType }),
            },
          },
        ],
      };
      await apiService.createPerson(newPerson);
      await loadPersons();
      setShowCreateModal(false);
      resetForm();
    } catch (err: unknown) {
      console.error('Error creating farm owner:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao cadastrar proprietário');
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
    if (!formData.farmName.trim()) errors.farmName = 'Nome da fazenda é obrigatório';
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
      await apiService.removeRole(selectedPerson.id, PersonRole.FARM_OWNER);
      await apiService.assignRole(selectedPerson.id, PersonRole.FARM_OWNER, {
        farmName: formData.farmName.trim(),
        ...(formData.farmLocation.trim() && { farmLocation: formData.farmLocation.trim() }),
        ...(formData.totalArea !== '' && formData.totalArea != null && {
          totalArea: Number(formData.totalArea),
        }),
        ...(formData.ownershipType && { ownershipType: formData.ownershipType }),
      });
      await loadPersons();
      setShowEditModal(false);
      setSelectedPerson(null);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar proprietário');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este proprietário?')) return;
    try {
      setError(null);
      await apiService.deletePerson(id);
      await loadPersons();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir proprietário');
    }
  };

  const openEdit = (person: Person) => {
    const farmOwner = person.roles?.FARM_OWNER;
    setSelectedPerson(person);
    setFormData({
      nome: person.nome,
      personType: person.personType,
      cpfCnpj: person.cpfCnpj ?? '',
      email: person.email,
      phone: person.phone ?? '',
      farmName: farmOwner?.farmName ?? '',
      farmLocation: farmOwner?.farmLocation ?? '',
      totalArea:
        farmOwner?.totalArea != null ? String(farmOwner.totalArea) : '',
      ownershipType: farmOwner?.ownershipType ?? '',
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
            <h1 className="text-3xl font-bold">Proprietários</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie os proprietários da fazenda vinculados à entidade pessoa
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo proprietário
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
            placeholder="Buscar por nome, e-mail ou nome da fazenda..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {paginatedFarmOwners.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Sprout className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Nenhum proprietário encontrado com esse filtro.'
                  : 'Nenhum proprietário cadastrado. Clique em "Novo proprietário" para cadastrar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {paginatedFarmOwners.map((person) => {
              const farmOwner = person.roles?.FARM_OWNER;
              return (
                <Card key={person.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">{person.nome}</h3>
                        {farmOwner && (
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Sprout className="h-4 w-4" />
                              {farmOwner.farmName}
                            </span>
                            {farmOwner.farmLocation && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {farmOwner.farmLocation}
                              </span>
                            )}
                            {farmOwner.totalArea != null && (
                              <span>Área: {Number(farmOwner.totalArea).toLocaleString('pt-BR')} ha</span>
                            )}
                            {farmOwner.ownershipType && (
                              <span>
                                {OWNERSHIP_TYPE_LABELS[farmOwner.ownershipType] ?? farmOwner.ownershipType}
                              </span>
                            )}
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
            <CardDescription>Total de proprietários cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{farmOwners.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Novo proprietário */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar proprietário</DialogTitle>
            <DialogDescription>
              Preencha os dados da pessoa e da fazenda. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Dados da pessoa</h4>
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
              <h4 className="text-sm font-medium text-muted-foreground">Dados da fazenda</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="create-farmName">Nome da fazenda *</Label>
                  <Input
                    id="create-farmName"
                    value={formData.farmName}
                    onChange={(e) => {
                      setFormData({ ...formData, farmName: e.target.value });
                      if (fieldErrors.farmName) setFieldErrors({ ...fieldErrors, farmName: '' });
                    }}
                    placeholder="Ex.: Fazenda Santa Maria"
                    className={fieldErrors.farmName ? 'border-destructive' : ''}
                  />
                  {fieldErrors.farmName && (
                    <p className="text-sm text-destructive">{fieldErrors.farmName}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="create-farmLocation">Localização</Label>
                  <Input
                    id="create-farmLocation"
                    value={formData.farmLocation}
                    onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                    placeholder="Ex.: Município, Estado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-totalArea">Área total (ha)</Label>
                  <Input
                    id="create-totalArea"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalArea}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalArea: e.target.value === '' ? '' : e.target.value,
                      })
                    }
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-ownershipType">Tipo de posse</Label>
                  <Select
                    value={formData.ownershipType}
                    onValueChange={(v) => setFormData({ ...formData, ownershipType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNED">Própria</SelectItem>
                      <SelectItem value="LEASED">Arrendada</SelectItem>
                      <SelectItem value="PARTNERSHIP">Parceria</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Modal: Editar proprietário */}
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
            <DialogTitle>Editar proprietário</DialogTitle>
            <DialogDescription>
              Altere os dados da pessoa e da fazenda. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Dados da pessoa</h4>
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
              <h4 className="text-sm font-medium text-muted-foreground">Dados da fazenda</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="edit-farmName">Nome da fazenda *</Label>
                  <Input
                    id="edit-farmName"
                    value={formData.farmName}
                    onChange={(e) => {
                      setFormData({ ...formData, farmName: e.target.value });
                      if (fieldErrors.farmName) setFieldErrors({ ...fieldErrors, farmName: '' });
                    }}
                    placeholder="Ex.: Fazenda Santa Maria"
                    className={fieldErrors.farmName ? 'border-destructive' : ''}
                  />
                  {fieldErrors.farmName && (
                    <p className="text-sm text-destructive">{fieldErrors.farmName}</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-farmLocation">Localização</Label>
                  <Input
                    id="edit-farmLocation"
                    value={formData.farmLocation}
                    onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
                    placeholder="Ex.: Município, Estado"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-totalArea">Área total (ha)</Label>
                  <Input
                    id="edit-totalArea"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalArea}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        totalArea: e.target.value === '' ? '' : e.target.value,
                      })
                    }
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ownershipType">Tipo de posse</Label>
                  <Select
                    value={formData.ownershipType}
                    onValueChange={(v) => setFormData({ ...formData, ownershipType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OWNED">Própria</SelectItem>
                      <SelectItem value="LEASED">Arrendada</SelectItem>
                      <SelectItem value="PARTNERSHIP">Parceria</SelectItem>
                    </SelectContent>
                  </Select>
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
