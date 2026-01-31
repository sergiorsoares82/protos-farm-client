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
import { AlertCircle, Ruler, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  apiService,
  UnitOfMeasure,
  CreateUnitOfMeasureRequest,
  UpdateUnitOfMeasureRequest,
} from '@/services/api';
import { useAuthorization } from '@/hooks/useAuthorization';

export const UnitOfMeasures = () => {
  const { isSuperAdmin } = useAuthorization();
  const [items, setItems] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UnitOfMeasure | null>(null);

  const [formData, setFormData] = useState<CreateUnitOfMeasureRequest>({
    code: '',
    name: '',
    isSystem: false,
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getUnitOfMeasures();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar unidades de medida',
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
      isSystem: false,
    });
  };

  const validateForm = (): string | null => {
    if (!formData.code.trim()) return 'Código é obrigatório';
    if (!formData.name.trim()) return 'Nome é obrigatório';
    return null;
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      const payload: CreateUnitOfMeasureRequest = {
        code: formData.code.trim(),
        name: formData.name.trim(),
      };
      if (isSuperAdmin && formData.isSystem) {
        payload.isSystem = true;
      }
      await apiService.createUnitOfMeasure(payload);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao criar unidade de medida',
      );
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
      const updates: UpdateUnitOfMeasureRequest = {
        code: formData.code.trim(),
        name: formData.name.trim(),
      };
      await apiService.updateUnitOfMeasure(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar unidade de medida',
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta unidade de medida?')) return;
    try {
      setError(null);
      await apiService.deleteUnitOfMeasure(id);
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir unidade de medida',
      );
    }
  };

  const handleToggleActive = async (item: UnitOfMeasure) => {
    try {
      setError(null);
      await apiService.updateUnitOfMeasure(item.id, {
        isActive: !item.isActive,
      });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    }
  };

  const canEditItem = (item: UnitOfMeasure): boolean => {
    if (item.isSystem) return isSuperAdmin;
    return true; // org admin can edit own org; super admin can edit any; backend enforces
  };

  const openEditDialog = (item: UnitOfMeasure) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      isSystem: item.isSystem,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Unidades de medida</h1>
            <p className="text-muted-foreground">
              Cadastre unidades como kg, L, un, ha, saca. Unidades de sistema são compartilhadas por todas as organizações; apenas Super Admin pode criá-las e editá-las.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar unidade
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando unidades...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Ruler className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma unidade cadastrada. Execute o seed no servidor ou adicione manualmente.</p>
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
                      {item.code}
                      {item.isSystem && (
                        <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2 py-1 rounded">
                          Sistema
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Inativo
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      {canEditItem(item) ? (
                        <>
                          {!item.isSystem && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(item)}
                              title={item.isActive ? 'Desativar' : 'Ativar'}
                            >
                              {item.isActive ? '✓' : '○'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(item)}
                            title="Editar"
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
                  <CardDescription>{item.name}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova unidade de medida</DialogTitle>
              <DialogDescription>
                Código (ex.: KG, L, UN) e nome. Unidades de sistema ficam disponíveis para todas as organizações (apenas Super Admin).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="ex.: KG, L, UN, HA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex.: Quilograma, Litro, Unidade"
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
                    Unidade de sistema (disponível para todas as organizações)
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
              <DialogTitle>Editar unidade de medida</DialogTitle>
              <DialogDescription>
                Altere código e nome. Unidades de sistema só podem ser editadas por Super Admin.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Código *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              {selectedItem && (
                <p className="text-sm text-muted-foreground">
                  {selectedItem.isSystem ? 'Unidade de sistema' : 'Unidade da organização'}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedItem(null); resetForm(); }}>
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
