import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  Card,
  CardContent,
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
import { AlertCircle, Plus, Pencil, Trash2, Activity } from 'lucide-react';
import {
  apiService,
  ActivityType,
  CreateActivityTypeRequest,
  UpdateActivityTypeRequest,
  UserRole,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const ActivityTypes = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isOrgAdmin = user?.role === UserRole.ORG_ADMIN;

  const [items, setItems] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ActivityType | null>(null);

  const [formData, setFormData] = useState<CreateActivityTypeRequest>({
    name: '',
  });

  const [createAsSystem, setCreateAsSystem] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  const canEdit = (item: ActivityType) =>
    isSuperAdmin || (!item.isSystem && isOrgAdmin);
  const canDelete = (item: ActivityType) =>
    isSuperAdmin || (!item.isSystem && isOrgAdmin);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getActivityTypes();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar tipos de atividade');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setFormData({ name: '' });
    setCreateAsSystem(false);
    setEditIsActive(true);
  };

  const validateForm = (): string | null => {
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
      const payload: CreateActivityTypeRequest = {
        name: formData.name.trim(),
      };
      if (isSuperAdmin && createAsSystem) {
        payload.tenantId = null;
      }
      await apiService.createActivityType(payload);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar tipo de atividade');
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
      const updates: UpdateActivityTypeRequest = {
        name: formData.name,
        isActive: editIsActive,
      };
      await apiService.updateActivityType(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar tipo de atividade');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de atividade?')) return;
    try {
      setError(null);
      await apiService.deleteActivityType(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir tipo de atividade');
    }
  };

  const handleToggleActive = async (item: ActivityType) => {
    if (!canEdit(item)) return;
    try {
      setError(null);
      await apiService.updateActivityType(item.id, { isActive: !item.isActive });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    }
  };

  const openEditDialog = (item: ActivityType) => {
    setSelectedItem(item);
    setFormData({ name: item.name });
    setEditIsActive(item.isActive);
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tipos de Atividade</h1>
            <p className="text-muted-foreground">
              Cadastro de tipos de atividade (nome e status ativo/inativo).
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo tipo de atividade
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando tipos de atividade...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tipo de atividade ainda. Clique em &quot;Novo tipo de atividade&quot; para criar o primeiro.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base flex flex-wrap items-center gap-2">
                        <span className="break-words">{item.name}</span>
                        {item.isSystem && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Sistema
                          </span>
                        )}
                        {!item.isActive && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Inativo
                          </span>
                        )}
                      </CardTitle>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(item)}
                        title={!canEdit(item) ? 'Apenas super admin pode editar tipo do sistema' : item.isActive ? 'Desativar' : 'Ativar'}
                        disabled={!canEdit(item)}
                      >
                        {item.isActive ? '✓' : '○'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(item)}
                        title={!canEdit(item) ? 'Apenas super admin pode editar tipo do sistema' : 'Editar'}
                        disabled={!canEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                        title={!canDelete(item) ? 'Apenas super admin pode excluir tipo do sistema' : 'Excluir'}
                        disabled={!canDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo tipo de atividade</DialogTitle>
              <DialogDescription>
                Informe o nome do tipo de atividade.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex.: Plantio, Colheita, Irrigação"
                />
              </div>
              {isSuperAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createAsSystem"
                    checked={createAsSystem}
                    onCheckedChange={(checked) => setCreateAsSystem(checked === true)}
                  />
                  <Label htmlFor="createAsSystem" className="cursor-pointer">
                    Disponível para todas as organizações (tipo de sistema)
                  </Label>
                </div>
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
              <Button onClick={handleCreate} disabled={!formData.name.trim()}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar tipo de atividade</DialogTitle>
              <DialogDescription>Altere o nome e o status ativo/inativo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex.: Plantio, Colheita"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isActive"
                  checked={editIsActive}
                  onCheckedChange={(checked) => setEditIsActive(checked === true)}
                />
                <Label htmlFor="edit-isActive" className="cursor-pointer">
                  Ativo
                </Label>
              </div>
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
