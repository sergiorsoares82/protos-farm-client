import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
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
import { Settings2, Plus, Pencil, Trash2, AlertCircle, Activity } from 'lucide-react';
import {
    apiService,
    Operation,
    CreateOperationRequest,
    UpdateOperationRequest,
    ActivityType,
} from '@/services/api';

export const Operations = () => {
    const [items, setItems] = useState<Operation[]>([]);
    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Operation | null>(null);

    const [formData, setFormData] = useState<CreateOperationRequest>({
        code: '',
        description: '',
        activityTypeIds: [],
    });
    const [formError, setFormError] = useState<string | null>(null);

    const loadItems = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getOperations();
            setItems(data);
        } catch (err) {
            console.error('Failed to load operations', err);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await loadItems();
            try {
                const types = await apiService.getActivityTypes();
                setActivityTypes(types.filter((t) => t.isActive));
            } catch (err) {
                console.error('Failed to load activity types', err);
            }
        };
        init();
    }, []);

    const validateForm = (): string | null => {
        if (!formData.code.trim()) return 'Código é obrigatório';
        if (!/^\d+(\.\d+)*$/.test(formData.code)) {
            return 'Código inválido. Use números separados por ponto (ex.: 1, 1.1, 1.2.01).';
        }
        if (!formData.description.trim()) return 'Descrição é obrigatória';
        if (!formData.activityTypeIds?.length) {
            return 'Selecione ao menos um tipo de atividade.';
        }
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
            await apiService.createOperation({
                ...formData,
                activityTypeIds: formData.activityTypeIds ?? [],
            });
            setIsCreateDialogOpen(false);
            resetForm();
            await loadItems();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Falha ao criar operação');
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
            const updates: UpdateOperationRequest = {
                code: formData.code,
                description: formData.description,
                activityTypeIds: formData.activityTypeIds,
            };
            await apiService.updateOperation(selectedItem.id, updates);
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForm();
            await loadItems();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Falha ao atualizar operação');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta operação?')) return;
        try {
            setError(null);
            await apiService.deleteOperation(id);
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao excluir operação');
        }
    };

    const handleToggleActive = async (item: Operation) => {
        try {
            setError(null);
            await apiService.updateOperation(item.id, { isActive: !item.isActive });
            await loadItems();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Falha ao atualizar status');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            description: '',
            activityTypeIds: [],
        });
        setFormError(null);
    };

    const openEditDialog = (item: Operation) => {
        setSelectedItem(item);
        setFormData({
            code: item.code,
            description: item.description,
            activityTypeIds: item.activityTypeIds ?? [],
        });
        setFormError(null);
        setIsEditDialogOpen(true);
    };

    return (
        <Layout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Operações</h1>
                        <p className="text-muted-foreground">
                            Cadastro de operações com código, hierarquia e vínculo a tipos de atividade
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            resetForm();
                            setIsCreateDialogOpen(true);
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Nova operação
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">Carregando operações...</div>
                ) : items.length === 0 ? (
                    <Card>
                        <CardContent className="py-8">
                            <div className="text-center text-muted-foreground">
                                <Settings2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Nenhuma operação cadastrada.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => {
                            const level = item.code.split('.').length - 1;
                            const paddingLeft = `${level * 2}rem`;
                            return (
                                <Card
                                    key={item.id}
                                    className={!item.isActive ? 'opacity-60' : ''}
                                    style={{ marginLeft: paddingLeft }}
                                >
                                    <CardContent className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-sm font-semibold text-gray-700 w-24 text-center">
                                                {item.code}
                                            </span>
                                            <div className="flex flex-col">
                                                <div className="font-medium">{item.description}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Activity className="h-3 w-3" />
                                                    {item.activityTypeIds?.length
                                                        ? item.activityTypeIds
                                                              .map(
                                                                  (id) =>
                                                                      activityTypes.find((t) => t.id === id)?.name ??
                                                                      '—',
                                                              )
                                                              .join(', ')
                                                        : 'Nenhum tipo'}
                                                </div>
                                            </div>
                                            {!item.isActive && (
                                                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded ml-2">
                                                    Inativa
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
                                                        activityTypeIds: item.activityTypeIds ?? [],
                                                    });
                                                    setFormError(null);
                                                    setIsCreateDialogOpen(true);
                                                }}
                                                title="Adicionar operação filha"
                                            >
                                                <Plus className="h-4 w-4 mr-1" /> Filha
                                            </Button>
                                            <div className="h-8 w-px bg-gray-200 mx-1" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                                onClick={() => handleToggleActive(item)}
                                                title={item.isActive ? 'Desativar' : 'Ativar'}
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
                <Dialog
                    open={isCreateDialogOpen}
                    onOpenChange={(open) => {
                        setIsCreateDialogOpen(open);
                        if (!open) resetForm();
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova operação</DialogTitle>
                            <DialogDescription>
                                Crie uma operação com código hierárquico (ex.: 1, 1.1, 1.2.01) e vincule a tipos de
                                atividade.
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
                                <Label htmlFor="code">Código *</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => {
                                        setFormData({ ...formData, code: e.target.value });
                                        if (formError) setFormError(null);
                                    }}
                                    placeholder="ex.: 1 ou 1.1 ou 1.2.01"
                                    className={formError && formError.includes('Código') ? 'border-red-500' : ''}
                                />
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Use números separados por ponto para hierarquia (ex.: 1, 1.1, 1.2.01). A operação pai
                                    deve já existir.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Descrição *</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData({ ...formData, description: e.target.value });
                                        if (formError) setFormError(null);
                                    }}
                                    placeholder="ex.: Plantio direto"
                                    className={formError && formError.includes('Descrição') ? 'border-red-500' : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipos de atividade *</Label>
                                <div className="border rounded-md p-2 max-h-40 overflow-auto space-y-1">
                                    {activityTypes.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">
                                            Nenhum tipo de atividade ativo. Cadastre em Tipos de Atividade.
                                        </p>
                                    ) : (
                                        activityTypes.map((type) => {
                                            const checked = formData.activityTypeIds?.includes(type.id) ?? false;
                                            return (
                                                <label
                                                    key={type.id}
                                                    className="flex items-center gap-2 text-sm cursor-pointer"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            setFormData((prev) => {
                                                                const current = prev.activityTypeIds ?? [];
                                                                if (e.target.checked) {
                                                                    return {
                                                                        ...prev,
                                                                        activityTypeIds: [...current, type.id],
                                                                    };
                                                                }
                                                                return {
                                                                    ...prev,
                                                                    activityTypeIds: current.filter((id) => id !== type.id),
                                                                };
                                                            });
                                                            if (formError) setFormError(null);
                                                        }}
                                                    />
                                                    <span>{type.name}</span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Selecione ao menos um tipo de atividade ao qual esta operação se aplica.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
                                Cancelar
                            </Button>
                            <Button onClick={handleCreate} disabled={!formData.code || !formData.description}>
                                Criar operação
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) { setSelectedItem(null); resetForm(); }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar operação</DialogTitle>
                            <DialogDescription>Altere código, descrição ou tipos de atividade.</DialogDescription>
                        </DialogHeader>
                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{formError}</span>
                            </div>
                        )}
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-code">Código *</Label>
                                <Input
                                    id="edit-code"
                                    value={formData.code}
                                    onChange={(e) => {
                                        setFormData({ ...formData, code: e.target.value });
                                        if (formError) setFormError(null);
                                    }}
                                    className={formError && formError.includes('Código') ? 'border-red-500' : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Descrição *</Label>
                                <Input
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => {
                                        setFormData({ ...formData, description: e.target.value });
                                        if (formError) setFormError(null);
                                    }}
                                    className={formError && formError.includes('Descrição') ? 'border-red-500' : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipos de atividade *</Label>
                                <div className="border rounded-md p-2 max-h-40 overflow-auto space-y-1">
                                    {activityTypes.map((type) => {
                                        const checked = formData.activityTypeIds?.includes(type.id) ?? false;
                                        return (
                                            <label key={type.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4"
                                                    checked={checked}
                                                    onChange={(e) => {
                                                        setFormData((prev) => {
                                                            const current = prev.activityTypeIds ?? [];
                                                            if (e.target.checked) {
                                                                return {
                                                                    ...prev,
                                                                    activityTypeIds: [...current, type.id],
                                                                };
                                                            }
                                                            return {
                                                                ...prev,
                                                                activityTypeIds: current.filter((id) => id !== type.id),
                                                            };
                                                        });
                                                        if (formError) setFormError(null);
                                                    }}
                                                />
                                                <span>{type.name}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedItem(null); resetForm(); }}>
                                Cancelar
                            </Button>
                            <Button onClick={handleEdit} disabled={!formData.code || !formData.description}>
                                Salvar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
};
