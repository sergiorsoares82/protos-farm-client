import { useEffect, useMemo, useState } from 'react';
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
import { Search, Loader2, MapPin, Plus, X, FileText } from 'lucide-react';
import {
  apiService,
  RuralProperty,
  LandRegistry,
  CreateRuralPropertyRequest,
  CreateLandRegistryRequest,
} from '@/services/api';

const ITEMS_PER_PAGE = 10;

/** Máscara Código do Imóvel Rural: ddd.ddd.ddd.ddd-d (ex.: 434.205.014.320-4) */
function maskCodigoSncr(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  if (digits.length <= 12) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}.${digits.slice(9)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}.${digits.slice(9, 12)}-${digits.slice(12)}`;
}

/** Máscara CIB: ddddddd-d (ex.: 1111111-1) */
function maskCib(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 7) return digits;
  return `${digits.slice(0, 7)}-${digits.slice(7)}`;
}

export const RuralProperties = () => {
  const [ruralProperties, setRuralProperties] = useState<RuralProperty[]>([]);
  const [landRegistries, setLandRegistries] = useState<LandRegistry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false);
  const [showCreateLandRegistryModal, setShowCreateLandRegistryModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [propertyForm, setPropertyForm] = useState({
    nomeImovelIncra: '',
    codigoSncr: '',
    nirf: '',
    municipio: '',
    uf: '',
  });

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
      const [propsData, regsData] = await Promise.all([
        apiService.getRuralProperties(),
        apiService.getLandRegistries(),
      ]);
      setRuralProperties(propsData);
      setLandRegistries(regsData);
    } catch (err: unknown) {
      console.error('Error loading rural properties/land registries:', err);
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar cadastro fundiário',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setPropertyForm({
      nomeImovelIncra: '',
      codigoSncr: '',
      nirf: '',
      municipio: '',
      uf: '',
    });
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

  const filteredProperties = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return ruralProperties.filter(
      (p) =>
        p.nomeImovelIncra.toLowerCase().includes(term) ||
        (p.codigoSncr ?? '').toLowerCase().includes(term) ||
        (p.municipio ?? '').toLowerCase().includes(term),
    );
  }, [ruralProperties, searchTerm]);

  const totalPages = Math.ceil(filteredProperties.length / ITEMS_PER_PAGE);
  const paginatedProperties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProperties, currentPage]);

  const handleCreateProperty = async () => {
    const errors: Record<string, string> = {};
    if (!propertyForm.nomeImovelIncra.trim()) {
      errors.nomeImovelIncra = 'Nome do imóvel (INCRA) é obrigatório';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Corrija os campos indicados.');
      return;
    }

    try {
      setFormError(null);
      const body: CreateRuralPropertyRequest = {
        nomeImovelIncra: propertyForm.nomeImovelIncra.trim(),
        ...(propertyForm.codigoSncr.trim() && { codigoSncr: propertyForm.codigoSncr }),
        ...(propertyForm.nirf.trim() && { nirf: propertyForm.nirf }),
        ...(propertyForm.municipio.trim() && { municipio: propertyForm.municipio }),
        ...(propertyForm.uf.trim() && { uf: propertyForm.uf }),
      };
      await apiService.createRuralProperty(body);
      await loadData();
      setShowCreatePropertyModal(false);
      resetForms();
    } catch (err: unknown) {
      console.error('Error creating rural property:', err);
      setFormError(
        err instanceof Error ? err.message : 'Falha ao cadastrar imóvel rural',
      );
    }
  };

  const handleCreateLandRegistry = async () => {
    const errors: Record<string, string> = {};
    if (!landRegistryForm.numeroMatricula.trim()) {
      errors.numeroMatricula = 'Número da matrícula é obrigatório';
    }
    if (!landRegistryForm.cartorio.trim()) {
      errors.cartorio = 'Cartório é obrigatório';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Corrija os campos indicados.');
      return;
    }

    try {
      setFormError(null);
      const body: CreateLandRegistryRequest = {
        ...(landRegistryForm.ruralPropertyId && {
          ruralPropertyId: landRegistryForm.ruralPropertyId,
        }),
        numeroMatricula: landRegistryForm.numeroMatricula.trim(),
        cartorio: landRegistryForm.cartorio.trim(),
        ...(landRegistryForm.dataRegistro.trim() && {
          dataRegistro: landRegistryForm.dataRegistro.trim(),
        }),
        ...(landRegistryForm.registro.trim() && { registro: landRegistryForm.registro.trim() }),
        ...(landRegistryForm.livroOuFicha.trim() && {
          livroOuFicha: landRegistryForm.livroOuFicha.trim(),
        }),
        ...(landRegistryForm.areaHa !== '' && landRegistryForm.areaHa != null && {
          areaHa: Number(landRegistryForm.areaHa),
        }),
        ...(landRegistryForm.municipio.trim() && { municipio: landRegistryForm.municipio }),
        ...(landRegistryForm.uf.trim() && { uf: landRegistryForm.uf }),
      };
      await apiService.createLandRegistry(body);
      await loadData();
      setShowCreateLandRegistryModal(false);
      resetForms();
    } catch (err: unknown) {
      console.error('Error creating land registry:', err);
      setFormError(
        err instanceof Error ? err.message : 'Falha ao cadastrar matrícula',
      );
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
            <h1 className="text-3xl font-bold">Cadastro fundiário</h1>
            <p className="text-muted-foreground">
              Gerencie imóveis rurais (INCRA) e matrículas de cartório que compõem o seu
              patrimônio de terras.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForms();
                setShowCreateLandRegistryModal(true);
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Nova matrícula
            </Button>
            <Button
              onClick={() => {
                resetForms();
                setShowCreatePropertyModal(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo imóvel rural
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setError(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do imóvel, código SNCR ou município..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de imóveis rurais */}
        {paginatedProperties.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Nenhum imóvel rural encontrado com esse filtro.'
                  : 'Nenhum imóvel rural cadastrado. Clique em "Novo imóvel rural" para cadastrar.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {paginatedProperties.map((prop) => (
              <Card key={prop.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">{prop.nomeImovelIncra}</h3>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {prop.codigoSncr && <span>SNCR: {prop.codigoSncr}</span>}
                        {prop.nirf && <span>NIRF: {prop.nirf}</span>}
                        {(prop.municipio || prop.uf) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {[prop.municipio, prop.uf].filter(Boolean).join(' / ')}
                          </span>
                        )}
                        <span>
                          Matrículas:{' '}
                          {
                            landRegistries.filter(
                              (lr) => lr.ruralPropertyId === prop.id,
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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

        {/* Lista resumida de matrículas */}
        <Card>
          <CardHeader>
            <CardTitle>Matrículas cadastradas</CardTitle>
            <CardDescription>
              Visão rápida das matrículas de cartório associadas aos imóveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {landRegistries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma matrícula cadastrada até o momento.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {landRegistries.map((lr) => {
                  const prop = lr.ruralPropertyId
                    ? ruralProperties.find((p) => p.id === lr.ruralPropertyId)
                    : undefined;
                  return (
                    <div
                      key={lr.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 last:border-b-0"
                    >
                      <div className="space-y-0.5">
                        <p className="font-medium">
                          Matrícula {lr.numeroMatricula} – {lr.cartorio}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {prop
                            ? `Imóvel: ${prop.nomeImovelIncra}`
                            : 'Imóvel não vinculado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[lr.municipio, lr.uf].filter(Boolean).join(' / ')}
                          {lr.areaHa != null &&
                            ` • Área informada: ${Number(lr.areaHa).toLocaleString(
                              'pt-BR',
                            )} ha`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal: Novo imóvel rural */}
      <Dialog
        open={showCreatePropertyModal}
        onOpenChange={(open) => {
          setShowCreatePropertyModal(open);
          if (!open) resetForms();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo imóvel rural</DialogTitle>
            <DialogDescription>
              Cadastre a unidade de cadastro rural (INCRA/CNIR) que agrupa uma ou mais
              matrículas.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prop-nome">Nome do imóvel (INCRA) *</Label>
              <Input
                id="prop-nome"
                value={propertyForm.nomeImovelIncra}
                onChange={(e) =>
                  setPropertyForm({ ...propertyForm, nomeImovelIncra: e.target.value })
                }
                placeholder="Ex.: Fazenda Esperança (cadastro INCRA)"
                className={fieldErrors.nomeImovelIncra ? 'border-destructive' : ''}
              />
              {fieldErrors.nomeImovelIncra && (
                <p className="text-sm text-destructive">
                  {fieldErrors.nomeImovelIncra}
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-sncr">Código do Imóvel Rural (INCRA)</Label>
                <Input
                  id="prop-sncr"
                  value={propertyForm.codigoSncr}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      codigoSncr: maskCodigoSncr(e.target.value),
                    })
                  }
                  placeholder="Ex.: 123.123.123.123-1"
                  maxLength={17}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-nirf">CIB</Label>
                <Input
                  id="prop-nirf"
                  value={propertyForm.nirf}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      nirf: maskCib(e.target.value),
                    })
                  }
                  placeholder="Ex.: 1111111-1"
                  maxLength={9}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-municipio">Município</Label>
                <Input
                  id="prop-municipio"
                  value={propertyForm.municipio}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, municipio: e.target.value })
                  }
                  placeholder="Ex.: Sorriso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-uf">UF</Label>
                <Input
                  id="prop-uf"
                  value={propertyForm.uf}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, uf: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex.: MT"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePropertyModal(false);
                resetForms();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateProperty}>Cadastrar imóvel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Nova matrícula */}
      <Dialog
        open={showCreateLandRegistryModal}
        onOpenChange={(open) => {
          setShowCreateLandRegistryModal(open);
          if (!open) resetForms();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova matrícula</DialogTitle>
            <DialogDescription>
              Cadastre uma matrícula de cartório e vincule opcionalmente a um imóvel rural.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mat-imovel">Imóvel rural (opcional)</Label>
              <Select
                value={landRegistryForm.ruralPropertyId || '__none__'}
                onValueChange={(v) =>
                  setLandRegistryForm({
                    ...landRegistryForm,
                    ruralPropertyId: v === '__none__' ? '' : v,
                  })
                }
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
                onChange={(e) =>
                  setLandRegistryForm({
                    ...landRegistryForm,
                    numeroMatricula: e.target.value,
                  })
                }
                className={fieldErrors.numeroMatricula ? 'border-destructive' : ''}
              />
              {fieldErrors.numeroMatricula && (
                <p className="text-sm text-destructive">
                  {fieldErrors.numeroMatricula}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mat-cartorio">Cartório *</Label>
              <Input
                id="mat-cartorio"
                value={landRegistryForm.cartorio}
                onChange={(e) =>
                  setLandRegistryForm({
                    ...landRegistryForm,
                    cartorio: e.target.value,
                  })
                }
                className={fieldErrors.cartorio ? 'border-destructive' : ''}
              />
              {fieldErrors.cartorio && (
                <p className="text-sm text-destructive">{fieldErrors.cartorio}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mat-data-registro">Data de registro</Label>
                <Input
                  id="mat-data-registro"
                  type="date"
                  value={landRegistryForm.dataRegistro}
                  onChange={(e) =>
                    setLandRegistryForm({
                      ...landRegistryForm,
                      dataRegistro: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-registro">Registro</Label>
                <Input
                  id="mat-registro"
                  value={landRegistryForm.registro}
                  onChange={(e) =>
                    setLandRegistryForm({
                      ...landRegistryForm,
                      registro: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-livro-ficha">Livro ou ficha</Label>
                <Input
                  id="mat-livro-ficha"
                  value={landRegistryForm.livroOuFicha}
                  onChange={(e) =>
                    setLandRegistryForm({
                      ...landRegistryForm,
                      livroOuFicha: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mat-area">Área (ha)</Label>
                <Input
                  id="mat-area"
                  type="number"
                  min="0"
                  step="0.01"
                  value={landRegistryForm.areaHa}
                  onChange={(e) =>
                    setLandRegistryForm({
                      ...landRegistryForm,
                      areaHa: e.target.value === '' ? '' : e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-municipio">Município</Label>
                <Input
                  id="mat-municipio"
                  value={landRegistryForm.municipio}
                  onChange={(e) =>
                    setLandRegistryForm({
                      ...landRegistryForm,
                      municipio: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mat-uf">UF</Label>
                <Input
                  id="mat-uf"
                  maxLength={2}
                  value={landRegistryForm.uf}
                  onChange={(e) =>
                    setLandRegistryForm({
                      ...landRegistryForm,
                      uf: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateLandRegistryModal(false);
                resetForms();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateLandRegistry}>Cadastrar matrícula</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

