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
import { AlertCircle, Plus, Pencil, Trash2, Truck } from 'lucide-react';
import {
  apiService,
  MachineType,
  CreateMachineTypeRequest,
  UpdateMachineTypeRequest,
} from '@/services/api';

export const MachineTypes = () => {
  const [items, setItems] = useState<MachineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MachineType | null>(null);

  const [formData, setFormData] = useState<CreateMachineTypeRequest>({
    code: '',
    name: '',
    description: '',
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMachineTypes();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load machine types');
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
      description: '',
    });
  };

  const validateForm = (): string | null => {
    if (!formData.code.trim()) return 'Code is required';
    if (!formData.name.trim()) return 'Name is required';
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
      await apiService.createMachineType(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create machine type');
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
      const updates: UpdateMachineTypeRequest = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
      };
      await apiService.updateMachineType(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update machine type');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this machine type?')) return;
    try {
      setError(null);
      await apiService.deleteMachineType(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete machine type');
    }
  };

  const handleToggleActive = async (item: MachineType) => {
    try {
      setError(null);
      await apiService.updateMachineType(item.id, { isActive: !item.isActive });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const openEditDialog = (item: MachineType) => {
    setSelectedItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Machine Types</h1>
            <p className="text-muted-foreground">
              Manage types of machines (tractors, harvesters, seeders, etc.).
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Machine Type
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading machine types...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No machine types yet. Click &quot;Add Machine Type&quot; to create the first one.</p>
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
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm font-semibold text-gray-700">
                          {item.code}
                        </span>
                        <span className="break-words">{item.name}</span>
                        {!item.isActive && (
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </CardTitle>
                      {item.description && (
                        <CardDescription className="mt-1">{item.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleActive(item)}
                        title={item.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {item.isActive ? '✓' : '○'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(item)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                        title="Delete"
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
              <DialogTitle>Add New Machine Type</DialogTitle>
              <DialogDescription>
                Create a new machine type (e.g. tractor, harvester, seeder).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., TRAC, HARV, SEED"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tractor, Harvester, Seeder"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
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
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.code || !formData.name}>
                Create Machine Type
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Machine Type</DialogTitle>
              <DialogDescription>Update machine type information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Code *</Label>
                <Input
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
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
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={!formData.code || !formData.name}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
