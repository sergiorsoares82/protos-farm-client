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
import { AlertCircle, Tags, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  apiService,
  CostCenterCategory,
  CreateCostCenterCategoryRequest,
  UpdateCostCenterCategoryRequest,
} from '@/services/api';

export const CostCenterCategories = () => {
  const [items, setItems] = useState<CostCenterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CostCenterCategory | null>(null);

  const [formData, setFormData] = useState<CreateCostCenterCategoryRequest>({
    code: '',
    name: '',
    description: '',
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCostCenterCategories();
      setItems(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load cost center categories',
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
      await apiService.createCostCenterCategory(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create cost center category',
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
      const updates: UpdateCostCenterCategoryRequest = {
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
      };
      await apiService.updateCostCenterCategory(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update cost center category',
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      setError(null);
      await apiService.deleteCostCenterCategory(id);
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete cost center category',
      );
    }
  };

  const openEditDialog = (item: CostCenterCategory) => {
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
            <h1 className="text-3xl font-bold">Cost Center Categories</h1>
            <p className="text-muted-foreground">
              Define categories like Agriculture, Dairy, Beef, Machines, Facilities, etc.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading categories...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <Tags className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No categories yet. Click &quot;Add Category&quot; to create the first one.</p>
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
                          Inactive
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
                  {item.description && (
                    <CardDescription>{item.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>
                Create a new cost center category for grouping your activities.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., AGRI, DAIRY"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Agriculture"
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
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update cost center category information.</DialogDescription>
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

