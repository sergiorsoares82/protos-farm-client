import { useState, useEffect } from 'react';
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
import { Building2, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { apiService, CostCenter, CostCenterType, CreateCostCenterRequest, UpdateCostCenterRequest, CostCenterCategory } from '@/services/api';

export const CostCenters = () => {
    const [items, setItems] = useState<CostCenter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<CostCenter | null>(null);
    const [categories, setCategories] = useState<CostCenterCategory[]>([]);

    // Form state
    const [formData, setFormData] = useState<CreateCostCenterRequest>({
        code: '',
        description: '',
        type: CostCenterType.ADMINISTRATIVE,
    });

    // Load items
    const loadItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getCostCenters();
            setItems(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load cost centers');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await apiService.getCostCenterCategories();
            setCategories(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load cost center categories');
        }
    };

    useEffect(() => {
        loadItems();
        loadCategories();
    }, []);

    // Validate form
    const validateForm = (): string | null => {
        if (!formData.code.trim()) {
            return 'Code (Sigla) is required';
        }
        if (!formData.description.trim()) {
            return 'Description is required';
        }
        return null;
    };

    // Handle create
    const handleCreate = async () => {
        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setError(null);
            await apiService.createCostCenter(formData);
            setIsCreateDialogOpen(false);
            resetForm();
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create cost center');
        }
    };

    // Handle edit
    const handleEdit = async () => {
        if (!selectedItem) return;

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setError(null);
            const updates: UpdateCostCenterRequest = {
                code: formData.code,
                description: formData.description,
                type: formData.type,
                categoryId: formData.categoryId,
            };
            await apiService.updateCostCenter(selectedItem.id, updates);
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForm();
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update cost center');
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this cost center?')) return;

        try {
            setError(null);
            await apiService.deleteCostCenter(id);
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete cost center');
        }
    };

    // Handle toggle active
    const handleToggleActive = async (item: CostCenter) => {
        try {
            setError(null);
            await apiService.updateCostCenter(item.id, { isActive: !item.isActive });
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            type: CostCenterType.ADMINISTRATIVE,
        });
    };

    // Open edit dialog
    const openEditDialog = (item: CostCenter) => {
        setSelectedItem(item);
        setFormData({
            code: item.code,
            description: item.description,
            type: item.type,
            categoryId: item.categoryId,
        });
        setIsEditDialogOpen(true);
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Cost Centers</h1>
                        <p className="text-muted-foreground">Manage your organization's cost centers</p>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Cost Center
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">Loading cost centers...</div>
                ) : items.length === 0 ? (
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center text-muted-foreground">
                                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No cost centers yet. Click "Add Cost Center" to create your first one.</p>
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
                                            {!item.isActive && (
                                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                                    Inactive
                                                </span>
                                            )}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleActive(item)}
                                                title={item.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {item.isActive ? '✓' : '○'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(item)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardTitle>
                                    <CardDescription>{item.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div>
                                            <span className="font-semibold">Type:</span>{' '}
                                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                                {item.type}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-semibold">Category:</span>{' '}
                                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs">
                                                {item.categoryId
                                                    ? categories.find((c) => c.id === item.categoryId)?.name ||
                                                      'Unknown'
                                                    : 'No category'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Create Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Cost Center</DialogTitle>
                            <DialogDescription>
                                Create a new cost center for your organization
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Code (Sigla) *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., ADM01"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., Headquarters Administration"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value as CostCenterType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(CostCenterType).map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={
                                        formData.categoryId &&
                                        categories.some((c) => c.id === formData.categoryId)
                                            ? formData.categoryId
                                            : '__none__'
                                    }
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            categoryId: value === '__none__' ? undefined : value,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="No category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">No category</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.code} - {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); setError(null); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={!formData.code || !formData.description}>
                                Create Cost Center
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Cost Center</DialogTitle>
                            <DialogDescription>
                                Update cost center information
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-code">Code (Sigla) *</Label>
                                <Input
                                    id="edit-code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description *</Label>
                                <Input
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-type">Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value as CostCenterType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(CostCenterType).map((type) => (
                                            <SelectItem key={type} value={type}>
                                                {type}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-category">Category</Label>
                                <Select
                                    value={
                                        formData.categoryId &&
                                        categories.some((c) => c.id === formData.categoryId)
                                            ? formData.categoryId
                                            : '__none__'
                                    }
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            categoryId: value === '__none__' ? undefined : value,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="No category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">No category</SelectItem>
                                        {categories.map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.code} - {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedItem(null); resetForm(); setError(null); }}>
                                Cancel
                            </Button>
                            <Button onClick={handleEdit} disabled={!formData.code || !formData.description}>
                                Update Cost Center
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
};
