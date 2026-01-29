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
import { AlertCircle, Plus, Pencil, Trash2, Truck } from 'lucide-react';
import {
  apiService,
  MachineItem,
  MachineType,
  CreateMachineRequest,
  UpdateMachineRequest,
} from '@/services/api';

export const Machines = () => {
  const [items, setItems] = useState<MachineItem[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MachineItem | null>(null);

  const [formData, setFormData] = useState<CreateMachineRequest>({
    name: '',
    machineTypeId: '',
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const [machines, types] = await Promise.all([
        apiService.getMachines(),
        apiService.getMachineTypes(),
      ]);
      setItems(machines);
      setMachineTypes(types.filter((t) => t.isActive));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load machines');
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
      machineTypeId: '',
    });
  };

  const getTypeName = (machineTypeId: string) =>
    machineTypes.find((t) => t.id === machineTypeId)?.name ?? '—';

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Nome da máquina é obrigatório';
    if (!formData.machineTypeId) return 'Tipo de máquina é obrigatório';
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
      await apiService.createMachine(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar máquina');
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
      const updates: UpdateMachineRequest = {
        name: formData.name,
        machineTypeId: formData.machineTypeId,
      };
      await apiService.updateMachine(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar máquina');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta máquina?')) return;
    try {
      setError(null);
      await apiService.deleteMachine(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir máquina');
    }
  };

  const handleToggleActive = async (item: MachineItem) => {
    try {
      setError(null);
      await apiService.updateMachine(item.id, { isActive: !item.isActive });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
    }
  };

  const openEditDialog = (item: MachineItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      machineTypeId: item.machineTypeId,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Máquinas</h1>
            <p className="text-muted-foreground">
              Cadastro de máquinas (nome e tipo: trator, colheitadeira, semeadora, etc.).
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Máquina
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando máquinas...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma máquina cadastrada. Clique em &quot;Adicionar Máquina&quot; para criar a primeira.</p>
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
                        {!item.isActive && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Inativa
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Tipo: {getTypeName(item.machineTypeId)}
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
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Máquina</DialogTitle>
              <DialogDescription>
                Informe o nome da máquina e o tipo (trator, colheitadeira, semeadora, etc.).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da máquina *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex.: Trator 01, Colheitadeira John Deere"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="machineType">Tipo de máquina *</Label>
                <Select
                  value={formData.machineTypeId}
                  onValueChange={(value) => setFormData({ ...formData, machineTypeId: value })}
                >
                  <SelectTrigger id="machineType">
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
              <Button
                onClick={handleCreate}
                disabled={!formData.name.trim() || !formData.machineTypeId}
              >
                Criar Máquina
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Máquina</DialogTitle>
              <DialogDescription>Altere o nome e/ou o tipo da máquina.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome da máquina *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-machineType">Tipo de máquina *</Label>
                <Select
                  value={formData.machineTypeId}
                  onValueChange={(value) => setFormData({ ...formData, machineTypeId: value })}
                >
                  <SelectTrigger id="edit-machineType">
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
              <Button
                onClick={handleEdit}
                disabled={!formData.name.trim() || !formData.machineTypeId}
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
