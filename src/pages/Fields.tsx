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
import { AlertCircle, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  apiService,
  WorkLocation,
  WorkLocationType,
  CreateWorkLocationRequest,
  UpdateWorkLocationRequest,
  CostCenter,
} from '@/services/api';

export const Fields = () => {
  const [items, setItems] = useState<WorkLocation[]>([]);
  const [workLocationTypes, setWorkLocationTypes] = useState<WorkLocationType[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkLocation | null>(null);

  const [formData, setFormData] = useState<CreateWorkLocationRequest>({
    code: '',
    name: '',
    typeId: '',
    areaHectares: 1,
    costCenterId: null,
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const [locations, types, centers] = await Promise.all([
        apiService.getWorkLocations(),
        apiService.getWorkLocationTypes(),
        apiService.getCostCenters(),
      ]);
      setItems(locations);
      setWorkLocationTypes(types.filter((t) => t.isActive));
      setCostCenters(centers.filter((c) => c.isActive));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load work locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const selectedType = workLocationTypes.find((t) => t.id === formData.typeId);

  const validateForm = (): string | null => {
    if (!formData.code.trim()) return 'Código é obrigatório';
    if (!formData.name.trim()) return 'Nome é obrigatório';
    if (!formData.typeId) return 'Tipo de local é obrigatório';
    if (selectedType?.isTalhao) {
      const area = formData.areaHectares ?? 0;
      if (!Number.isFinite(area) || area <= 0) {
        return 'Área (ha) é obrigatória e deve ser maior que zero para este tipo';
      }
    } else {
      if (!formData.costCenterId || !formData.costCenterId.trim()) {
        return 'Centro de custo é obrigatório para este tipo de local';
      }
    }
    return null;
  };

  const resetForm = () => {
    const defaultTypeId = workLocationTypes.length > 0 ? workLocationTypes[0].id : '';
    setFormData({
      code: '',
      name: '',
      typeId: defaultTypeId,
      areaHectares: 1,
      costCenterId: null,
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
      const payload: CreateWorkLocationRequest = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        typeId: formData.typeId,
      };
      if (selectedType?.isTalhao) {
        payload.areaHectares = formData.areaHectares ?? 1;
        payload.costCenterId = null;
      } else {
        payload.costCenterId = formData.costCenterId ?? null;
        if (formData.areaHectares != null && formData.areaHectares > 0) {
          payload.areaHectares = formData.areaHectares;
        }
      }
      await apiService.createWorkLocation(payload);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create work location');
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
      const updates: UpdateWorkLocationRequest = {
        code: formData.code.trim(),
        name: formData.name.trim(),
        typeId: formData.typeId,
      };
      if (selectedType?.isTalhao) {
        updates.areaHectares = formData.areaHectares ?? 1;
        updates.costCenterId = null;
      } else {
        updates.costCenterId = formData.costCenterId ?? null;
        updates.areaHectares = formData.areaHectares ?? null;
      }
      await apiService.updateWorkLocation(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update work location');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este local de trabalho?')) return;
    try {
      setError(null);
      await apiService.deleteWorkLocation(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete work location');
    }
  };

  const handleToggleActive = async (item: WorkLocation) => {
    try {
      setError(null);
      await apiService.updateWorkLocation(item.id, { isActive: !item.isActive });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const openEditDialog = (item: WorkLocation) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      typeId: item.typeId,
      areaHectares: item.areaHectares ?? (item.isTalhao ? 1 : null),
      costCenterId: item.costCenterId ?? null,
    });
    setIsEditDialogOpen(true);
  };

  const typeName = (typeId: string) =>
    workLocationTypes.find((t) => t.id === typeId)?.name ?? typeId;

  const costCenterLabel = (id: string) => {
    const cc = costCenters.find((c) => c.id === id);
    return cc ? `${cc.code} - ${cc.description}` : id;
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Locais de Trabalho</h1>
            <p className="text-muted-foreground">
              Cadastre talhões, galpões, ordenha, fábrica de ração e outros locais.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar local
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando locais...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum local ainda. Clique em &quot;Adicionar local&quot; para criar o primeiro.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 flex-wrap">
                      {item.code}
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {typeName(item.typeId)}
                      </span>
                      {!item.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Inativo
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {item.isActive ? '✓' : '○'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {item.name}
                    {item.areaHectares != null && item.areaHectares > 0 && (
                      <> • {Number(item.areaHectares).toFixed(2)} ha</>
                    )}
                    {item.costCenterId && (
                      <> • {costCenterLabel(item.costCenterId)}</>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo local de trabalho</DialogTitle>
              <DialogDescription>
                Cadastre um talhão, galpão, ordenha, fábrica de ração ou outro local.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.typeId}
                  onValueChange={(value) => {
                    const t = workLocationTypes.find((x) => x.id === value);
                    setFormData({
                      ...formData,
                      typeId: value,
                      areaHectares: t?.isTalhao ? 1 : null,
                      costCenterId: t?.isTalhao ? null : formData.costCenterId,
                    });
                  }}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {workLocationTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="ex.: T01, G01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex.: Talhão Norte, Galpão 1"
                />
              </div>
              {selectedType?.isTalhao && (
                <div className="space-y-2">
                  <Label htmlFor="area">Área (ha) *</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.areaHectares ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        areaHectares: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              )}
              {selectedType && !selectedType.isTalhao && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="costCenter">Centro de custo *</Label>
                    <Select
                      value={formData.costCenterId ?? ''}
                      onValueChange={(value) =>
                        setFormData({ ...formData, costCenterId: value || null })
                      }
                    >
                      <SelectTrigger id="costCenter">
                        <SelectValue placeholder="Selecione o centro de custo" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.code} - {cc.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="areaOpt">Área (ha) – opcional</Label>
                    <Input
                      id="areaOpt"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.areaHectares ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          areaHectares: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar local de trabalho</DialogTitle>
              <DialogDescription>Altere as informações do local.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo *</Label>
                <Select
                  value={formData.typeId}
                  onValueChange={(value) => {
                    const t = workLocationTypes.find((x) => x.id === value);
                    setFormData({
                      ...formData,
                      typeId: value,
                      areaHectares: t?.isTalhao ? formData.areaHectares ?? 1 : formData.areaHectares,
                      costCenterId: t?.isTalhao ? null : formData.costCenterId,
                    });
                  }}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {workLocationTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-code">Código *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              {selectedType?.isTalhao && (
                <div className="space-y-2">
                  <Label htmlFor="edit-area">Área (ha) *</Label>
                  <Input
                    id="edit-area"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.areaHectares ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        areaHectares: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              )}
              {selectedType && !selectedType.isTalhao && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="edit-costCenter">Centro de custo *</Label>
                    <Select
                      value={formData.costCenterId ?? ''}
                      onValueChange={(value) =>
                        setFormData({ ...formData, costCenterId: value || null })
                      }
                    >
                      <SelectTrigger id="edit-costCenter">
                        <SelectValue placeholder="Selecione o centro de custo" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map((cc) => (
                          <SelectItem key={cc.id} value={cc.id}>
                            {cc.code} - {cc.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-areaOpt">Área (ha) – opcional</Label>
                    <Input
                      id="edit-areaOpt"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.areaHectares ?? ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          areaHectares: e.target.value
                            ? Number(e.target.value)
                            : null,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedItem(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleEdit}>Atualizar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
