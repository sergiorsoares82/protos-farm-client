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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Label } from '@/components/ui/label';
import { formatNumber } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, Plus, Pencil, Trash2, AlertCircle, Wrench } from 'lucide-react';
import { apiService, Item, ItemType, CreateItemRequest, UpdateItemRequest, UnitOfMeasure } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const Products = () => {
  const [activeTab, setActiveTab] = useState<ItemType>(ItemType.PRODUCT);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState<CreateItemRequest>({
    name: '',
    description: '',
    type: ItemType.PRODUCT,
    price: undefined,
    unit: '',
    sku: '',
    isStockControlled: false,
    initialStockDate: undefined,
    stockQuantity: undefined,
    minStockLevel: undefined,
    category: '',
  });

  // Load items
  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getItems(activeTab);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  // Load unit of measures for product form
  useEffect(() => {
    if (isCreateDialogOpen || isEditDialogOpen) {
      apiService
        .getUnitOfMeasures()
        .then(setUnitOfMeasures)
        .catch(() => setUnitOfMeasures([]));
    }
  }, [isCreateDialogOpen, isEditDialogOpen]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as ItemType);
    setFormData(prev => ({ ...prev, type: value as ItemType }));
  };

  // Validate form – returns general message + field-specific errors
  const validateForm = (): { formError: string | null; fieldErrors: Record<string, string> } => {
    const fieldErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      fieldErrors.name = 'Nome é obrigatório';
    }

    if (!formData.unit?.trim()) {
      fieldErrors.unit = 'Unidade de medida é obrigatória';
    }

    if (activeTab === ItemType.PRODUCT && formData.isStockControlled) {
      if (!formData.initialStockDate) {
        fieldErrors.initialStockDate = 'Data é obrigatória';
      }
      if (formData.stockQuantity === undefined || formData.stockQuantity === null) {
        fieldErrors.stockQuantity = 'Quantidade é obrigatória';
      }
      if (formData.price === undefined || formData.price === null) {
        fieldErrors.price = 'Preço é obrigatório';
      }
    }

    const formError = Object.keys(fieldErrors).length > 0 ? 'Corrija os campos indicados.' : null;
    return { formError, fieldErrors };
  };

  // Handle create
  const handleCreate = async () => {
    const { formError: ve, fieldErrors: fe } = validateForm();
    if (ve) {
      setFormError(ve);
      setFieldErrors(fe);
      return;
    }

    try {
      setFormError(null);
      setFieldErrors({});
      await apiService.createItem({ ...formData, type: activeTab });
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : `Falha ao criar ${activeTab === ItemType.PRODUCT ? 'produto' : 'serviço'}`;
      setFormError(message);
      setFieldErrors({});
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!selectedItem) return;

    const { formError: ve, fieldErrors: fe } = validateForm();
    if (ve) {
      setFormError(ve);
      setFieldErrors(fe);
      return;
    }

    try {
      setFormError(null);
      setFieldErrors({});
      const updates: UpdateItemRequest = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        unit: formData.unit || undefined,
        sku: formData.sku || undefined,
        isStockControlled: formData.isStockControlled,
        initialStockDate: formData.initialStockDate,
        stockQuantity: formData.stockQuantity,
        minStockLevel: formData.minStockLevel,
        category: formData.category || undefined,
      };
      await apiService.updateItem(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar item';
      setFormError(message);
      setFieldErrors({});
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      setError(null);
      await apiService.deleteItem(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  // Handle toggle active
  const handleToggleActive = async (item: Item) => {
    try {
      setError(null);
      await apiService.updateItem(item.id, { isActive: !item.isActive });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: activeTab,
      price: undefined,
      unit: '',
      sku: '',
      isStockControlled: false,
      initialStockDate: undefined,
      stockQuantity: undefined,
      minStockLevel: undefined,
      category: '',
    });
    setFormError(null);
    setFieldErrors({});
  };

  const clearFormErrors = () => {
    setFormError(null);
    setFieldErrors({});
  };

  // Open edit dialog
  const openEditDialog = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      type: item.type,
      price: item.price,
      unit: item.unit || '',
      sku: item.productDetails?.sku || '',
      isStockControlled: item.productDetails?.isStockControlled || false,
      initialStockDate: item.productDetails?.initialStockDate || undefined,
      stockQuantity: item.productDetails?.stockQuantity,
      minStockLevel: item.productDetails?.minStockLevel,
      category: item.productDetails?.category || '',
    });
    setIsEditDialogOpen(true);
  };

  // Format date for input
  const formatDateForInput = (date: string | undefined): string => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const isProduct = activeTab === ItemType.PRODUCT;
  const entityName = isProduct ? 'Product' : 'Service';

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Items & Inventory</h1>
            <p className="text-muted-foreground">Manage your farm products, services, and inventory</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add {entityName}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Tabs defaultValue={ItemType.PRODUCT} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value={ItemType.PRODUCT} className="flex gap-2">
              <Package className="h-4 w-4" /> Products
            </TabsTrigger>
            <TabsTrigger value={ItemType.SERVICE} className="flex gap-2">
              <Wrench className="h-4 w-4" /> Services
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="text-center py-8">Loading {isProduct ? 'products' : 'services'}...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                {isProduct ? <Package className="h-12 w-12 mx-auto mb-4 opacity-50" /> : <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />}
                <p>No {isProduct ? 'products' : 'services'} yet. Click "Add {entityName}" to create your first one.</p>
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
                  {item.description && (
                    <CardDescription>{item.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {item.price && (
                      <div>
                        <span className="font-semibold">Price:</span> {formatNumber(item.price)}
                        {item.unit && ` / ${item.unit}`}
                      </div>
                    )}
                    {isProduct && item.productDetails?.sku && (
                      <div>
                        <span className="font-semibold">SKU:</span> {item.productDetails.sku}
                      </div>
                    )}
                    {isProduct && item.productDetails?.isStockControlled && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Stock Controlled
                          </span>
                        </div>
                        {item.productDetails.initialStockDate && (
                          <div>
                            <span className="font-semibold">Stock Start:</span>{' '}
                            {new Date(item.productDetails.initialStockDate).toLocaleDateString()}
                          </div>
                        )}
                        {item.productDetails.stockQuantity !== undefined && (
                          <div>
                            <span className="font-semibold">Stock:</span> {item.productDetails.stockQuantity}
                          </div>
                        )}
                      </>
                    )}
                    {isProduct && item.productDetails?.category && (
                      <div>
                        <span className="font-semibold">Category:</span> {item.productDetails.category}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (open) clearFormErrors();
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New {entityName}</DialogTitle>
              <DialogDescription>
                Create a new {entityName.toLowerCase()}
              </DialogDescription>
            </DialogHeader>
            {formError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <div className="grid gap-4 py-4">
              <div className={`grid ${isProduct ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className={fieldErrors.name ? 'border-destructive' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive">{fieldErrors.name}</p>
                  )}
                </div>
                {isProduct && (
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Produto ou serviço"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade de medida *</Label>
                <Select
                  value={formData.unit || ''}
                  onValueChange={(value) => {
                    setFormData({ ...formData, unit: value });
                    if (fieldErrors.unit) setFieldErrors((prev) => ({ ...prev, unit: '' }));
                  }}
                >
                  <SelectTrigger id="unit" className={fieldErrors.unit ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOfMeasures.map((u) => (
                      <SelectItem key={u.id} value={u.code}>
                        {u.name} ({u.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.unit && (
                  <p className="text-xs text-destructive">{fieldErrors.unit}</p>
                )}
              </div>

              {/* Stock Control Section - Only for Products */}
              {isProduct && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isStockControlled"
                      checked={formData.isStockControlled}
                      onCheckedChange={(checked) => {
                        const isStockControlled = checked as boolean;
                        setFormData({
                          ...formData,
                          isStockControlled,
                          ...(isStockControlled ? {} : { price: undefined }),
                        });
                      }}
                    />
                    <Label htmlFor="isStockControlled" className="cursor-pointer">
                      Produto estocável (controle de estoque)
                    </Label>
                  </div>

                  {formData.isStockControlled && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Movimentação inicial</h4>
                        <p className="text-sm text-blue-800 mt-0.5">
                          Essa movimentação será salva na tabela de movimento de estoque (Entrada inicial).
                        </p>
                      </div>
                      <div className="grid gap-4 items-end" style={{ gridTemplateColumns: 'minmax(10rem, 1fr) 1fr 1fr 1fr' }}>
                        <div className="space-y-2">
                          <Label htmlFor="initialStockDate">Data *</Label>
                          <Input
                            id="initialStockDate"
                            type="date"
                            className={`w-full min-w-[10rem] ${fieldErrors.initialStockDate ? 'border-destructive' : ''}`}
                            value={formatDateForInput(formData.initialStockDate)}
                            onChange={(e) => {
                              setFormData({ ...formData, initialStockDate: e.target.value });
                              if (fieldErrors.initialStockDate) setFieldErrors((prev) => ({ ...prev, initialStockDate: '' }));
                            }}
                          />
                          {fieldErrors.initialStockDate && (
                            <p className="text-xs text-destructive">{fieldErrors.initialStockDate}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="stockQuantity">Quantidade *</Label>
                          <Input
                            id="stockQuantity"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.stockQuantity ?? ''}
                            className={fieldErrors.stockQuantity ? 'border-destructive' : ''}
                            onChange={(e) => {
                              setFormData({ ...formData, stockQuantity: e.target.value ? parseFloat(e.target.value) : undefined });
                              if (fieldErrors.stockQuantity) setFieldErrors((prev) => ({ ...prev, stockQuantity: '' }));
                            }}
                          />
                          {fieldErrors.stockQuantity && (
                            <p className="text-xs text-destructive">{fieldErrors.stockQuantity}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price">Preço *</Label>
                          <DecimalInput
                            id="price"
                            value={formData.price}
                            className={fieldErrors.price ? 'border-destructive' : ''}
                            onChange={(v) => {
                              setFormData({ ...formData, price: v });
                              if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
                            }}
                          />
                          {fieldErrors.price && (
                            <p className="text-xs text-destructive">{fieldErrors.price}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minStockLevel">Mín. no estoque</Label>
                          <DecimalInput
                            id="minStockLevel"
                            value={formData.minStockLevel ?? undefined}
                            onChange={(v) => setFormData({ ...formData, minStockLevel: v })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); setError(null); }}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name}>
                Create {entityName}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setSelectedItem(null);
            if (open) clearFormErrors();
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {entityName}</DialogTitle>
              <DialogDescription>
                Update {entityName.toLowerCase()} information
              </DialogDescription>
            </DialogHeader>
            {formError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <div className="grid gap-4 py-4">
              <div className={`grid ${isProduct ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className={fieldErrors.name ? 'border-destructive' : ''}
                  />
                  {fieldErrors.name && (
                    <p className="text-xs text-destructive">{fieldErrors.name}</p>
                  )}
                </div>
                {isProduct && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-sku">SKU</Label>
                    <Input
                      id="edit-sku"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Produto ou serviço"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit">Unidade de medida *</Label>
                <Select
                  value={formData.unit || ''}
                  onValueChange={(value) => {
                    setFormData({ ...formData, unit: value });
                    if (fieldErrors.unit) setFieldErrors((prev) => ({ ...prev, unit: '' }));
                  }}
                >
                  <SelectTrigger id="edit-unit" className={fieldErrors.unit ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOfMeasures.map((u) => (
                      <SelectItem key={u.id} value={u.code}>
                        {u.name} ({u.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.unit && (
                  <p className="text-xs text-destructive">{fieldErrors.unit}</p>
                )}
              </div>

              {/* Stock Control Section - Only for Products */}
              {isProduct && (
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-isStockControlled"
                      checked={formData.isStockControlled}
                      onCheckedChange={(checked) => {
                        const isStockControlled = checked as boolean;
                        setFormData({
                          ...formData,
                          isStockControlled,
                          ...(isStockControlled ? {} : { price: undefined }),
                        });
                      }}
                    />
                    <Label htmlFor="edit-isStockControlled" className="cursor-pointer">
                      Produto estocável (controle de estoque)
                    </Label>
                  </div>

                  {formData.isStockControlled && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Movimentação inicial</h4>
                        <p className="text-sm text-blue-800 mt-0.5">
                          Essa movimentação será salva na tabela de movimento de estoque (Entrada inicial).
                        </p>
                      </div>
                      <div className="grid gap-4 items-end" style={{ gridTemplateColumns: 'minmax(10rem, 1fr) 1fr 1fr 1fr' }}>
                        <div className="space-y-2">
                          <Label htmlFor="edit-initialStockDate">Data *</Label>
                          <Input
                            id="edit-initialStockDate"
                            type="date"
                            className={`w-full min-w-[10rem] ${fieldErrors.initialStockDate ? 'border-destructive' : ''}`}
                            value={formatDateForInput(formData.initialStockDate)}
                            onChange={(e) => {
                              setFormData({ ...formData, initialStockDate: e.target.value });
                              if (fieldErrors.initialStockDate) setFieldErrors((prev) => ({ ...prev, initialStockDate: '' }));
                            }}
                          />
                          {fieldErrors.initialStockDate && (
                            <p className="text-xs text-destructive">{fieldErrors.initialStockDate}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-stockQuantity">Quantidade *</Label>
                          <Input
                            id="edit-stockQuantity"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.stockQuantity ?? ''}
                            className={fieldErrors.stockQuantity ? 'border-destructive' : ''}
                            onChange={(e) => {
                              setFormData({ ...formData, stockQuantity: e.target.value ? parseFloat(e.target.value) : undefined });
                              if (fieldErrors.stockQuantity) setFieldErrors((prev) => ({ ...prev, stockQuantity: '' }));
                            }}
                          />
                          {fieldErrors.stockQuantity && (
                            <p className="text-xs text-destructive">{fieldErrors.stockQuantity}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-price">Preço *</Label>
                          <DecimalInput
                            id="edit-price"
                            value={formData.price}
                            className={fieldErrors.price ? 'border-destructive' : ''}
                            onChange={(v) => {
                              setFormData({ ...formData, price: v });
                              if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
                            }}
                          />
                          {fieldErrors.price && (
                            <p className="text-xs text-destructive">{fieldErrors.price}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-minStockLevel">Mín. no estoque</Label>
                          <DecimalInput
                            id="edit-minStockLevel"
                            value={formData.minStockLevel ?? undefined}
                            onChange={(v) => setFormData({ ...formData, minStockLevel: v })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedItem(null); resetForm(); setError(null); }}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={!formData.name}>
                Update {entityName}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
