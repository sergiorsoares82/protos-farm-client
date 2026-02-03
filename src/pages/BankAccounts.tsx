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
import { AlertCircle, Landmark, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  apiService,
  BankAccount,
  CreateBankAccountRequest,
  UpdateBankAccountRequest,
} from '@/services/api';

export const BankAccounts = () => {
  const [items, setItems] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BankAccount | null>(null);

  const [formData, setFormData] = useState<CreateBankAccountRequest>({
    name: '',
    bankName: '',
    agency: '',
    accountNumber: '',
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBankAccounts();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao carregar contas bancárias',
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
      name: '',
      bankName: '',
      agency: '',
      accountNumber: '',
    });
    setFormError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Nome é obrigatório';
    return null;
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    try {
      setFormError(null);
      await apiService.createBankAccount({
        name: formData.name.trim(),
        bankName: formData.bankName?.trim() || null,
        agency: formData.agency?.trim() || null,
        accountNumber: formData.accountNumber?.trim() || null,
      });
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Falha ao criar conta bancária',
      );
    }
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    try {
      setFormError(null);
      const updates: UpdateBankAccountRequest = {
        name: formData.name.trim(),
        bankName: formData.bankName?.trim() || null,
        agency: formData.agency?.trim() || null,
        accountNumber: formData.accountNumber?.trim() || null,
      };
      await apiService.updateBankAccount(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Falha ao atualizar conta bancária',
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta bancária?'))
      return;
    try {
      setError(null);
      await apiService.deleteBankAccount(id);
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao excluir conta bancária',
      );
    }
  };

  const handleToggleActive = async (item: BankAccount) => {
    try {
      setError(null);
      await apiService.updateBankAccount(item.id, {
        isActive: !item.isActive,
      });
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Falha ao atualizar status',
      );
    }
  };

  const openEditDialog = (item: BankAccount) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      bankName: item.bankName ?? '',
      agency: item.agency ?? '',
      accountNumber: item.accountNumber ?? '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contas bancárias</h1>
            <p className="text-muted-foreground">
              Cadastre contas bancárias da organização (banco, agência, número da conta).
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova conta
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando contas...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Landmark className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conta bancária cadastrada. Clique em &quot;Nova conta&quot; para começar.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className={!item.isActive ? 'opacity-60' : ''}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      {item.name}
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
                    </div>
                  </CardTitle>
                  <CardDescription className="space-y-1">
                    {item.bankName && (
                      <div>
                        <span className="font-medium">Banco:</span> {item.bankName}
                      </div>
                    )}
                    {(item.agency || item.accountNumber) && (
                      <div className="text-sm">
                        {item.agency && (
                          <span>Ag: {item.agency}</span>
                        )}
                        {item.agency && item.accountNumber && ' · '}
                        {item.accountNumber && (
                          <span>Conta: {item.accountNumber}</span>
                        )}
                      </div>
                    )}
                    {!item.bankName && !item.agency && !item.accountNumber && (
                      <span className="text-muted-foreground">Sem detalhes</span>
                    )}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conta bancária</DialogTitle>
              <DialogDescription>
                Informe um nome para identificar a conta e, opcionalmente, banco, agência e número.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formError && (
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="create-name">Nome *</Label>
                <Input
                  id="create-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="ex.: Conta Corrente Principal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-bankName">Banco</Label>
                <Input
                  id="create-bankName"
                  value={formData.bankName ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  placeholder="ex.: Banco do Brasil"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-agency">Agência</Label>
                  <Input
                    id="create-agency"
                    value={formData.agency ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, agency: e.target.value })
                    }
                    placeholder="ex.: 1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-accountNumber">Número da conta</Label>
                  <Input
                    id="create-accountNumber"
                    value={formData.accountNumber ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="ex.: 12345-6"
                  />
                </div>
              </div>
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

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar conta bancária</DialogTitle>
              <DialogDescription>
                Altere nome, banco, agência ou número da conta.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {formError && (
                <div className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {formError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="ex.: Conta Corrente Principal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-bankName">Banco</Label>
                <Input
                  id="edit-bankName"
                  value={formData.bankName ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  placeholder="ex.: Banco do Brasil"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-agency">Agência</Label>
                  <Input
                    id="edit-agency"
                    value={formData.agency ?? ''}
                    onChange={(e) =>
                      setFormData({ ...formData, agency: e.target.value })
                    }
                    placeholder="ex.: 1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-accountNumber">Número da conta</Label>
                  <Input
                    id="edit-accountNumber"
                    value={formData.accountNumber ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                    placeholder="ex.: 12345-6"
                  />
                </div>
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
              <Button onClick={handleEdit}>Atualizar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
