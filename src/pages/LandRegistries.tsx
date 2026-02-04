import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { Search, Loader2, FileText, Plus, X, Users, MapPin } from 'lucide-react';
import {
  apiService,
  Person,
  RuralProperty,
  LandRegistry,
  CreateLandRegistryRequest,
  UpsertLandRegistryOwnersRequest,
} from '@/services/api';

const ITEMS_PER_PAGE = 10;

export type OwnerFormItem = {
  personId: string;
  percentualPosse?: number;
  dataAquisicao?: string;
  tipoAquisicao?: string;
};

export const LandRegistries = () => {
  const [landRegistries, setLandRegistries] = useState<LandRegistry[]>([]);
  const [ruralProperties, setRuralProperties] = useState<RuralProperty[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRuralPropertyId, setFilterRuralPropertyId] = useState<string>('__all__');
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [selectedLandRegistry, setSelectedLandRegistry] = useState<LandRegistry | null>(null);
  const [ownersForm, setOwnersForm] = useState<OwnerFormItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [landRegistryForm, setLandRegistryForm] = useState({
    ruralPropertyId: '',
    numeroMatricula: '',
    cartorio: '',
    dataRegistro: '',
    registro: '',
    livroOuFicha: '',
    areaHa: '' as string | number,
    municipio: '',
    uf: '',
  });

  const farmOwners = useMemo(
    () => persons.filter((p) => p.roles?.FARM_OWNER),
    [persons]
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRuralPropertyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [regsData, propsData, personsData] = await Promise.all([
        apiService.getLandRegistries(),
        apiService.getRuralProperties(),
        apiService.getPersons(),
      ]);
      setLandRegistries(regsData);
      setRuralProperties(propsData);
      setPersons(personsData);
    } catch (err: unknown) {
      console.error('Error loading matrículas:', err);
      setError(err instanceof Error ? err.message : 'Falha ao carregar matrículas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLandRegistryForm({
      ruralPropertyId: '',
      numeroMatricula: '',
      cartorio: '',
      dataRegistro: '',
      registro: '',
      livroOuFicha: '',
      areaHa: '',
      municipio: '',
      uf: '',
    });
    setFieldErrors({});
    setFormError(null);
  };

  const filteredRegistries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return landRegistries.filter((lr) => {
      if (filterRuralPropertyId !== '__all__' && lr.ruralPropertyId !== filterRuralPropertyId) return false;
      if (!term) return true;
      const prop = lr.ruralPropertyId ? ruralProperties.find((p) => p.id === lr.ruralPropertyId) : undefined;
      return (
        lr.numeroMatricula.toLowerCase().includes(term) ||
        (lr.cartorio ?? '').toLowerCase().includes(term) ||
        (lr.municipio ?? '').toLowerCase().includes(term) ||
        (prop?.nomeImovelIncra ?? '').toLowerCase().includes(term) ||
        (prop?.codigoSncr ?? '').toLowerCase().includes(term)
      );
    });
  }, [landRegistries, ruralProperties, searchTerm, filterRuralPropertyId]);

  const totalPages = Math.ceil(filteredRegistries.length / ITEMS_PER_PAGE);
  const paginatedRegistries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRegistries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRegistries, currentPage]);

  const openOwnersModal = (lr: LandRegistry) => {
    setSelectedLandRegistry(lr);
    setOwnersForm(
      (lr.owners ?? []).map((o) => ({
        personId: o.personId,
        percentualPosse: o.percentualPosse != null ? Number(o.percentualPosse) : undefined,
        dataAquisicao: o.dataAquisicao ?? undefined,
        tipoAquisicao: o.tipoAquisicao ?? undefined,
      }))
    );
    setFormError(null);
    setShowOwnersModal(true);
  };

  const addOwnerRow = () => {
    setOwnersForm((prev) => [...prev, { personId: farmOwners[0]?.id ?? '' }]);
  };

  const updateOwnerRow = (index: number, field: keyof OwnerFormItem, value: string | number | undefined) => {
    setOwnersForm((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeOwnerRow = (index: number) => {
    setOwnersForm((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveOwners = async () => {
    if (!selectedLandRegistry) return;
    try {
      setFormError(null);
      const body: UpsertLandRegistryOwnersRequest = {
        owners: ownersForm
          .filter((o) => o.personId)
          .map((o) => ({
            personId: o.personId,
            ...(o.percentualPosse != null && { percentualPosse: o.percentualPosse }),
            ...(o.dataAquisicao && { dataAquisicao: o.dataAquisicao }),
            ...(o.tipoAquisicao && { tipoAquisicao: o.tipoAquisicao }),
          })),
      };
      const updated = await apiService.upsertLandRegistryOwners(selectedLandRegistry.id, body);
      setLandRegistries((prev) => prev.map((lr) => (lr.id === updated.id ? updated : lr)));
      setShowOwnersModal(false);
      setSelectedLandRegistry(null);
    } catch (err: unknown) {
      console.error('Error saving land registry owners:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao salvar proprietários da matrícula');
    }
  };

  const handleCreateLandRegistry = async () => {
    const errors: Record<string, string> = {};
    if (!landRegistryForm.numeroMatricula.trim()) errors.numeroMatricula = 'Número da matrícula é obrigatório';
    if (!landRegistryForm.cartorio.trim()) errors.cartorio = 'Cartório é obrigatório';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Corrija os campos indicados.');
      return;
    }
    try {
      setFormError(null);
      const body: CreateLandRegistryRequest = {
        ...(landRegistryForm.ruralPropertyId && { ruralPropertyId: landRegistryForm.ruralPropertyId }),
        numeroMatricula: landRegistryForm.numeroMatricula.trim(),
        cartorio: landRegistryForm.cartorio.trim(),
        ...(landRegistryForm.dataRegistro.trim() && { dataRegistro: landRegistryForm.dataRegistro.trim() }),
        ...(landRegistryForm.registro.trim() && { registro: landRegistryForm.registro.trim() }),
        ...(landRegistryForm.livroOuFicha.trim() && { livroOuFicha: landRegistryForm.livroOuFicha.trim() }),
        ...(landRegistryForm.areaHa !== '' && landRegistryForm.areaHa != null && { areaHa: Number(landRegistryForm.areaHa) }),
        ...(landRegistryForm.municipio.trim() && { municipio: landRegistryForm.municipio }),
        ...(landRegistryForm.uf.trim() && { uf: landRegistryForm.uf }),
      };
      await apiService.createLandRegistry(body);
      await loadData();
      setShowCreateModal(false);
      resetForm();
    } catch (err: unknown) {
      console.error('Error creating land registry:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao cadastrar matrícula');
    }
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
            <h1 className="text-3xl font-bold">Matrículas</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie matrículas de cartório. Vincule a um imóvel rural e aos proprietários.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/rural-properties">
                <MapPin className="mr-2 h-4 w-4" />
                Imóveis rurais
              </Link>
            </Button>
            <Button onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova matrícula
            </Button>
          </div>
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

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cartório, imóvel ou município..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterRuralPropertyId} onValueChange={setFilterRuralPropertyId}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Todos os imóveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os imóveis</SelectItem>
              {ruralProperties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.codigoSncr ? `${p.codigoSncr} – ` : ''}{p.nomeImovelIncra}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {paginatedRegistries.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || filterRuralPropertyId !== '__all__'
                  ? 'Nenhuma matrícula encontrada com esse filtro.'
                  : 'Nenhuma matrícula cadastrada. Clique em "Nova matrícula" para cadastrar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {paginatedRegistries.map((lr) => {
              const prop = lr.ruralPropertyId
                ? ruralProperties.find((p) => p.id === lr.ruralPropertyId)
                : undefined;
              return (
                <Card key={lr.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold">
                          Matrícula {lr.numeroMatricula} – {lr.cartorio}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                          {prop ? (
                            <span>
                              Imóvel: {prop.codigoSncr ? `${prop.codigoSncr} – ` : ''}{prop.nomeImovelIncra}
                            </span>
                          ) : (
                            <span>Imóvel não vinculado</span>
                          )}
                          {(lr.municipio || lr.uf) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {[lr.municipio, lr.uf].filter(Boolean).join(' / ')}
                            </span>
                          )}
                          {lr.areaHa != null && (
                            <span>Área: {Number(lr.areaHa).toLocaleString('pt-BR')} ha</span>
                          )}
                          {(lr.owners ?? []).length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {(lr.owners ?? []).map((o) => o.personName).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openOwnersModal(lr)} className="shrink-0">
                        <Users className="h-4 w-4 mr-1" />
                        Proprietários
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
            <CardDescription>Total de matrículas cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{landRegistries.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Nova matrícula */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { setShowCreateModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova matrícula</DialogTitle>
            <DialogDescription>
              Cadastre uma matrícula de cartório e vincule opcionalmente a um imóvel rural.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{formError}</div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mat-imovel">Imóvel rural (opcional)</Label>
              <Select
                value={landRegistryForm.ruralPropertyId || '__none__'}
                onValueChange={(v) => setLandRegistryForm({ ...landRegistryForm, ruralPropertyId: v === '__none__' ? '' : v })}
              >
                <SelectTrigger id="mat-imovel">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Selecionar...</SelectItem>
                  {ruralProperties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nomeImovelIncra}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mat-numero">Número da matrícula *</Label>
              <Input
                id="mat-numero"
                value={landRegistryForm.numeroMatricula}
                onChange={(e) => setLandRegistryForm({ ...landRegistryForm, numeroMatricula: e.target.value })}
                className={fieldErrors.numeroMatricula ? 'border-destructive' : ''}
              />
              {fieldErrors.numeroMatricula && <p className="text-sm text-destructive">{fieldErrors.numeroMatricula}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mat-cartorio">Cartório *</Label>
              <Input
                id="mat-cartorio"
                value={landRegistryForm.cartorio}
                onChange={(e) => setLandRegistryForm({ ...landRegistryForm, cartorio: e.target.value })}
                className={fieldErrors.cartorio ? 'border-destructive' : ''}
              />
              {fieldErrors.cartorio && <p className="text-sm text-destructive">{fieldErrors.cartorio}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mat-data-registro">Data de registro</Label>
                <Input
                  id="mat-data-registro"
                  type="date"
                  value={landRegistryForm.dataRegistro}
                  onChange={(e) => setLandRegistryForm({ ...landRegistryForm, dataRegistro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-registro">Registro</Label>
                <Input
                  id="mat-registro"
                  value={landRegistryForm.registro}
                  onChange={(e) => setLandRegistryForm({ ...landRegistryForm, registro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-livro-ficha">Livro ou ficha</Label>
                <Input
                  id="mat-livro-ficha"
                  value={landRegistryForm.livroOuFicha}
                  onChange={(e) => setLandRegistryForm({ ...landRegistryForm, livroOuFicha: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mat-area">Área (ha)</Label>
                <Input
                  id="mat-area"
                  type="number"
                  min={0}
                  step={0.01}
                  value={landRegistryForm.areaHa}
                  onChange={(e) => setLandRegistryForm({ ...landRegistryForm, areaHa: e.target.value === '' ? '' : e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-municipio">Município</Label>
                <Input
                  id="mat-municipio"
                  value={landRegistryForm.municipio}
                  onChange={(e) => setLandRegistryForm({ ...landRegistryForm, municipio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-uf">UF</Label>
                <Input
                  id="mat-uf"
                  maxLength={2}
                  value={landRegistryForm.uf}
                  onChange={(e) => setLandRegistryForm({ ...landRegistryForm, uf: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreateLandRegistry}>Cadastrar matrícula</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Proprietários da matrícula */}
      <Dialog
        open={showOwnersModal}
        onOpenChange={(open) => {
          setShowOwnersModal(open);
          if (!open) { setSelectedLandRegistry(null); setFormError(null); }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proprietários da matrícula</DialogTitle>
            <DialogDescription>
              {selectedLandRegistry
                ? `Matrícula ${selectedLandRegistry.numeroMatricula} – ${selectedLandRegistry.cartorio}. Vincule uma ou mais pessoas (proprietários) a esta matrícula.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{formError}</div>
          )}
          <div className="space-y-4 py-4">
            {farmOwners.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Cadastre pessoas com papel de proprietário em Pessoas / Proprietários antes de vincular à matrícula.
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  {ownersForm.map((row, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-2 p-2 border rounded-md">
                      <div className="flex-1 min-w-[140px] space-y-1">
                        <Label className="text-xs">Proprietário</Label>
                        <Select value={row.personId} onValueChange={(v) => updateOwnerRow(index, 'personId', v)}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {farmOwners.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20 space-y-1">
                        <Label className="text-xs">% posse</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={row.percentualPosse ?? ''}
                          onChange={(e) => updateOwnerRow(index, 'percentualPosse', e.target.value === '' ? undefined : Number(e.target.value))}
                          placeholder="–"
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <Label className="text-xs">Data aquisição</Label>
                        <Input
                          type="date"
                          value={row.dataAquisicao ?? ''}
                          onChange={(e) => updateOwnerRow(index, 'dataAquisicao', e.target.value || undefined)}
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Tipo aquisição</Label>
                        <Input
                          value={row.tipoAquisicao ?? ''}
                          onChange={(e) => updateOwnerRow(index, 'tipoAquisicao', e.target.value || undefined)}
                          placeholder="Ex.: Compra"
                        />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeOwnerRow(index)} className="text-destructive shrink-0" title="Remover">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addOwnerRow}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar proprietário
                </Button>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowOwnersModal(false); setSelectedLandRegistry(null); }}>Cancelar</Button>
            <Button onClick={handleSaveOwners} disabled={farmOwners.length === 0 || ownersForm.every((o) => !o.personId)}>
              Salvar proprietários
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
