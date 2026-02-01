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
import { Checkbox } from '@/components/ui/checkbox';
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
  Building2,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Search,
  Loader2,
  User,
  X,
  ChevronLeft,
  ChevronRight,
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
const CLIENT_SUPPLIER_ROLES = [PersonRole.CLIENT, PersonRole.SUPPLIER];

type TabFilter = 'all' | PersonRole.CLIENT | PersonRole.SUPPLIER;

function hasClientOrSupplier(person: Person): boolean {
  const roles = Object.keys(person.roles);
  return roles.includes(PersonRole.CLIENT) || roles.includes(PersonRole.SUPPLIER);
}

export const ClientsSuppliers = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    nome: '',
    personType: 'FISICA' as 'FISICA' | 'JURIDICA',
    cpfCnpj: '',
    email: '',
    phone: '',
  });

  const [createAsClient, setCreateAsClient] = useState(true);
  const [createAsSupplier, setCreateAsSupplier] = useState(false);
  const [clientData, setClientData] = useState<Record<string, any>>({});
  const [supplierData, setSupplierData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPersons();
      setPersons(data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clientSupplierList = useMemo(
    () => persons.filter(hasClientOrSupplier),
    [persons]
  );

  const filteredList = useMemo(() => {
    let list = clientSupplierList.filter((p) => {
      const matchSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (tabFilter === 'all') return true;
      return Object.keys(p.roles).includes(tabFilter);
    });
    return list;
  }, [clientSupplierList, searchTerm, tabFilter]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, tabFilter]);

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
        errors.email = 'E-mail não pode conter ..';
      }
    }
    if (!createAsClient && !createAsSupplier) {
      errors.role = 'Selecione pelo menos um: Cliente ou Fornecedor';
    }
    setFieldErrors(errors);
    setFormError(Object.keys(errors).length > 0 ? 'Corrija os campos abaixo' : null);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    try {
      setFormError(null);
      const roles: { type: PersonRole; data: any }[] = [];
      if (createAsClient) {
        roles.push({ type: PersonRole.CLIENT, data: { clientCategories: clientData.clientCategories } });
      }
      if (createAsSupplier) {
        roles.push({
          type: PersonRole.SUPPLIER,
          data: { supplyCategories: supplierData.supplyCategories },
        });
      }
      const payload: CreatePersonRequest = {
        nome: formData.nome,
        personType: formData.personType as PersonType,
        cpfCnpj: formData.cpfCnpj || undefined,
        email: formData.email,
        phone: formData.phone || undefined,
        roles,
      };
      await apiService.createPerson(payload);
      await loadPersons();
      setShowCreateModal(false);
      resetCreateForm();
    } catch (err: any) {
      setFormError(err.message || 'Falha ao cadastrar');
    }
  };

  const handleUpdate = async () => {
    if (!selectedPerson) return;
    try {
      setError(null);
      const updates: UpdatePersonRequest = {
        nome: formData.nome,
        cpfCnpj: formData.cpfCnpj || null,
        email: formData.email,
        phone: formData.phone || undefined,
      };
      await apiService.updatePerson(selectedPerson.id, updates);
      await loadPersons();
      setShowEditModal(false);
      setSelectedPerson(null);
      resetCreateForm();
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cadastro?')) return;
    try {
      setError(null);
      await apiService.deletePerson(id);
      await loadPersons();
    } catch (err: any) {
      setError(err.message || 'Falha ao excluir');
    }
  };

  const resetCreateForm = () => {
    setFormData({ nome: '', personType: 'FISICA', cpfCnpj: '', email: '', phone: '' });
    setCreateAsClient(true);
    setCreateAsSupplier(false);
    setClientData({});
    setSupplierData({});
    setFieldErrors({});
    setFormError(null);
  };

  const openEdit = (person: Person) => {
    setSelectedPerson(person);
    setFormData({
      nome: person.nome,
      personType: person.personType,
      cpfCnpj: person.cpfCnpj || '',
      email: person.email,
      phone: person.phone || '',
    });
    setShowEditModal(true);
  };

  const getRoleBadges = (roles: Record<string, any>) => {
    return Object.keys(roles)
      .filter((r) => CLIENT_SUPPLIER_ROLES.includes(r as PersonRole))
      .map((role) => (
        <span
          key={role}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary"
        >
          {role === PersonRole.CLIENT ? 'Cliente' : 'Fornecedor'}
        </span>
      ));
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
            <h1 className="text-3xl font-bold">Clientes e Fornecedores</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie clientes e fornecedores
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cadastro
          </Button>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="ghost" size="icon" onClick={() => setError(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex rounded-lg border p-1 bg-muted/30">
            <button
              type="button"
              onClick={() => setTabFilter('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                tabFilter === 'all'
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setTabFilter(PersonRole.CLIENT)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                tabFilter === PersonRole.CLIENT
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Clientes
            </button>
            <button
              type="button"
              onClick={() => setTabFilter(PersonRole.SUPPLIER)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                tabFilter === PersonRole.SUPPLIER
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Fornecedores
            </button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Quantidade por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total (clientes e/ou fornecedores)</p>
                <p className="text-2xl font-bold">{clientSupplierList.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">
                  {clientSupplierList.filter((p) => p.roles.CLIENT).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fornecedores</p>
                <p className="text-2xl font-bold">
                  {clientSupplierList.filter((p) => p.roles.SUPPLIER).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {paginatedList.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || tabFilter !== 'all'
                  ? 'Nenhum resultado com os filtros aplicados.'
                  : 'Nenhum cliente ou fornecedor cadastrado. Clique em "Novo cadastro" para começar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {paginatedList.map((person) => (
                <Card key={person.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{person.nome}</h3>
                          {getRoleBadges(person.roles)}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
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
                          {person.cpfCnpj && (
                            <span className="flex items-center gap-1">
                              CPF/CNPJ: {person.cpfCnpj}
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
              ))}
            </div>

            {totalPages > 1 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Exibindo {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length)} de{' '}
                      {filteredList.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (p) =>
                              p === 1 ||
                              p === totalPages ||
                              Math.abs(p - currentPage) <= 1
                          )
                          .map((p, idx, arr) => (
                            <span key={p}>
                              {idx > 0 && arr[idx - 1] !== p - 1 && (
                                <span className="px-2">…</span>
                              )}
                              <Button
                                variant={currentPage === p ? 'default' : 'outline'}
                                size="icon"
                                onClick={() => setCurrentPage(p)}
                              >
                                {p}
                              </Button>
                            </span>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modal: Novo cadastro */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setFormError(null);
            setFieldErrors({});
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo cadastro – Cliente e/ou Fornecedor</DialogTitle>
            <DialogDescription>
              Preencha os dados e marque se é cliente, fornecedor ou ambos.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados pessoais
              </h4>
              <div className="space-y-2">
                <Label htmlFor="create-nome">Nome *</Label>
                <Input
                  id="create-nome"
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData({ ...formData, nome: e.target.value });
                    if (fieldErrors.nome) setFieldErrors({ ...fieldErrors, nome: '' });
                  }}
                  placeholder="Nome completo ou razão social"
                  className={fieldErrors.nome ? 'border-destructive' : ''}
                />
                {fieldErrors.nome && (
                  <p className="text-xs text-destructive">{fieldErrors.nome}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="create-cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de pessoa *</Label>
                <Select
                  value={formData.personType}
                  onValueChange={(v) => setFormData({ ...formData, personType: v as 'FISICA' | 'JURIDICA' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FISICA">Pessoa física</SelectItem>
                    <SelectItem value="JURIDICA">Pessoa jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
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
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
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

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Tipo de cadastro *</h4>
              {fieldErrors.role && (
                <p className="text-xs text-destructive">{fieldErrors.role}</p>
              )}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={createAsClient}
                    onCheckedChange={(v) => setCreateAsClient(!!v)}
                  />
                  <span>Cliente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={createAsSupplier}
                    onCheckedChange={(v) => setCreateAsSupplier(!!v)}
                  />
                  <span>Fornecedor</span>
                </label>
              </div>
            </div>

            {createAsClient && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <h4 className="text-sm font-medium">Dados do cliente</h4>
                <div className="space-y-2">
                  <Label>Categorias do cliente</Label>
                  <Input
                    value={clientData.clientCategories || ''}
                    onChange={(e) => setClientData({ ...clientData, clientCategories: e.target.value })}
                    placeholder="Ex: Agricultura, Comércio"
                  />
                </div>
              </div>
            )}

            {createAsSupplier && (
              <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                <h4 className="text-sm font-medium">Dados do fornecedor</h4>
                <div className="space-y-2">
                  <Label>Categorias de fornecimento</Label>
                  <Input
                    value={supplierData.supplyCategories || ''}
                    onChange={(e) =>
                      setSupplierData({ ...supplierData, supplyCategories: e.target.value })
                    }
                    placeholder="Ex: Insumos, máquinas"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar cadastro</DialogTitle>
            <DialogDescription>
              Altere apenas os dados pessoais. Papéis (cliente/fornecedor) podem ser gerenciados em Persons.
            </DialogDescription>
          </DialogHeader>
            <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cpfCnpj">CPF/CNPJ</Label>
              <Input
                id="edit-cpfCnpj"
                value={formData.cpfCnpj}
                onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-mail *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setSelectedPerson(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
