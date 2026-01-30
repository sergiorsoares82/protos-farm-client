import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plus, Pencil, Trash2, Truck, Wrench, Box, Building2 } from 'lucide-react';
import {
  apiService,
  Asset,
  AssetKind,
  CreateAssetRequest,
  UpdateAssetRequest,
  CreateFullMachineRequest,
  MachineType,
  CostCenterCategory,
  CostCenterType,
} from '@/services/api';

const ASSET_KIND_LABELS: Record<AssetKind, string> = {
  [AssetKind.MACHINE]: 'Máquina',
  [AssetKind.IMPLEMENT]: 'Implemento',
  [AssetKind.EQUIPMENT]: 'Equipamento',
  [AssetKind.IMPROVEMENT]: 'Benfeitoria',
};

const ASSET_KIND_ICONS: Record<AssetKind, React.ComponentType<{ className?: string }>> = {
  [AssetKind.MACHINE]: Truck,
  [AssetKind.IMPLEMENT]: Wrench,
  [AssetKind.EQUIPMENT]: Box,
  [AssetKind.IMPROVEMENT]: Building2,
};

export const Assets = () => {
  const [items, setItems] = useState<Asset[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [categories, setCategories] = useState<CostCenterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFullMachineDialogOpen, setIsFullMachineDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Asset | null>(null);

  const [formData, setFormData] = useState<CreateAssetRequest>({
    name: '',
    code: '',
    assetKind: AssetKind.MACHINE,
  });

  const [fullMachineData, setFullMachineData] = useState<CreateFullMachineRequest>({
    name: '',
    code: '',
    machineTypeId: '',
    costCenterCode: '',
    costCenterDescription: '',
    costCenterType: CostCenterType.SHARED,
    costCenterCategoryId: '',
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assets, typesResp, categoriesResp] = await Promise.all([
        apiService.getAssets(),
        apiService.getMachineTypes(),
        apiService.getCostCenterCategories(),
      ]);
      setItems(assets);
      setMachineTypes(typesResp.filter((t) => t.isActive));
      setCategories(Array.isArray(categoriesResp) ? categoriesResp : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar ativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const categoriesList = categories;

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      assetKind: AssetKind.MACHINE,
    });
  };

  const resetFullMachineForm = () => {
    setFullMachineData({
      name: '',
      code: '',
      machineTypeId: '',
      costCenterCode: '',
      costCenterDescription: '',
      costCenterType: CostCenterType.SHARED,
      costCenterCategoryId: '',
    });
  };

  const validateAssetForm = (): string | null => {
    if (!formData.name.trim()) return 'Nome do ativo é obrigatório';
    return null;
  };

  const validateFullMachineForm = (): string | null => {
    if (!fullMachineData.name.trim()) return 'Nome é obrigatório';
    if (!fullMachineData.machineTypeId) return 'Tipo de máquina é obrigatório';
    if (!fullMachineData.costCenterType) return 'Tipo de centro de custo é obrigatório';
    return null;
  };

  const handleCreateAsset = async () => {
    const validationError = validateAssetForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      await apiService.createAsset({
        name: formData.name.trim(),
        code: formData.code?.trim() || undefined,
        assetKind: formData.assetKind,
      });
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar ativo');
    }
  };

  const handleCreateFullMachine = async () => {
    const validationError = validateFullMachineForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      await apiService.createFullMachine({
        name: fullMachineData.name.trim(),
        code: fullMachineData.code?.trim() || undefined,
        machineTypeId: fullMachineData.machineTypeId,
        costCenterCode: fullMachineData.costCenterCode?.trim() || undefined,
        costCenterDescription: fullMachineData.costCenterDescription?.trim() || undefined,
        costCenterType: fullMachineData.costCenterType,
        costCenterCategoryId: fullMachineData.costCenterCategoryId || undefined,
      });
      setIsFullMachineDialogOpen(false);
      resetFullMachineForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao cadastrar máquina completa');
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    const validationError = validateAssetForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      const updates: UpdateAssetRequest = {
        name: formData.name.trim(),
        code: formData.code?.trim() || undefined,
        assetKind: formData.assetKind,
      };
      await apiService.updateAsset(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar ativo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ativo?')) return;
    try {
      setError(null);
      await apiService.deleteAsset(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir ativo');
    }
  };

  const handleToggleActive = async (item: Asset) => {
    try {
      setError(null);
      await apiService.updateAsset(item.id, { isActive: !item.isActive });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    }
  };

  const openEditDialog = (item: Asset) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      code: item.code ?? '',
      assetKind: item.assetKind,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Patrimônio (Ativos)</h1>
            <p className="text-muted-foreground">
              Cadastro de ativos: máquinas, implementos, equipamentos e benfeitorias. Um ativo pode ser vinculado a uma máquina e a um centro de custo.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                resetFullMachineForm();
                setIsFullMachineDialogOpen(true);
              }}
            >
              <Truck className="h-4 w-4 mr-2" />
              Cadastrar máquina completa
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ativo
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando ativos...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum ativo cadastrado. Use &quot;Cadastrar máquina completa&quot; ou &quot;Adicionar ativo&quot;.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const Icon = ASSET_KIND_ICONS[item.assetKind as AssetKind];
              return (
                <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base flex flex-wrap items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          <span className="break-words">{item.name}</span>
                          {!item.isActive && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              Inativo
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {item.code && <span>{item.code} · </span>}
                          {ASSET_KIND_LABELS[item.assetKind as AssetKind] ?? item.assetKind}
                        </CardDescription>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleActive(item)}
                          title={item.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {item.isActive ? '✓' : '○'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(item)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create Asset Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo ativo</DialogTitle>
              <DialogDescription>
                Cadastre um ativo (máquina, implemento, equipamento ou benfeitoria). Para criar ativo + máquina + centro de custo de uma vez, use &quot;Cadastrar máquina completa&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="asset-name">Nome *</Label>
                <Input
                  id="asset-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex.: Trator 01, Galpão Norte"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-code">Código (opcional)</Label>
                <Input
                  id="asset-code"
                  value={formData.code ?? ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="ex.: TR01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-kind">Tipo de ativo *</Label>
                <Select
                  value={formData.assetKind}
                  onValueChange={(value) => setFormData({ ...formData, assetKind: value as AssetKind })}
                >
                  <SelectTrigger id="asset-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ASSET_KIND_LABELS) as AssetKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {ASSET_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreateAsset} disabled={!formData.name.trim()}>
                Criar ativo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Full Machine Dialog */}
        <Dialog open={isFullMachineDialogOpen} onOpenChange={setIsFullMachineDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar máquina completa</DialogTitle>
              <DialogDescription>
                Cria ativo + máquina + centro de custo em um único passo (ex.: Trator 01).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fm-name">Nome *</Label>
                <Input
                  id="fm-name"
                  value={fullMachineData.name}
                  onChange={(e) => setFullMachineData({ ...fullMachineData, name: e.target.value })}
                  placeholder="ex.: Trator 01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fm-code">Código (opcional)</Label>
                <Input
                  id="fm-code"
                  value={fullMachineData.code ?? ''}
                  onChange={(e) => setFullMachineData({ ...fullMachineData, code: e.target.value })}
                  placeholder="ex.: TR01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fm-machineType">Tipo de máquina *</Label>
                <Select
                  value={fullMachineData.machineTypeId}
                  onValueChange={(value) => setFullMachineData({ ...fullMachineData, machineTypeId: value })}
                >
                  <SelectTrigger id="fm-machineType">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {machineTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.code} – {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fm-ccType">Tipo de centro de custo *</Label>
                <Select
                  value={fullMachineData.costCenterType}
                  onValueChange={(value) => setFullMachineData({ ...fullMachineData, costCenterType: value })}
                >
                  <SelectTrigger id="fm-ccType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CostCenterType.PRODUCTIVE}>Produtivo</SelectItem>
                    <SelectItem value={CostCenterType.ADMINISTRATIVE}>Administrativo</SelectItem>
                    <SelectItem value={CostCenterType.SHARED}>Compartilhado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fm-ccCode">Código do centro de custo (opcional)</Label>
                <Input
                  id="fm-ccCode"
                  value={fullMachineData.costCenterCode ?? ''}
                  onChange={(e) => setFullMachineData({ ...fullMachineData, costCenterCode: e.target.value })}
                  placeholder="ex.: TR01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fm-ccDesc">Descrição do centro de custo (opcional)</Label>
                <Input
                  id="fm-ccDesc"
                  value={fullMachineData.costCenterDescription ?? ''}
                  onChange={(e) => setFullMachineData({ ...fullMachineData, costCenterDescription: e.target.value })}
                  placeholder="ex.: Trator 01"
                />
              </div>
              {categoriesList.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="fm-ccCategory">Categoria do centro de custo (opcional)</Label>
                  <Select
                    value={fullMachineData.costCenterCategoryId ?? ''}
                    onValueChange={(value) => setFullMachineData({ ...fullMachineData, costCenterCategoryId: value || undefined })}
                  >
                    <SelectTrigger id="fm-ccCategory">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.code} – {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsFullMachineDialogOpen(false); resetFullMachineForm(); }}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreateFullMachine}
                disabled={!fullMachineData.name.trim() || !fullMachineData.machineTypeId}
              >
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Asset Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar ativo</DialogTitle>
              <DialogDescription>Altere nome, código ou tipo do ativo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-asset-name">Nome *</Label>
                <Input
                  id="edit-asset-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-asset-code">Código (opcional)</Label>
                <Input
                  id="edit-asset-code"
                  value={formData.code ?? ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-asset-kind">Tipo de ativo *</Label>
                <Select
                  value={formData.assetKind}
                  onValueChange={(value) => setFormData({ ...formData, assetKind: value as AssetKind })}
                >
                  <SelectTrigger id="edit-asset-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ASSET_KIND_LABELS) as AssetKind[]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {ASSET_KIND_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedItem(null); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={!formData.name.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
