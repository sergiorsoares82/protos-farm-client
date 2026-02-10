import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { AlertCircle, Layers, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  apiService,
  CostCenterKindCategory,
  CostCenterKindCategoryType,
  CreateCostCenterKindCategoryRequest,
  UpdateCostCenterKindCategoryRequest,
} from '@/services/api';

const TYPE_LABELS: Record<CostCenterKindCategoryType, string> = {
  machine: 'Máquinas',
  building: 'Benfeitorias',
  general: 'Gerais',
};

export const CostCenterKindCategories = () => {
  const [items, setItems] = useState<CostCenterKindCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CostCenterKindCategory | null>(null);

  const [formData, setFormData] = useState<CreateCostCenterKindCategoryRequest>({
    code: '',
    name: '',
    type: 'general',
    sortOrder: 0,
  });

  const [editData, setEditData] = useState<UpdateCostCenterKindCategoryRequest>({});

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCostCenterKindCategories();
      setItems(data.sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar categorias de centros de custo',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      type: 'general',
      sortOrder: items.length,
    });
  };

  const validateCreate = (): string | null => {
    if (!formData.code.trim()) return 'Código é obrigatório';
    if (!formData.name.trim()) return 'Nome é obrigatório';
    return null;
  };

  const handleCreate = async () => {
    const validationError = validateCreate();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      await apiService.createCostCenterKindCategory({
        ...formData,
        sortOrder: formData.sortOrder ?? items.length,
      });
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao criar categoria de centro de custo',
      );
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    try {
      setError(null);
      await apiService.updateCostCenterKindCategory(selectedItem.id, editData);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      setEditData({});
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar categoria',
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria? Centros de custo vinculados precisam ser removidos ou reatribuídos antes.')) return;
    try {
      setError(null);
      await apiService.deleteCostCenterKindCategory(id);
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir categoria',
      );
    }
  };

  const openEditDialog = (item: CostCenterKindCategory) => {
    setSelectedItem(item);
    setEditData({
      code: item.code,
      name: item.name,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Categorias de Centros de Custo</h1>
            <p className="text-muted-foreground">
              Defina as categorias que aparecem nas abas do gerenciamento (Máquinas, Benfeitorias, Gerais e outras).
              Novas categorias são do tipo &quot;Gerais&quot;.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma categoria. Execute o seed do servidor ou crie a primeira categoria.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm font-semibold text-gray-700">
                        {item.code}
                      </span>
                      {item.name}
                      {!item.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Inativa
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Tipo: {TYPE_LABELS[item.type]} · Ordem: {item.sortOrder}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Categoria de Centro de Custo</DialogTitle>
              <DialogDescription>
                Novas categorias são do tipo &quot;Gerais&quot; e aparecem como nova aba no gerenciamento.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: OUTROS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Outros"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CostCenterKindCategoryType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{TYPE_LABELS.general}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Apenas categorias &quot;Gerais&quot; podem ser criadas aqui.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Ordem</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={0}
                  value={formData.sortOrder ?? 0}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!formData.code?.trim() || !formData.name?.trim()}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Categoria</DialogTitle>
              <DialogDescription>Altere código, nome, ordem ou status ativo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Código *</Label>
                <Input
                  id="edit-code"
                  value={editData.code ?? ''}
                  onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={editData.name ?? ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sortOrder">Ordem</Label>
                <Input
                  id="edit-sortOrder"
                  type="number"
                  min={0}
                  value={editData.sortOrder ?? 0}
                  onChange={(e) => setEditData({ ...editData, sortOrder: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
              {selectedItem && (
                <div className="space-y-2">
                  <Label>Ativo</Label>
                  <Select
                    value={editData.isActive === false ? 'false' : 'true'}
                    onValueChange={(v) => setEditData({ ...editData, isActive: v === 'true' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedItem(null); setEditData({}); }}>
                Cancelar
              </Button>
              <Button onClick={handleEdit} disabled={!editData.code?.trim() || !editData.name?.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
