import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import {
    Card,
    CardContent,
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
import { BadgeDollarSign, Plus, Pencil, Trash2, AlertCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import {
  apiService,
  ManagementAccount,
  AccountType,
  CreateManagementAccountRequest,
  UpdateManagementAccountRequest,
  CostCenterCategory,
} from '@/services/api';

export const ManagementAccounts = () => {
    const [items, setItems] = useState<ManagementAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ManagementAccount | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateManagementAccountRequest>({
        code: '',
        description: '',
        type: AccountType.REVENUE,
        categoryIds: [],
    });
    
    // Form-specific error state
    const [formError, setFormError] = useState<string | null>(null);

  // Cost center categories for assigning to accounts
  const [categories, setCategories] = useState<CostCenterCategory[]>([]);

  // Inline create-category dialog state (quick add from Management Accounts)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<{ code: string; name: string; description: string }>({
    code: '',
    name: '',
    description: '',
  });

    // Load items
    const loadItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getManagementAccounts();
            setItems(data);
        } catch (err) {
            console.error('Failed to load management accounts', err);
            // For better UX, don't show a scary error banner on first load;
            // just treat as "no accounts" so the user can start creating them.
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await loadItems();
            try {
                const cats = await apiService.getCostCenterCategories();
                setCategories(cats);
            } catch (err) {
                console.error('Failed to load cost center categories for management accounts', err);
            }
        };
        init();
    }, []);

    const handleCreateCategory = async () => {
        if (!newCategory.code.trim() || !newCategory.name.trim()) {
            setFormError('Category code and name are required');
            return;
        }
        try {
            setFormError(null);
            await apiService.createCostCenterCategory({
                code: newCategory.code,
                name: newCategory.name,
                description: newCategory.description || undefined,
            });
            const updated = await apiService.getCostCenterCategories();
            setCategories(updated);
            setIsCreateCategoryOpen(false);
            setNewCategory({ code: '', name: '', description: '' });
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : 'Failed to create cost center category',
            );
        }
    };

    // Validate form
    const validateForm = (): string | null => {
        if (!formData.code.trim()) {
            return 'Code is required';
        }
        if (!/^\d+(\.\d+)*$/.test(formData.code)) {
            return 'Invalid code format. Use numbers separated by dots (e.g. 01.01)';
        }
        if (!formData.code.startsWith('01') && !formData.code.startsWith('02')) {
            return 'Code must start with 01 (Revenue) or 02 (Expense)';
        }
        if (!formData.description.trim()) {
            return 'Description is required';
        }
        if (!formData.categoryIds || formData.categoryIds.length === 0) {
            return 'Please select at least one cost center category';
        }
        return null;
    };

    // Handle create
    const handleCreate = async () => {
        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        try {
            setFormError(null);
            await apiService.createManagementAccount({
                ...formData,
                categoryIds: formData.categoryIds && formData.categoryIds.length > 0
                    ? formData.categoryIds
                    : categories.map((c) => c.id),
            });
            setIsCreateDialogOpen(false);
            resetForm();
            await loadItems();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to create management account');
        }
    };

    // Handle edit
    const handleEdit = async () => {
        if (!selectedItem) return;

        const validationError = validateForm();
        if (validationError) {
            setFormError(validationError);
            return;
        }

        try {
            setFormError(null);
            const updates: UpdateManagementAccountRequest = {
                code: formData.code,
                description: formData.description,
                type: formData.type,
                categoryIds: formData.categoryIds,
            };
            await apiService.updateManagementAccount(selectedItem.id, updates);
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForm();
            await loadItems();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to update management account');
        }
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this management account?')) return;

        try {
            setError(null);
            await apiService.deleteManagementAccount(id);
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete management account');
        }
    };

    // Handle toggle active
    const handleToggleActive = async (item: ManagementAccount) => {
        try {
            setError(null);
            await apiService.updateManagementAccount(item.id, { isActive: !item.isActive });
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
            type: AccountType.REVENUE,
            categoryIds: categories.map((c) => c.id),
        });
        setFormError(null);
    };

    // Open edit dialog
    const openEditDialog = (item: ManagementAccount) => {
        setSelectedItem(item);
        setFormData({
            code: item.code,
            description: item.description,
            type: item.type,
            categoryIds: item.categoryIds ?? [],
        });
        setFormError(null);
        setIsEditDialogOpen(true);
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Management Accounts</h1>
                        <p className="text-muted-foreground">Manage your chart of accounts (Revenue/Expense)</p>
                    </div>
                    <Button onClick={() => {
                        resetForm();
                        setIsCreateDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">Loading accounts...</div>
                ) : items.length === 0 ? (
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center text-muted-foreground">
                                <BadgeDollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No accounts found.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => {
                            // Calculate indentation level based on dots
                            const level = item.code.split('.').length - 1;
                            const paddingLeft = `${level * 2}rem`;

                            return (
                                <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''} style={{ marginLeft: paddingLeft }}>
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm font-semibold text-gray-700 w-24 text-center">
                                                    {item.code}
                                                </span>
                                                {item.type === AccountType.REVENUE ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100 w-24 justify-center">
                                                        <ArrowUpCircle className="h-3 w-3" /> Revenue
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-100 w-24 justify-center">
                                                        <ArrowDownCircle className="h-3 w-3" /> Expense
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="font-medium">{item.description}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Categories:{' '}
                                                    {item.categoryIds && item.categoryIds.length > 0
                                                        ? item.categoryIds
                                                              .map(
                                                                  (id) =>
                                                                      categories.find((c) => c.id === id)?.name ||
                                                                      'Unknown',
                                                              )
                                                              .join(', ')
                                                        : 'No category'}
                                                </div>
                                            </div>
                                            {!item.isActive && (
                                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded ml-2">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8"
                                                onClick={() => {
                                                    setFormData({
                                                        code: `${item.code}.`,
                                                        description: '',
                                                        type: item.type,
                                                    });
                                                    setFormError(null);
                                                    setIsCreateDialogOpen(true);
                                                }}
                                                title="Add Child Account"
                                            >
                                                <Plus className="h-4 w-4 mr-1" /> Child
                                            </Button>
                                            <div className="h-8 w-px bg-gray-200 mx-1"></div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleToggleActive(item)}
                                                title={item.isActive ? 'Deactivate' : 'Activate'}
                                            >
                                                {item.isActive ? '✓' : '○'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => openEditDialog(item)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Create Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                    setIsCreateDialogOpen(open);
                    if (!open) {
                        resetForm();
                    }
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Account</DialogTitle>
                            <DialogDescription>
                                Create a new management account (e.g., 01.01 Revenue)
                            </DialogDescription>
                        </DialogHeader>
                        
                        {/* Error Message */}
                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{formError}</span>
                            </div>
                        )}
                        
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Code (Sequencial) *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => {
                                        setFormData({ ...formData, code: e.target.value });
                                        if (formError) setFormError(null);
                                    }}
                                    placeholder="e.g., 01.01"
                                    className={formError && formError.includes('Code') ? 'border-red-500' : ''}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Start with 01 for Revenue, 02 for Expense. Use dots for hierarchy (e.g., 01.01, 01.02.01).
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData({ ...formData, description: e.target.value });
                                        if (formError) setFormError(null);
                                    }}
                                    placeholder="e.g., Operacional Revenue"
                                    className={formError && formError.includes('Description') ? 'border-red-500' : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Nature *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value as AccountType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AccountType.REVENUE}>Revenue (Receita)</SelectItem>
                                        <SelectItem value={AccountType.EXPENSE}>Expense (Despesa)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="category">Categories</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[0.7rem]"
                                        onClick={() => {
                                            setFormError(null);
                                            setNewCategory({ code: '', name: '', description: '' });
                                            setIsCreateCategoryOpen(true);
                                        }}
                                    >
                                        + New Category
                                    </Button>
                                </div>
                                <div className="border rounded-md p-2 max-h-40 overflow-auto space-y-1">
                                    {categories.map((cat) => {
                                        const checked =
                                            formData.categoryIds?.includes(cat.id) ??
                                            false;
                                        return (
                                            <label
                                                key={cat.id}
                                                className="flex items-center gap-2 text-sm cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        setFormData((prev) => {
                                                            const current = prev.categoryIds ?? [];
                                                            if (e.target.checked) {
                                                                return {
                                                                    ...prev,
                                                                    categoryIds: [...current, cat.id],
                                                                };
                                                            }
                                                            return {
                                                                ...prev,
                                                                categoryIds: current.filter(
                                                                    (id) => id !== cat.id,
                                                                ),
                                                            };
                                                        });
                                                        if (formError) setFormError(null);
                                                    }}
                                                />
                                                <span>
                                                    <span className="font-mono text-xs mr-1">
                                                        {cat.code}
                                                    </span>
                                                    {cat.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {categories.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            No categories yet. Click &quot;+ New Category&quot; to create one.
                                        </p>
                                    )}
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Select at least one category this account applies to.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsCreateDialogOpen(false);
                                resetForm();
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={!formData.code || !formData.description}>
                                Create Account
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                    setIsEditDialogOpen(open);
                    if (!open) {
                        setSelectedItem(null);
                        resetForm();
                    }
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Account</DialogTitle>
                            <DialogDescription>
                                Update account information
                            </DialogDescription>
                        </DialogHeader>
                        
                        {/* Error Message */}
                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{formError}</span>
                            </div>
                        )}
                        
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-code">Code *</Label>
                                <Input
                                    id="edit-code"
                                    value={formData.code}
                                    onChange={(e) => {
                                        setFormData({ ...formData, code: e.target.value });
                                        if (formError) setFormError(null);
                                    }}
                                    className={formError && formError.includes('Code') ? 'border-red-500' : ''}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Start with 01 for Revenue, 02 for Expense. Use dots for hierarchy (e.g., 01.01, 01.02.01).
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description *</Label>
                                <Input
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData({ ...formData, description: e.target.value });
                                        if (formError) setFormError(null);
                                    }}
                                    className={formError && formError.includes('Description') ? 'border-red-500' : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-type">Nature *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => setFormData({ ...formData, type: value as AccountType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={AccountType.REVENUE}>Revenue (Receita)</SelectItem>
                                        <SelectItem value={AccountType.EXPENSE}>Expense (Despesa)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="edit-category">Categories</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-2 text-[0.7rem]"
                                        onClick={() => {
                                            setFormError(null);
                                            setNewCategory({ code: '', name: '', description: '' });
                                            setIsCreateCategoryOpen(true);
                                        }}
                                    >
                                        + New Category
                                    </Button>
                                </div>
                                <div className="border rounded-md p-2 max-h-40 overflow-auto space-y-1">
                                    {categories.map((cat) => {
                                        const checked =
                                            formData.categoryIds?.includes(cat.id) ??
                                            false;
                                        return (
                                            <label
                                                key={cat.id}
                                                className="flex items-center gap-2 text-sm cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        setFormData((prev) => {
                                                            const current = prev.categoryIds ?? [];
                                                            if (e.target.checked) {
                                                                return {
                                                                    ...prev,
                                                                    categoryIds: [...current, cat.id],
                                                                };
                                                            }
                                                            return {
                                                                ...prev,
                                                                categoryIds: current.filter(
                                                                    (id) => id !== cat.id,
                                                                ),
                                                            };
                                                        });
                                                        if (formError) setFormError(null);
                                                    }}
                                                />
                                                <span>
                                                    <span className="font-mono text-xs mr-1">
                                                        {cat.code}
                                                    </span>
                                                    {cat.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {categories.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            No categories yet. Click &quot;+ New Category&quot; to create one.
                                        </p>
                                    )}
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Select at least one category this account applies to.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {
                                setIsEditDialogOpen(false);
                                setSelectedItem(null);
                                resetForm();
                            }}>
                                Cancel
                            </Button>
                            <Button onClick={handleEdit} disabled={!formData.code || !formData.description}>
                                Update Account
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Quick Create Cost Center Category Dialog */}
                <Dialog open={isCreateCategoryOpen} onOpenChange={(open) => {
                    setIsCreateCategoryOpen(open);
                    if (!open) {
                        setNewCategory({ code: '', name: '', description: '' });
                    }
                }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Cost Center Category</DialogTitle>
                            <DialogDescription>
                                Create a new category to organize your cost centers.
                            </DialogDescription>
                        </DialogHeader>
                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{formError}</span>
                            </div>
                        )}
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-category-code">Code *</Label>
                                <Input
                                    id="new-category-code"
                                    value={newCategory.code}
                                    onChange={(e) =>
                                        setNewCategory((prev) => ({ ...prev, code: e.target.value }))
                                    }
                                    placeholder="e.g., 01"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-category-name">Name *</Label>
                                <Input
                                    id="new-category-name"
                                    value={newCategory.name}
                                    onChange={(e) =>
                                        setNewCategory((prev) => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="e.g., Dairy"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-category-description">Description</Label>
                                <Input
                                    id="new-category-description"
                                    value={newCategory.description}
                                    onChange={(e) =>
                                        setNewCategory((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Optional description"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setIsCreateCategoryOpen(false);
                                    setNewCategory({ code: '', name: '', description: '' });
                                    setFormError(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleCreateCategory}>
                                Create Category
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
};
