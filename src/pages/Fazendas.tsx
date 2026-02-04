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
  Plus,
  Edit,
  Trash2,
  Search,
  Loader2,
  Sprout,
  MapPin,
  X,
  Landmark,
} from 'lucide-react';
import {
  apiService,
  Farm,
  RuralProperty,
  CreateFarmRequest,
  UpdateFarmRequest,
} from '@/services/api';

const ITEMS_PER_PAGE = 10;

export const Fazendas = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [ruralProperties, setRuralProperties] = useState<RuralProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    totalArea: '' as string | number,
    ruralPropertyIds: [] as string[],
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const filteredFarms = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return farms.filter(
      (f) =>
        f.name.toLowerCase().includes(term) ||
        (f.location ?? '').toLowerCase().includes(term) ||
        (f.ruralProperties ?? []).some(
          (rp) =>
            rp.nomeImovelIncra.toLowerCase().includes(term) ||
            (rp.codigoSncr ?? '').toLowerCase().includes(term)
        )
    );
  }, [farms, searchTerm]);

  const totalPages = Math.ceil(filteredFarms.length / ITEMS_PER_PAGE);
  const paginatedFarms = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFarms.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFarms, currentPage]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [farmsData, ruralPropertiesData] = await Promise.all([
        apiService.getFarms(),
        apiService.getRuralProperties(),
      ]);
      setFarms(farmsData);
      setRuralProperties(ruralPropertiesData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar fazendas');
      console.error('Error loading farms:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      totalArea: '',
      ruralPropertyIds: [],
    });
    setFieldErrors({});
    setFormError(null);
  };

  const validateCreate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Nome da fazenda é obrigatório';
    setFieldErrors(errors);
    setFormError(Object.keys(errors).length > 0 ? 'Corrija os campos indicados.' : null);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateCreate()) return;
    try {
      setFormError(null);
      const body: CreateFarmRequest = {
        name: formData.name.trim(),
        ...(formData.location.trim() && { location: formData.location.trim() }),
        ...(formData.totalArea !== '' && formData.totalArea != null && {
          totalArea: Number(formData.totalArea),
        }),
        ruralPropertyIds: formData.ruralPropertyIds,
      };
      await apiService.createFarm(body);
      await loadData();
      setShowCreateModal(false);
      resetForm();
    } catch (err: unknown) {
      console.error('Error creating farm:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao cadastrar fazenda');
    }
  };

  const handleUpdate = async () => {
    if (!selectedFarm) return;
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Nome da fazenda é obrigatório';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    try {
      setError(null);
      const body: UpdateFarmRequest = {
        name: formData.name.trim(),
        ...(formData.location !== undefined && { location: formData.location.trim() }),
        ...(formData.totalArea !== undefined && {
          totalArea: formData.totalArea === '' ? undefined : Number(formData.totalArea),
        }),
        ruralPropertyIds: formData.ruralPropertyIds,
      };
      await apiService.updateFarm(selectedFarm.id, body);
      await loadData();
      setShowEditModal(false);
      setSelectedFarm(null);
      resetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar fazenda');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta fazenda?')) return;
    try {
      setError(null);
      await apiService.deleteFarm(id);
      await loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir fazenda');
    }
  };

  const openEdit = (farm: Farm) => {
    setSelectedFarm(farm);
    setFormData({
      name: farm.name,
      location: farm.location ?? '',
      totalArea: farm.totalArea != null ? String(farm.totalArea) : '',
      ruralPropertyIds: (farm.ruralProperties ?? []).map((rp) => rp.id),
    });
    setFieldErrors({});
    setShowEditModal(true);
  };

  const toggleRuralProperty = (ruralPropertyId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      ruralPropertyIds: checked
        ? [...prev.ruralPropertyIds, ruralPropertyId]
        : prev.ruralPropertyIds.filter((id) => id !== ruralPropertyId),
    }));
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
            <h1 className="text-3xl font-bold">Fazendas</h1>
            <p className="text-muted-foreground">
              Cadastre fazendas e vincule um ou mais proprietários. Um proprietário pode ter várias fazendas.
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Nova fazenda
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
            placeholder="Buscar por nome da fazenda, localização ou proprietário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {paginatedFarms.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Sprout className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Nenhuma fazenda encontrada com esse filtro.'
                  : 'Nenhuma fazenda cadastrada. Clique em "Nova fazenda" para cadastrar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {paginatedFarms.map((farm) => (
              <Card key={farm.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{farm.name}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {farm.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {farm.location}
                          </span>
                        )}
                        {farm.totalArea != null && (
                          <span>Área: {Number(farm.totalArea).toLocaleString('pt-BR')} ha</span>
                        )}
                        {(farm.ruralProperties ?? []).length > 0 && (
                          <span className="flex items-center gap-1">
                            <Landmark className="h-4 w-4" />
                            {(farm.ruralProperties ?? []).map((rp) => rp.codigoSncr || rp.nomeImovelIncra).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="icon" onClick={() => openEdit(farm)} title="Editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(farm.id)}
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
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
              Anterior
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
              Próxima
            </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Total de fazendas cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{farms.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Nova fazenda */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar fazenda</DialogTitle>
            <DialogDescription>
              Preencha os dados da fazenda e vincule um ou mais imóveis rurais. Os proprietários são vinculados às matrículas em Imóveis Rurais. Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{formError}</div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome da fazenda *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' }); }}
                placeholder="Ex.: Fazenda Santa Maria"
                className={fieldErrors.name ? 'border-destructive' : ''}
              />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-location">Localização</Label>
              <Input
                id="create-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, totalArea: e.target.value === '' ? '' : e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Imóveis rurais</Label>
              {ruralProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cadastre imóveis rurais em Imóveis Rurais antes de vincular à fazenda.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {ruralProperties.map((rp) => (
                    <div key={rp.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`create-rp-${rp.id}`}
                        checked={formData.ruralPropertyIds.includes(rp.id)}
                        onChange={(e) => toggleRuralProperty(rp.id, e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`create-rp-${rp.id}`} className="flex-1 font-normal cursor-pointer">
                        {rp.codigoSncr ? `${rp.codigoSncr} – ` : ''}{rp.nomeImovelIncra}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreate}>Cadastrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar fazenda */}
      <Dialog open={showEditModal} onOpenChange={(open) => { setShowEditModal(open); if (!open) { setSelectedFarm(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar fazenda</DialogTitle>
            <DialogDescription>
              Altere os dados da fazenda e os imóveis rurais vinculados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da fazenda *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex.: Fazenda Santa Maria"
                className={fieldErrors.name ? 'border-destructive' : ''}
              />
              {fieldErrors.name && <p className="text-sm text-destructive">{fieldErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Localização</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, totalArea: e.target.value === '' ? '' : e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-2">
              <Label>Imóveis rurais</Label>
              {ruralProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum imóvel rural cadastrado.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                  {ruralProperties.map((rp) => (
                    <div key={rp.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`edit-rp-${rp.id}`}
                        checked={formData.ruralPropertyIds.includes(rp.id)}
                        onChange={(e) => toggleRuralProperty(rp.id, e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor={`edit-rp-${rp.id}`} className="flex-1 font-normal cursor-pointer">
                        {rp.codigoSncr ? `${rp.codigoSncr} – ` : ''}{rp.nomeImovelIncra}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); setSelectedFarm(null); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleUpdate}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
