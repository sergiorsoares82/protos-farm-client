import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
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
import { AlertCircle, ArrowLeftRight, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  apiService,
  StockMovement,
  StockMovementType,
  Item,
  WorkLocation,
  Season,
  CostCenter,
  ManagementAccount,
  CreateStockMovementRequest,
  UpdateStockMovementRequest,
  ItemType,
} from '@/services/api';

const defaultForm: CreateStockMovementRequest = {
  movementDate: new Date().toISOString().slice(0, 10),
  stockMovementTypeId: '',
  itemId: '',
  unit: '',
  quantity: 0,
  workLocationId: null,
  seasonId: null,
  costCenterId: null,
  managementAccountId: null,
};

export const StockMovements = () => {
  const [items, setItems] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockMovement | null>(null);

  const [stockMovementTypes, setStockMovementTypes] = useState<StockMovementType[]>([]);
  const [products, setProducts] = useState<Item[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [managementAccounts, setManagementAccounts] = useState<ManagementAccount[]>([]);

  const [formData, setFormData] = useState<CreateStockMovementRequest>({ ...defaultForm });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getStockMovements();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar movimentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadItems();
      try {
        const [types, itemsRes, wl, seas, cc, ma] = await Promise.all([
          apiService.getStockMovementTypes(),
          apiService.getItems(ItemType.PRODUCT, true),
          apiService.getWorkLocations(),
          apiService.getSeasons(),
          apiService.getCostCenters(),
          apiService.getManagementAccounts(),
        ]);
        setStockMovementTypes(types.filter((t) => t.isActive));
        setProducts(itemsRes.filter((i) => i.isActive));
        setWorkLocations(wl.filter((w) => w.isActive));
        setSeasons(seas.filter((s) => s.isActive));
        setCostCenters(cc.filter((c) => c.isActive));
        setManagementAccounts(ma.filter((a) => a.isActive));
      } catch (err) {
        console.error('Failed to load lookups for stock movements', err);
      }
    };
    init();
  }, []);

  const validateForm = (): string | null => {
    if (!formData.movementDate) return 'Data é obrigatória';
    if (!formData.stockMovementTypeId) return 'Tipo de movimento é obrigatório';
    if (!formData.itemId) return 'Produto é obrigatório';
    if (!formData.unit?.trim()) return 'Unidade é obrigatória';
    if (formData.quantity == null || formData.quantity <= 0) return 'Quantidade deve ser maior que zero';
    return null;
  };

  const resetForm = () => {
    setFormData({
      ...defaultForm,
      movementDate: new Date().toISOString().slice(0, 10),
    });
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      await apiService.createStockMovement(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar movimento');
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      const updates: UpdateStockMovementRequest = {
        movementDate: formData.movementDate,
        stockMovementTypeId: formData.stockMovementTypeId,
        itemId: formData.itemId,
        unit: formData.unit,
        quantity: formData.quantity,
        workLocationId: formData.workLocationId ?? null,
        seasonId: formData.seasonId ?? null,
        costCenterId: formData.costCenterId ?? null,
        managementAccountId: formData.managementAccountId ?? null,
      };
      await apiService.updateStockMovement(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar movimento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este movimento de estoque?')) return;
    try {
      setError(null);
      await apiService.deleteStockMovement(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir movimento');
    }
  };

  const openEditDialog = (item: StockMovement) => {
    setSelectedItem(item);
    setFormData({
      movementDate: item.movementDate.slice(0, 10),
      stockMovementTypeId: item.stockMovementTypeId,
      itemId: item.itemId,
      unit: item.unit,
      quantity: item.quantity,
      workLocationId: item.workLocationId,
      seasonId: item.seasonId,
      costCenterId: item.costCenterId,
      managementAccountId: item.managementAccountId,
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const s = iso.slice(0, 10);
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  const getTypeName = (id: string) => stockMovementTypes.find((t) => t.id === id)?.name ?? id;
  const getProductName = (id: string) => products.find((p) => p.id === id)?.name ?? id;
  const getWorkLocationName = (id: string) =>
    workLocations.find((w) => w.id === id)?.name ?? id;
  const getSeasonName = (id: string) => seasons.find((s) => s.id === id)?.name ?? id;
  const getCostCenterName = (id: string) =>
    costCenters.find((c) => c.id === id)?.description ?? id;
  const getManagementAccountName = (id: string) =>
    managementAccounts.find((a) => a.id === id)?.description ?? id;

  const onProductChange = (itemId: string) => {
    const product = products.find((p) => p.id === itemId);
    setFormData((prev) => ({
      ...prev,
      itemId,
      unit: product?.unit ?? prev.unit,
    }));
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Movimentos de Estoque</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie entradas e saídas de estoque (data, tipo, produto, unidade,
              quantidade, local de trabalho, safra, centro de custo, conta gerencial).
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo movimento
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando movimentos...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum movimento de estoque. Clique em &quot;Novo movimento&quot; para criar.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Data</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Produto</th>
                      <th className="px-4 py-3 font-medium">Unidade</th>
                      <th className="px-4 py-3 font-medium">Quantidade</th>
                      <th className="px-4 py-3 font-medium">Local de trabalho</th>
                      <th className="px-4 py-3 font-medium">Safra</th>
                      <th className="px-4 py-3 font-medium">Centro de custo</th>
                      <th className="px-4 py-3 font-medium">Conta gerencial</th>
                      <th className="px-4 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-4 py-3">{formatDate(item.movementDate)}</td>
                        <td className="px-4 py-3">{getTypeName(item.stockMovementTypeId)}</td>
                        <td className="px-4 py-3">{getProductName(item.itemId)}</td>
                        <td className="px-4 py-3">{item.unit}</td>
                        <td className="px-4 py-3">{Number(item.quantity)}</td>
                        <td className="px-4 py-3">
                          {item.workLocationId
                            ? getWorkLocationName(item.workLocationId)
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {item.seasonId ? getSeasonName(item.seasonId) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {item.costCenterId
                            ? getCostCenterName(item.costCenterId)
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {item.managementAccountId
                            ? getManagementAccountName(item.managementAccountId)
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
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
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(item.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo movimento de estoque</DialogTitle>
              <DialogDescription>
                Preencha data, tipo, produto, unidade, quantidade e opcionalmente local de
                trabalho, safra, centro de custo e conta gerencial.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="create-date">Data *</Label>
                <Input
                  id="create-date"
                  type="date"
                  value={formData.movementDate}
                  onChange={(e) =>
                    setFormData({ ...formData, movementDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de movimento *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.stockMovementTypeId}
                  onChange={(e) =>
                    setFormData({ ...formData, stockMovementTypeId: e.target.value })
                  }
                >
                  <option value="">Selecione...</option>
                  {stockMovementTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Produto *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.itemId}
                  onChange={(e) => onProductChange(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-unit">Unidade *</Label>
                  <Input
                    id="create-unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="ex: kg, un, L"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-qty">Quantidade *</Label>
                  <Input
                    id="create-qty"
                    type="number"
                    step="any"
                    min="0.0001"
                    value={formData.quantity || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local de trabalho</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.workLocationId ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workLocationId: e.target.value || null,
                    })
                  }
                >
                  <option value="">Nenhum</option>
                  {workLocations.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Safra</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.seasonId ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, seasonId: e.target.value || null })
                  }
                >
                  <option value="">Nenhuma</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Centro de custo</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.costCenterId ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, costCenterId: e.target.value || null })
                  }
                >
                  <option value="">Nenhum</option>
                  {costCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Conta gerencial</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.managementAccountId ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      managementAccountId: e.target.value || null,
                    })
                  }
                >
                  <option value="">Nenhuma</option>
                  {managementAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar movimento de estoque</DialogTitle>
              <DialogDescription>Altere os dados do movimento.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Data *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.movementDate}
                  onChange={(e) =>
                    setFormData({ ...formData, movementDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de movimento *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.stockMovementTypeId}
                  onChange={(e) =>
                    setFormData({ ...formData, stockMovementTypeId: e.target.value })
                  }
                >
                  <option value="">Selecione...</option>
                  {stockMovementTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Produto *</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.itemId}
                  onChange={(e) => onProductChange(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">Unidade *</Label>
                  <Input
                    id="edit-unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-qty">Quantidade *</Label>
                  <Input
                    id="edit-qty"
                    type="number"
                    step="any"
                    min="0.0001"
                    value={formData.quantity || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: Number(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local de trabalho</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.workLocationId ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      workLocationId: e.target.value || null,
                    })
                  }
                >
                  <option value="">Nenhum</option>
                  {workLocations.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Safra</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.seasonId ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, seasonId: e.target.value || null })
                  }
                >
                  <option value="">Nenhuma</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Centro de custo</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.costCenterId ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, costCenterId: e.target.value || null })
                  }
                >
                  <option value="">Nenhum</option>
                  {costCenters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Conta gerencial</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  value={formData.managementAccountId ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      managementAccountId: e.target.value || null,
                    })
                  }
                >
                  <option value="">Nenhuma</option>
                  {managementAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedItem(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleEdit}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
