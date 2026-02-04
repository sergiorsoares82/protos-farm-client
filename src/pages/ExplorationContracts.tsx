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
import { Loader2, Plus, Search, Users, X } from 'lucide-react';
import {
  apiService,
  ExplorationContract,
  CreateExplorationContractRequest,
  ExplorationContractType,
  Farm,
  Person,
  ProductionSite,
} from '@/services/api';

const CONTRACT_TYPE_LABELS: Record<ExplorationContractType, string> = {
  ARRENDAMENTO: 'Arrendamento',
  PARCERIA: 'Parceria',
  PROPRIO: 'Próprio',
  COMODATO: 'Comodato',
};

export const ExplorationContracts = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [productionSites, setProductionSites] = useState<ProductionSite[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [contracts, setContracts] = useState<ExplorationContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    productionSiteId: '',
    explorerId: '',
    landOwnerId: '',
    stateRegistrationId: '',
    tipoContrato: 'ARRENDAMENTO' as ExplorationContractType,
    dataInicio: '',
    dataFim: '',
    valorContrato: '' as string | number,
    observacoes: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedFarmId) {
      Promise.all([
        apiService.getExplorationContractsByFarm(selectedFarmId),
        apiService.getProductionSitesByFarm(selectedFarmId),
      ])
        .then(([contractsData, sitesData]) => {
          setContracts(contractsData);
          setProductionSites(sitesData);
        })
        .catch((err) => {
          console.error('Error loading contracts/sites:', err);
          setError(
            err instanceof Error
              ? err.message
              : 'Falha ao carregar contratos/blocos para a fazenda',
          );
        });
    } else {
      setContracts([]);
      setProductionSites([]);
    }
  }, [selectedFarmId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [farmsData, personsData] = await Promise.all([
        apiService.getFarms(),
        apiService.getPersons(),
      ]);
      setFarms(farmsData);
      setPersons(personsData);
      if (farmsData.length > 0) {
        setSelectedFarmId(farmsData[0].id);
      }
    } catch (err: unknown) {
      console.error('Error loading data for exploration contracts:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao carregar dados para contratos de exploração',
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productionSiteId: '',
      explorerId: '',
      landOwnerId: '',
      stateRegistrationId: '',
      tipoContrato: 'ARRENDAMENTO',
      dataInicio: '',
      dataFim: '',
      valorContrato: '',
      observacoes: '',
    });
    setFieldErrors({});
    setFormError(null);
  };

  const filteredContracts = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return contracts.filter((c) => {
      const explorer = persons.find((p) => p.id === c.explorerId);
      const owner = c.landOwnerId
        ? persons.find((p) => p.id === c.landOwnerId)
        : undefined;
      const site = c.productionSiteId
        ? productionSites.find((s) => s.id === c.productionSiteId)
        : undefined;
      return (
        (explorer?.nome.toLowerCase().includes(term) ?? false) ||
        (owner?.nome.toLowerCase().includes(term) ?? false) ||
        (site?.nomeBloco.toLowerCase().includes(term) ?? false) ||
        CONTRACT_TYPE_LABELS[c.tipoContrato].toLowerCase().includes(term)
      );
    });
  }, [contracts, persons, productionSites, searchTerm]);

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!selectedFarmId) errors.farmId = 'Selecione uma fazenda';
    if (!formData.explorerId) errors.explorerId = 'Selecione o explorador';
    if (!formData.tipoContrato) errors.tipoContrato = 'Selecione o tipo de contrato';
    if (!formData.dataInicio) errors.dataInicio = 'Data de início é obrigatória';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Corrija os campos indicados.');
      return;
    }

    try {
      setFormError(null);
      const body: CreateExplorationContractRequest = {
        farmId: selectedFarmId,
        ...(formData.productionSiteId && {
          productionSiteId: formData.productionSiteId,
        }),
        explorerId: formData.explorerId,
        ...(formData.landOwnerId && { landOwnerId: formData.landOwnerId }),
        ...(formData.stateRegistrationId && {
          stateRegistrationId: formData.stateRegistrationId,
        }),
        tipoContrato: formData.tipoContrato,
        dataInicio: formData.dataInicio,
        ...(formData.dataFim && { dataFim: formData.dataFim }),
        ...(formData.valorContrato !== '' &&
          formData.valorContrato != null && {
            valorContrato: Number(formData.valorContrato),
          }),
        ...(formData.observacoes.trim() && {
          observacoes: formData.observacoes.trim(),
        }),
      };
      await apiService.createExplorationContract(body);
      if (selectedFarmId) {
        const contractsData = await apiService.getExplorationContractsByFarm(
          selectedFarmId,
        );
        setContracts(contractsData);
      }
      setShowCreateModal(false);
      resetForm();
    } catch (err: unknown) {
      console.error('Error creating exploration contract:', err);
      setFormError(
        err instanceof Error ? err.message : 'Falha ao cadastrar contrato de exploração',
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
            <h1 className="text-3xl font-bold">Contratos de exploração</h1>
            <p className="text-muted-foreground">
              Cadastre contratos de arrendamento, parceria, comodato ou exploração própria
              vinculados às fazendas e blocos.
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
            Novo contrato
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
              Escolha a fazenda para visualizar e gerenciar seus contratos de exploração.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farm-select-contracts">Fazenda</Label>
              <select
                id="farm-select-contracts"
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
                placeholder="Buscar por produtor, proprietário, bloco ou tipo de contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {filteredContracts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? 'Nenhum contrato encontrado com esse filtro.'
                      : 'Nenhum contrato cadastrado para esta fazenda. Clique em "Novo contrato" para cadastrar.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredContracts.map((c) => {
                  const explorer = persons.find((p) => p.id === c.explorerId);
                  const owner = c.landOwnerId
                    ? persons.find((p) => p.id === c.landOwnerId)
                    : undefined;
                  const site = c.productionSiteId
                    ? productionSites.find((s) => s.id === c.productionSiteId)
                    : undefined;
                  return (
                    <Card key={c.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold">
                              {CONTRACT_TYPE_LABELS[c.tipoContrato]}
                            </h3>
                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span>
                                Explorador:{' '}
                                <strong>{explorer ? explorer.nome : 'N/A'}</strong>
                              </span>
                              {owner && (
                                <span>
                                  Proprietário:{' '}
                                  <strong>{owner ? owner.nome : 'N/A'}</strong>
                                </span>
                              )}
                              {site && (
                                <span>
                                  Bloco:{' '}
                                  <strong>{site ? site.nomeBloco : 'N/A'}</strong>
                                </span>
                              )}
                              <span>
                                Vigência:{' '}
                                {c.dataInicio}
                                {c.dataFim ? ` até ${c.dataFim}` : ' (sem data fim)'}
                              </span>
                              {c.valorContrato != null && (
                                <span>
                                  Valor:{' '}
                                  {Number(c.valorContrato).toLocaleString('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  })}
                                </span>
                              )}
                            </div>
                            {c.observacoes && (
                              <p className="text-xs text-muted-foreground">
                                {c.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal: Novo contrato */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo contrato de exploração</DialogTitle>
            <DialogDescription>
              Defina a relação entre o explorador (produtor), o proprietário da terra e o
              tipo de contrato.
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {formError}
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="explorer-select">Explorador (produtor) *</Label>
              <select
                id="explorer-select"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={formData.explorerId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, explorerId: e.target.value }))
                }
              >
                <option value="">Selecione...</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              {fieldErrors.explorerId && (
                <p className="text-sm text-destructive">{fieldErrors.explorerId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-select">Proprietário da terra (opcional)</Label>
              <select
                id="owner-select"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={formData.landOwnerId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, landOwnerId: e.target.value }))
                }
              >
                <option value="">Selecione...</option>
                {persons.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloc-select">Bloco de produção (opcional)</Label>
              <select
                id="bloc-select"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={formData.productionSiteId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, productionSiteId: e.target.value }))
                }
              >
                <option value="">Contrato vale para toda a fazenda</option>
                {productionSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nomeBloco}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo-contrato">Tipo de contrato *</Label>
              <select
                id="tipo-contrato"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={formData.tipoContrato}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipoContrato: e.target.value as ExplorationContractType,
                  }))
                }
              >
                {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {fieldErrors.tipoContrato && (
                <p className="text-sm text-destructive">{fieldErrors.tipoContrato}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-inicio">Data de início *</Label>
                <Input
                  id="data-inicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dataInicio: e.target.value }))
                  }
                  className={fieldErrors.dataInicio ? 'border-destructive' : ''}
                />
                {fieldErrors.dataInicio && (
                  <p className="text-sm text-destructive">{fieldErrors.dataInicio}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-fim">Data de término (opcional)</Label>
                <Input
                  id="data-fim"
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dataFim: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor-contrato">Valor (R$) opcional</Label>
              <Input
                id="valor-contrato"
                type="number"
                step="0.01"
                min="0"
                value={formData.valorContrato}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valorContrato: e.target.value === '' ? '' : e.target.value,
                  }))
                }
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, observacoes: e.target.value }))
                }
                placeholder="Condições específicas, forma de pagamento, etc."
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
            <Button onClick={handleCreate}>Cadastrar contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

