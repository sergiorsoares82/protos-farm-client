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
import { AlertCircle, Banknote, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  apiService,
  InvoiceFinancialsType,
  CreateInvoiceFinancialsTypeRequest,
  UpdateInvoiceFinancialsTypeRequest,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/services/api';

export const InvoiceFinancialsTypes = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isOrgAdmin = user?.role === UserRole.ORG_ADMIN;

  const [items, setItems] = useState<InvoiceFinancialsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InvoiceFinancialsType | null>(null);

  const [formData, setFormData] = useState<CreateInvoiceFinancialsTypeRequest>({
    name: '',
  });

  const [createAsSystem, setCreateAsSystem] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getInvoiceFinancialsTypes();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar tipos de pagamento',
      );
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
  };

  const validateForm = (): string | null => {
    if (!formData.name?.trim()) return 'Nome é obrigatório';
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
      const payload: CreateInvoiceFinancialsTypeRequest = {
        name: formData.name.trim(),
      };
      if (isSuperAdmin && createAsSystem) {
        payload.tenantId = null;
      }
      await apiService.createInvoiceFinancialsType(payload);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao criar tipo de pagamento',
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
      const updates: UpdateInvoiceFinancialsTypeRequest = {
        name: formData.name?.trim(),
      };
      if (!selectedItem.isSystem) {
        updates.isActive = editIsActive;
      }
      await apiService.updateInvoiceFinancialsType(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar tipo de pagamento',
      );
    }
  };

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item?.isSystem && !isSuperAdmin) return;
    if (!confirm('Tem certeza que deseja excluir este tipo de pagamento?')) return;
    try {
      setError(null);
      await apiService.deleteInvoiceFinancialsType(id);
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir tipo de pagamento',
      );
    }
  };

  const handleToggleActive = async (item: InvoiceFinancialsType) => {
    if (item.isSystem && !isSuperAdmin) return;
    try {
      setError(null);
      await apiService.updateInvoiceFinancialsType(item.id, {
        isActive: !item.isActive,
      });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    }
  };

  const canEditItem = (item: InvoiceFinancialsType) => {
    if (isSuperAdmin) return true;
    if (isOrgAdmin && !item.isSystem) return true;
    return false;
  };

  const canDeleteItem = (item: InvoiceFinancialsType) => {
    if (isSuperAdmin) return true;
    if (isOrgAdmin && !item.isSystem) return true;
    return false;
  };

  const openEditDialog = (item: InvoiceFinancialsType) => {
    if (!canEditItem(item)) return;
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
            <h1 className="text-3xl font-bold">Tipos de pagamento</h1>
            <p className="text-muted-foreground">
              Formas de pagamento para parcelas de notas fiscais (cheque, boleto, PIX, etc.). Super admin pode editar os tipos do sistema; org admin pode visualizar e criar tipos da organização.
            </p>
          </div>
          {(isSuperAdmin || isOrgAdmin) && (
            <Button
              onClick={() => {
                resetForm();
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar tipo
            </Button>
          )}
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
                <Banknote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum tipo de pagamento. Execute o seed no servidor ou crie um tipo.</p>
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
                      {item.name}
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
                        <span className="text-xs text-muted-foreground">Somente leitura</span>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {item.isSystem ? 'Tipo do sistema (visível para todas as organizações)' : 'Tipo da organização'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo tipo de pagamento</DialogTitle>
              <DialogDescription>
                Ex.: Cartão de crédito, Dinheiro. Super admin pode criar como tipo do sistema (visível para todas as organizações).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name ?? ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex.: Cartão de crédito, Dinheiro"
                />
              </div>
              {isSuperAdmin && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="createAsSystem"
                    checked={createAsSystem}
                    onCheckedChange={(checked) => setCreateAsSystem(!!checked)}
                  />
                  <Label htmlFor="createAsSystem" className="text-sm font-normal">
                    Criar como tipo do sistema (disponível para todas as organizações)
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
              <DialogTitle>Editar tipo de pagamento</DialogTitle>
              <DialogDescription>
                {selectedItem?.isSystem && isSuperAdmin
                  ? 'Editando tipo do sistema (visível para todas as organizações).'
                  : 'Altere o nome ou o status ativo/inativo.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name ?? ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              {selectedItem && !selectedItem.isSystem && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isActive"
                    checked={editIsActive}
                    onCheckedChange={(checked) => setEditIsActive(!!checked)}
                  />
                  <Label htmlFor="edit-isActive" className="text-sm font-normal">
                    Ativo
                  </Label>
                </div>
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
