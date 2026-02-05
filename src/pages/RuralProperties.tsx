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
import { Search, Loader2, MapPin, Plus, X, FileText, Edit, Trash2 } from 'lucide-react';
import {
  apiService,
  RuralProperty,
  CreateRuralPropertyRequest,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreatePropertyModal, setShowCreatePropertyModal] = useState(false);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedProperty, setSelectedProperty] = useState<RuralProperty | null>(null);

  const [propertyForm, setPropertyForm] = useState({
    nomeImovelIncra: '',
    codigoSncr: '',
    nirf: '',
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
      const propsData = await apiService.getRuralProperties();
      setRuralProperties(propsData);
    } catch (err: unknown) {
      console.error('Error loading rural properties:', err);
      setError(err instanceof Error ? err.message : 'Falha ao carregar imóveis rurais');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPropertyForm({
      nomeImovelIncra: '',
      codigoSncr: '',
      nirf: '',
      municipio: '',
      uf: '',
    });
    setFieldErrors({});
    setFormError(null);
  };

  const openEditProperty = (prop: RuralProperty) => {
    setSelectedProperty(prop);
    setPropertyForm({
      nomeImovelIncra: prop.nomeImovelIncra,
      codigoSncr: prop.codigoSncr ?? '',
      nirf: prop.nirf ?? '',
      municipio: prop.municipio ?? '',
      uf: prop.uf ?? '',
    });
    setFieldErrors({});
    setFormError(null);
    setShowEditPropertyModal(true);
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este imóvel rural? Esta ação não pode ser desfeita.')) {
      return;
    }
    try {
      setError(null);
      await apiService.deleteRuralProperty(id);
      await loadData();
    } catch (err: unknown) {
      console.error('Error deleting rural property:', err);
      setError(err instanceof Error ? err.message : 'Falha ao excluir imóvel rural');
    }
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
      resetForm();
    } catch (err: unknown) {
      console.error('Error creating rural property:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao cadastrar imóvel rural');
    }
  };

  const handleUpdateProperty = async () => {
    if (!selectedProperty) return;
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
      const body: Partial<CreateRuralPropertyRequest> = {
        nomeImovelIncra: propertyForm.nomeImovelIncra.trim(),
        ...(propertyForm.codigoSncr.trim() && { codigoSncr: propertyForm.codigoSncr }),
        ...(propertyForm.nirf.trim() && { nirf: propertyForm.nirf }),
        ...(propertyForm.municipio.trim() && { municipio: propertyForm.municipio }),
        ...(propertyForm.uf.trim() && { uf: propertyForm.uf }),
      };
      await apiService.updateRuralProperty(selectedProperty.id, body);
      await loadData();
      setShowEditPropertyModal(false);
      setSelectedProperty(null);
      resetForm();
    } catch (err: unknown) {
      console.error('Error updating rural property:', err);
      setFormError(err instanceof Error ? err.message : 'Falha ao atualizar imóvel rural');
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
            <h1 className="text-3xl font-bold">Imóveis rurais</h1>
            <p className="text-muted-foreground">
              Cadastre as unidades de cadastro rural (INCRA/CNIR) que compõem o seu patrimônio. As matrículas de cartório são gerenciadas na tela Matrículas.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/land-registries">
                <FileText className="mr-2 h-4 w-4" />
                Matrículas
              </Link>
            </Button>
            <Button onClick={() => { resetForm(); setShowCreatePropertyModal(true); }}>
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
            placeholder="Buscar por nome do imóvel, código SNCR ou município..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

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
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditProperty(prop)}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteProperty(prop.id)}
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
            <CardDescription>Total de imóveis rurais cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ruralProperties.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Novo imóvel rural */}
      <Dialog open={showCreatePropertyModal} onOpenChange={(open) => { setShowCreatePropertyModal(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo imóvel rural</DialogTitle>
            <DialogDescription>
              Cadastre a unidade de cadastro rural (INCRA/CNIR) que agrupa uma ou mais matrículas.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{formError}</div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prop-nome">Nome do imóvel (INCRA) *</Label>
              <Input
                id="prop-nome"
                value={propertyForm.nomeImovelIncra}
                onChange={(e) => setPropertyForm({ ...propertyForm, nomeImovelIncra: e.target.value })}
                placeholder="Ex.: Fazenda Esperança (cadastro INCRA)"
                className={fieldErrors.nomeImovelIncra ? 'border-destructive' : ''}
              />
              {fieldErrors.nomeImovelIncra && <p className="text-sm text-destructive">{fieldErrors.nomeImovelIncra}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-sncr">Código do Imóvel Rural (INCRA)</Label>
                <Input
                  id="prop-sncr"
                  value={propertyForm.codigoSncr}
                  onChange={(e) => setPropertyForm({ ...propertyForm, codigoSncr: maskCodigoSncr(e.target.value) })}
                  placeholder="Ex.: 123.123.123.123-1"
                  maxLength={17}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-nirf">CIB</Label>
                <Input
                  id="prop-nirf"
                  value={propertyForm.nirf}
                  onChange={(e) => setPropertyForm({ ...propertyForm, nirf: maskCib(e.target.value) })}
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
                  onChange={(e) => setPropertyForm({ ...propertyForm, municipio: e.target.value })}
                  placeholder="Ex.: Sorriso"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-uf">UF</Label>
                <Input
                  id="prop-uf"
                  value={propertyForm.uf}
                  onChange={(e) => setPropertyForm({ ...propertyForm, uf: e.target.value.toUpperCase() })}
                  placeholder="Ex.: MT"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreatePropertyModal(false); resetForm(); }}>Cancelar</Button>
            <Button onClick={handleCreateProperty}>Cadastrar imóvel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar imóvel rural */}
      <Dialog
        open={showEditPropertyModal}
        onOpenChange={(open) => {
          setShowEditPropertyModal(open);
          if (!open) {
            setSelectedProperty(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar imóvel rural</DialogTitle>
            <DialogDescription>
              Altere os dados da unidade de cadastro rural (INCRA/CNIR).
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="prop-nome-edit">Nome do imóvel (INCRA) *</Label>
              <Input
                id="prop-nome-edit"
                value={propertyForm.nomeImovelIncra}
                onChange={(e) =>
                  setPropertyForm({ ...propertyForm, nomeImovelIncra: e.target.value })
                }
                placeholder="Ex.: Fazenda Esperança (cadastro INCRA)"
                className={fieldErrors.nomeImovelIncra ? 'border-destructive' : ''}
              />
              {fieldErrors.nomeImovelIncra && (
                <p className="text-sm text-destructive">{fieldErrors.nomeImovelIncra}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-sncr-edit">Código do Imóvel Rural (INCRA)</Label>
                <Input
                  id="prop-sncr-edit"
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
                <Label htmlFor="prop-nirf-edit">NIRF</Label>
                <Input
                  id="prop-nirf-edit"
                  value={propertyForm.nirf}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, nirf: maskCib(e.target.value) })
                  }
                  placeholder="Ex.: 1111111-1"
                  maxLength={9}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prop-municipio-edit">Município</Label>
                <Input
                  id="prop-municipio-edit"
                  value={propertyForm.municipio}
                  onChange={(e) =>
                    setPropertyForm({ ...propertyForm, municipio: e.target.value })
                  }
                  placeholder="Ex.: Nepomuceno"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prop-uf-edit">UF</Label>
                <Input
                  id="prop-uf-edit"
                  value={propertyForm.uf}
                  onChange={(e) =>
                    setPropertyForm({
                      ...propertyForm,
                      uf: e.target.value.toUpperCase().slice(0, 2),
                    })
                  }
                  placeholder="MG"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditPropertyModal(false);
                setSelectedProperty(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleUpdateProperty}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
