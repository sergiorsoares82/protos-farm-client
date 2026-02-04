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
import { Loader2, MapPin, Plus, Search, Sprout, X } from 'lucide-react';
import {
  apiService,
  Farm,
  ProductionSite,
  CreateProductionSiteRequest,
} from '@/services/api';

export const ProductionSites = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [productionSites, setProductionSites] = useState<ProductionSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    nomeBloco: '',
    descricao: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      loadProductionSites(selectedFarmId);
    } else {
      setProductionSites([]);
    }
  }, [selectedFarmId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const farmsData = await apiService.getFarms();
      setFarms(farmsData);
      if (farmsData.length > 0) {
        setSelectedFarmId(farmsData[0].id);
      }
    } catch (err: unknown) {
      console.error('Error loading farms for production sites:', err);
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar fazendas/blocos',
      );
    } finally {
      setLoading(false);
    }
  };

  const loadProductionSites = async (farmId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProductionSitesByFarm(farmId);
      setProductionSites(data);
    } catch (err: unknown) {
      console.error('Error loading production sites:', err);
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar blocos de produção',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nomeBloco: '',
      descricao: '',
    });
    setFieldErrors({});
    setFormError(null);
  };

  const filteredSites = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return productionSites.filter(
      (s) =>
        s.nomeBloco.toLowerCase().includes(term) ||
        (s.descricao ?? '').toLowerCase().includes(term),
    );
  }, [productionSites, searchTerm]);

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!formData.nomeBloco.trim()) {
      errors.nomeBloco = 'Nome do bloco é obrigatório';
    }
    if (!selectedFarmId) {
      errors.farmId = 'Selecione uma fazenda';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Corrija os campos indicados.');
      return;
    }

    try {
      setFormError(null);
      const body: CreateProductionSiteRequest = {
        farmId: selectedFarmId,
        nomeBloco: formData.nomeBloco.trim(),
        ...(formData.descricao.trim() && { descricao: formData.descricao.trim() }),
      };
      await apiService.createProductionSite(body);
      await loadProductionSites(selectedFarmId);
      setShowCreateModal(false);
      resetForm();
    } catch (err: unknown) {
      console.error('Error creating production site:', err);
      setFormError(
        err instanceof Error ? err.message : 'Falha ao cadastrar bloco de produção',
      );
    }
  };

  if (loading && farms.length === 0) {
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
            <h1 className="text-3xl font-bold">Blocos de produção</h1>
            <p className="text-muted-foreground">
              Cadastre blocos/estabelecimentos contíguos dentro de cada fazenda para
              controle de IE e produção.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            disabled={!selectedFarmId}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo bloco
          </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>Selecionar fazenda</CardTitle>
            <CardDescription>
              Escolha a fazenda para visualizar e gerenciar seus blocos de produção.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farm-select">Fazenda</Label>
              <select
                id="farm-select"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={selectedFarmId}
                onChange={(e) => setSelectedFarmId(e.target.value)}
              >
                {farms.length === 0 && <option value="">Nenhuma fazenda cadastrada</option>}
                {farms.length > 0 && <option value="">Selecione...</option>}
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {selectedFarmId && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou descrição do bloco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredSites.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Sprout className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? 'Nenhum bloco encontrado com esse filtro.'
                      : 'Nenhum bloco cadastrado para esta fazenda. Clique em "Novo bloco" para cadastrar.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredSites.map((site) => (
                  <Card key={site.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{site.nomeBloco}</h3>
                          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                            {site.descricao && <span>{site.descricao}</span>}
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Bloco operacional
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Novo bloco */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo bloco de produção</DialogTitle>
            <DialogDescription>
              Cadastre um estabelecimento/bloco contíguo dentro da fazenda selecionada.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bloc-nome">Nome do bloco *</Label>
              <Input
                id="bloc-nome"
                value={formData.nomeBloco}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nomeBloco: e.target.value }))
                }
                placeholder="Ex.: Sede, Retiro 1, Pivô 3..."
                className={fieldErrors.nomeBloco ? 'border-destructive' : ''}
              />
              {fieldErrors.nomeBloco && (
                <p className="text-sm text-destructive">{fieldErrors.nomeBloco}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bloc-desc">Descrição</Label>
              <Input
                id="bloc-desc"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Informações adicionais sobre o bloco (opcional)"
              />
            </div>
            {fieldErrors.farmId && (
              <p className="text-sm text-destructive">{fieldErrors.farmId}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Cadastrar bloco</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

