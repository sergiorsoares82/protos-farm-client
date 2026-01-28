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
import { AlertCircle, CalendarRange, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  apiService,
  Season,
  CreateSeasonRequest,
  UpdateSeasonRequest,
  Field,
  SeasonFieldLink,
} from '@/services/api';

export const Seasons = () => {
  const [items, setItems] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Season | null>(null);

  const [allFields, setAllFields] = useState<Field[]>([]);
  const [showFieldsDialog, setShowFieldsDialog] = useState(false);
  const [fieldsDialogSeason, setFieldsDialogSeason] = useState<Season | null>(null);
  const [fieldsDialogLinks, setFieldsDialogLinks] = useState<SeasonFieldLink[]>([]);
  const [fieldsDialogOriginalLinks, setFieldsDialogOriginalLinks] = useState<SeasonFieldLink[]>([]);

  const [formData, setFormData] = useState<CreateSeasonRequest>({
    name: '',
    startDate: '',
    endDate: '',
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getSeasons();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load seasons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadItems();
      try {
        const fields = await apiService.getFields();
        setAllFields(fields);
      } catch (err) {
        console.error('Failed to load fields for seasons page', err);
      }
    };
    init();
  }, []);

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.startDate) return 'Start date is required';
    if (!formData.endDate) return 'End date is required';
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'Invalid dates';
    }
    if (start.getTime() > end.getTime()) {
      return 'Start date must be before or equal to end date';
    }
    return null;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      await apiService.createSeason(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create season');
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
      const updates: UpdateSeasonRequest = {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };
      await apiService.updateSeason(selectedItem.id, updates);
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update season');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this season?')) return;
    try {
      setError(null);
      await apiService.deleteSeason(id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete season');
    }
  };

  const handleToggleActive = async (item: Season) => {
    try {
      setError(null);
      await apiService.updateSeason(item.id, { isActive: !item.isActive });
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const openEditDialog = (item: Season) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      startDate: item.startDate.slice(0, 10),
      endDate: item.endDate.slice(0, 10),
    });
    setIsEditDialogOpen(true);
  };

  const openFieldsDialog = async (season: Season) => {
    try {
      setError(null);
      const links = await apiService.getSeasonFieldLinks(season.id);
      setFieldsDialogSeason(season);
      setFieldsDialogLinks(links);
      setFieldsDialogOriginalLinks(links);
      setShowFieldsDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load season fields');
    }
  };

  const isFieldSelected = (fieldId: string) =>
    fieldsDialogLinks.some((l) => l.fieldId === fieldId);

  const getFieldAreaForDialog = (field: Field): number => {
    const link = fieldsDialogLinks.find((l) => l.fieldId === field.id);
    if (link) return link.areaHectares;
    return Number(field.areaHectares);
  };

  const toggleFieldSelection = (field: Field, checked: boolean) => {
    setFieldsDialogLinks((prev) => {
      if (checked) {
        if (prev.some((l) => l.fieldId === field.id)) return prev;
        return [...prev, { fieldId: field.id, areaHectares: Number(field.areaHectares) }];
      }
      return prev.filter((l) => l.fieldId !== field.id);
    });
  };

  const updateFieldAreaInDialog = (fieldId: string, area: number) => {
    setFieldsDialogLinks((prev) =>
      prev.map((l) => (l.fieldId === fieldId ? { ...l, areaHectares: area } : l)),
    );
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString();
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Seasons (Safras)</h1>
            <p className="text-muted-foreground">
              Manage your crop seasons (safras) with start and end dates.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Season
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading seasons...</div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <CalendarRange className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No seasons yet. Click &quot;Add Season&quot; to create your first one.</p>
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
                        onClick={() => openFieldsDialog(item)}
                      >
                        Fields
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
                  <CardDescription>
                    {formatDate(item.startDate)} – {formatDate(item.endDate)}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Season</DialogTitle>
              <DialogDescription>
                Register a new crop season with start and end dates.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Safra 2025/2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date *</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date *</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
              <Button onClick={handleCreate}>Create Season</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Season</DialogTitle>
              <DialogDescription>Update season information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date *</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">End Date *</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
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
              <Button onClick={handleEdit}>Update Season</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Fields to Season Dialog */}
        <Dialog open={showFieldsDialog} onOpenChange={setShowFieldsDialog}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Fields for Season</DialogTitle>
              <DialogDescription>
                Select which fields belong to this season and adjust the area used.
              </DialogDescription>
            </DialogHeader>
            {fieldsDialogSeason && (
              <div className="space-y-4 py-2">
                <p className="text-sm">
                  <span className="font-semibold">{fieldsDialogSeason.name}</span> (
                  {formatDate(fieldsDialogSeason.startDate)} –{' '}
                  {formatDate(fieldsDialogSeason.endDate)})
                </p>
                <div className="border rounded-md max-h-72 overflow-auto">
                  {allFields.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">
                      No fields available. Create fields first.
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Use</th>
                          <th className="px-3 py-2 text-left">Field</th>
                          <th className="px-3 py-2 text-left">Area (ha)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allFields.map((field) => {
                          const selected = isFieldSelected(field.id);
                          const areaValue = selected
                            ? getFieldAreaForDialog(field)
                            : Number(field.areaHectares);
                          return (
                            <tr key={field.id} className="border-t">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4"
                                  checked={selected}
                                  onChange={(e) => toggleFieldSelection(field, e.target.checked)}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="flex flex-col">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {field.code}
                                  </span>
                                  <span>{field.name}</span>
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={areaValue}
                                  onChange={(e) =>
                                    updateFieldAreaInDialog(field.id, Number(e.target.value))
                                  }
                                  disabled={!selected}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  When you select a field, the default area is the field&apos;s area, but you can
                  adjust it for this season.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowFieldsDialog(false);
                  setFieldsDialogSeason(null);
                  setFieldsDialogLinks([]);
                  setFieldsDialogOriginalLinks([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!fieldsDialogSeason) return;
                  try {
                    setError(null);
                    const seasonId = fieldsDialogSeason.id;
                    const original = fieldsDialogOriginalLinks;
                    const current = fieldsDialogLinks;

                    const toDelete = original.filter(
                      (o) => !current.some((c) => c.fieldId === o.fieldId),
                    );
                    const toUpsert = current;

                    await Promise.all([
                      ...toDelete.map((link) =>
                        apiService.deleteSeasonFieldLink(seasonId, link.fieldId),
                      ),
                      ...toUpsert.map((link) =>
                        apiService.upsertSeasonFieldLink(
                          seasonId,
                          link.fieldId,
                          link.areaHectares,
                        ),
                      ),
                    ]);

                    setShowFieldsDialog(false);
                    setFieldsDialogSeason(null);
                    setFieldsDialogLinks([]);
                    setFieldsDialogOriginalLinks([]);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'Failed to update fields for this season',
                    );
                  }
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

