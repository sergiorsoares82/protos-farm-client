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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Repeat, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  apiService,
  UnitOfMeasure,
  UnitOfMeasureConversion,
  CreateUnitOfMeasureConversionRequest,
  UpdateUnitOfMeasureConversionRequest,
} from '@/services/api';
import { useAuthorization } from '@/hooks/useAuthorization';

export const UnitOfMeasureConversions = () => {
  const { isSuperAdmin } = useAuthorization();
  const [items, setItems] = useState<UnitOfMeasureConversion[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UnitOfMeasureConversion | null>(null);

  const [formData, setFormData] = useState<CreateUnitOfMeasureConversionRequest>({
    fromUnitId: '',
    toUnitId: '',
    factor: 1,
    isSystem: false,
  });

  const [editFactor, setEditFactor] = useState<number>(1);

  const getUnitLabel = (id: string): string => {
    const u = units.find((x) => x.id === id);
    return u ? `${u.code} (${u.name})` : id;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [conversionsData, unitsData] = await Promise.all([
        apiService.getUnitOfMeasureConversions(),
        apiService.getUnitOfMeasures(),
      ]);
      setItems(conversionsData);
      setUnits(unitsData.filter((u) => u.isActive));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar conversões de medida',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setFormData({
      fromUnitId: '',
      toUnitId: '',
      factor: 1,
      isSystem: false,
    });
  };

  const validateCreateForm = (): string | null => {
    if (!formData.fromUnitId) return 'Selecione a unidade de origem';
    if (!formData.toUnitId) return 'Selecione a unidade de destino';
    if (formData.fromUnitId === formData.toUnitId) return 'Origem e destino devem ser diferentes';
    if (!Number.isFinite(formData.factor) || formData.factor <= 0) return 'Fator deve ser um número positivo';
    return null;
  };

  const handleCreate = async () => {
    const validationError = validateCreateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      const payload: CreateUnitOfMeasureConversionRequest = {
        fromUnitId: formData.fromUnitId,
        toUnitId: formData.toUnitId,
        factor: Number(formData.factor),
      };
      if (isSuperAdmin && formData.isSystem) {
        payload.isSystem = true;
      }
      await apiService.createUnitOfMeasureConversion(payload);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao criar conversão',
      );
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    if (!Number.isFinite(editFactor) || editFactor <= 0) {
      setError('Fator deve ser um número positivo');
      return;
    }
    try {
      setError(null);
      const updates: UpdateUnitOfMeasureConversionRequest = { factor: editFactor };
      await apiService.updateUnitOfMeasureConversion(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar conversão',
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conversão?')) return;
    try {
      setError(null);
      await apiService.deleteUnitOfMeasureConversion(id);
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir conversão',
      );
    }
  };

  const canEditItem = (item: UnitOfMeasureConversion): boolean => {
    if (item.isSystem) return isSuperAdmin;
    return true;
  };

  const openEditDialog = (item: UnitOfMeasureConversion) => {
    setSelectedItem(item);
    setEditFactor(item.factor);
    setIsEditDialogOpen(true);
  };

  const fromOptions = units.filter((u) => u.id !== formData.toUnitId);
  const toOptions = units.filter((u) => u.id !== formData.fromUnitId);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Conversões de medida</h1>
            <p className="text-muted-foreground">
              Defina equivalências entre unidades (ex.: 1 tonelada = 1000 kg). Mesmas regras de acesso que Unidades de medida: Super Admin edita conversões de sistema e de qualquer organização; Org Admin apenas da própria.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar conversão
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando conversões...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Repeat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversão cadastrada. Adicione uma ou execute o seed no servidor.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      1 {getUnitLabel(item.fromUnitId)} = {item.factor} {getUnitLabel(item.toUnitId)}
                      {item.isSystem && (
                        <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-1 rounded">
                          Sistema
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      {canEditItem(item) ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            title="Editar fator"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não editável</span>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Equivalência: 1 unidade de origem = {item.factor} unidade(s) de destino
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conversão de medida</DialogTitle>
              <DialogDescription>
                Defina a equivalência: 1 unidade de origem = fator × unidade de destino (ex.: 1 T = 1000 KG).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Unidade de origem *</Label>
                <Select
                  value={formData.fromUnitId}
                  onValueChange={(value) => setFormData({ ...formData, fromUnitId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade de origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {fromOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.code} – {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade de destino *</Label>
                <Select
                  value={formData.toUnitId}
                  onValueChange={(value) => setFormData({ ...formData, toUnitId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {toOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.code} – {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="factor">Fator * (1 origem = fator × destino)</Label>
                <Input
                  id="factor"
                  type="number"
                  min={0.000001}
                  step="any"
                  value={formData.factor}
                  onChange={(e) => setFormData({ ...formData, factor: parseFloat(e.target.value) || 0 })}
                  placeholder="ex.: 1000"
                />
              </div>
              {isSuperAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isSystem"
                    checked={formData.isSystem ?? false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isSystem: !!checked })
                    }
                  />
                  <Label htmlFor="isSystem" className="text-sm font-normal">
                    Conversão de sistema (disponível para todas as organizações)
                  </Label>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar fator da conversão</DialogTitle>
              <DialogDescription>
                Altere apenas o fator. Origem e destino não podem ser alterados.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {selectedItem && (
                <p className="text-sm text-muted-foreground">
                  1 {getUnitLabel(selectedItem.fromUnitId)} = ? {getUnitLabel(selectedItem.toUnitId)}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-factor">Fator *</Label>
                <Input
                  id="edit-factor"
                  type="number"
                  min={0.000001}
                  step="any"
                  value={editFactor}
                  onChange={(e) => setEditFactor(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedItem(null); }}>
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
