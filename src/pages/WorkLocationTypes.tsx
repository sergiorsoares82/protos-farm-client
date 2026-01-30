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
import { AlertCircle, Tags, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  apiService,
  WorkLocationType,
  CreateWorkLocationTypeRequest,
  UpdateWorkLocationTypeRequest,
} from '@/services/api';

export const WorkLocationTypes = () => {
  const [items, setItems] = useState<WorkLocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WorkLocationType | null>(null);

  const [formData, setFormData] = useState<CreateWorkLocationTypeRequest>({
    code: '',
    name: '',
    isTalhao: false,
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getWorkLocationTypes();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load work location types',
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
      isTalhao: false,
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
      await apiService.createWorkLocationType(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create work location type',
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
      const updates: UpdateWorkLocationTypeRequest = {
        code: formData.code,
        name: formData.name,
      };
      await apiService.updateWorkLocationType(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update work location type',
      );
    }
  };

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.isSystem) return;
    if (!confirm('Tem certeza que deseja excluir este tipo de local?')) return;
    try {
      setError(null);
      await apiService.deleteWorkLocationType(id);
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete work location type',
      );
    }
  };

  const handleToggleActive = async (item: WorkLocationType) => {
    if (item.isSystem) return;
    try {
      setError(null);
      await apiService.updateWorkLocationType(item.id, {
        isActive: !item.isActive,
      });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const openEditDialog = (item: WorkLocationType) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      isTalhao: item.isTalhao,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tipos de local de trabalho</h1>
            <p className="text-muted-foreground">
              Cadastre tipos como Talhão, Galpão, Ordenha, Fábrica de ração. Apenas administradores podem gerenciar.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar tipo
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando tipos...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tipo ainda. Tipos padrão (Talhão, Galpão, etc.) são criados ao usar Locais de Trabalho.</p>
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
                      {item.isTalhao && !item.isSystem && (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          Talhão
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                          Inativo
                        </span>
                      )}
                    </span>
                    <div className="flex gap-2">
                      {!item.isSystem && (
                        <>
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
                      )}
                      {item.isSystem && (
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
              <DialogTitle>Novo tipo de local</DialogTitle>
              <DialogDescription>
                Tipos &quot;Talhão&quot; são vinculados ao centro de custo por safra; os demais ao centro de custo direto.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="ex.: TALHAO, GALPAO"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex.: Talhão, Galpão"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTalhao"
                  checked={formData.isTalhao}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isTalhao: !!checked })
                  }
                />
                <Label htmlFor="isTalhao" className="text-sm font-normal">
                  É talhão (vincula centro de custo por safra)
                </Label>
              </div>
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
              <DialogTitle>Editar tipo de local</DialogTitle>
              <DialogDescription>
                Código e nome. O campo &quot;É talhão&quot; não pode ser alterado após a criação.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Código *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                  É talhão: {selectedItem.isTalhao ? 'Sim' : 'Não'}
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
