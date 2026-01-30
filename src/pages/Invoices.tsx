import { useEffect, useState } from 'react';
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
import { FileText, Plus, Pencil, Trash2, AlertCircle, DollarSign, Package } from 'lucide-react';
import {
  apiService,
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceItemDTO,
  InvoiceFinancialDTO,
  ItemType,
  Item,
  Supplier,
} from '@/services/api';

const defaultForm: CreateInvoiceRequest = {
  number: '',
  series: '',
  issueDate: new Date().toISOString().slice(0, 10),
  supplierId: '',
  documentTypeId: '',
  notes: '',
  items: [],
  financials: [],
};

export const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [formData, setFormData] = useState<CreateInvoiceRequest>({ ...defaultForm });

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getInvoices();
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar notas fiscais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const [suppliersRes, itemsRes] = await Promise.all([
          apiService.getSuppliers(),
          apiService.getItems(undefined, true),
        ]);
        setSuppliers(suppliersRes);
        setItems(itemsRes);
      } catch (err) {
        console.error('Failed to load lookups', err);
      }
    };
    init();
  }, []);

  const validateForm = (): string | null => {
    if (!formData.number?.trim()) return 'Número da nota é obrigatório';
    if (!formData.issueDate) return 'Data de emissão é obrigatória';
    if (!formData.supplierId) return 'Fornecedor é obrigatório';
    if (!formData.items?.length) return 'Adicione pelo menos um item (produto ou serviço)';
    for (let i = 0; i < formData.items.length; i++) {
      const line = formData.items[i];
      if (!line.itemId) return `Item ${i + 1}: selecione produto/serviço`;
      if (line.quantity <= 0) return `Item ${i + 1}: quantidade deve ser maior que zero`;
      if (!line.unit?.trim()) return `Item ${i + 1}: unidade é obrigatória`;
      if (line.unitPrice < 0) return `Item ${i + 1}: preço unitário inválido`;
    }
    if (!formData.financials?.length) return 'Adicione pelo menos uma parcela financeira (vencimento)';
    for (let i = 0; i < formData.financials.length; i++) {
      const fin = formData.financials[i];
      if (!fin.dueDate) return `Parcela ${i + 1}: data de vencimento é obrigatória`;
      if (fin.amount < 0) return `Parcela ${i + 1}: valor deve ser não negativo`;
    }
    return null;
  };

  const resetForm = () => {
    setFormData({
      ...defaultForm,
      issueDate: new Date().toISOString().slice(0, 10),
      items: [],
      financials: [],
    });
  };

  const addItemLine = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items ?? []),
        {
          itemId: '',
          itemType: ItemType.PRODUCT,
          quantity: 1,
          unit: '',
          unitPrice: 0,
          lineOrder: prev.items?.length ?? 0,
        },
      ],
    }));
  };

  const updateItemLine = (index: number, field: keyof InvoiceItemDTO, value: string | number) => {
    setFormData((prev) => {
      const lines = [...(prev.items ?? [])];
      if (!lines[index]) return prev;
      lines[index] = { ...lines[index], [field]: value };
      if (field === 'itemId' && typeof value === 'string') {
        const product = items.find((p) => p.id === value);
        if (product) {
          lines[index].unit = product.unit ?? lines[index].unit;
          lines[index].unitPrice = product.price ?? 0;
          lines[index].itemType = product.type as ItemType;
        }
      }
      return { ...prev, items: lines };
    });
  };

  const removeItemLine = (index: number) => {
    setFormData((prev) => {
      const items = (prev.items ?? [])
        .filter((_, i) => i !== index)
        .map((it, i) => ({ ...it, lineOrder: i }));
      return { ...prev, items };
    });
  };

  const addFinancialLine = () => {
    setFormData((prev) => ({
      ...prev,
      financials: [
        ...(prev.financials ?? []),
        { dueDate: new Date().toISOString().slice(0, 10), amount: 0 },
      ],
    }));
  };

  const updateFinancialLine = (
    index: number,
    field: keyof InvoiceFinancialDTO,
    value: string | number
  ) => {
    setFormData((prev) => {
      const financials = [...(prev.financials ?? [])];
      if (!financials[index]) return prev;
      financials[index] = { ...financials[index], [field]: value };
      return { ...prev, financials };
    });
  };

  const removeFinancialLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      financials: (prev.financials ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      const payload: CreateInvoiceRequest = {
        number: formData.number.trim(),
        series: formData.series?.trim() || undefined,
        issueDate: formData.issueDate,
        supplierId: formData.supplierId,
        documentTypeId: formData.documentTypeId?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        items: formData.items!.map((it, i) => ({
          itemId: it.itemId,
          itemType: it.itemType,
          quantity: it.quantity,
          unit: it.unit.trim(),
          unitPrice: it.unitPrice,
          lineOrder: i,
          description: it.description?.trim() || undefined,
        })),
        financials: formData.financials!.map((f) => ({
          dueDate: f.dueDate,
          amount: f.amount,
          paidAt: f.paidAt || undefined,
        })),
      };
      await apiService.createInvoice(payload);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar nota fiscal');
    }
  };

  const handleEdit = async () => {
    if (!selectedInvoice) return;
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      setError(null);
      const payload: UpdateInvoiceRequest = {
        number: formData.number.trim(),
        series: formData.series?.trim() || undefined,
        issueDate: formData.issueDate,
        supplierId: formData.supplierId,
        documentTypeId: formData.documentTypeId?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        items: formData.items!.map((it, i) => ({
          itemId: it.itemId,
          itemType: it.itemType,
          quantity: it.quantity,
          unit: it.unit.trim(),
          unitPrice: it.unitPrice,
          lineOrder: i,
          description: it.description?.trim() || undefined,
        })),
        financials: formData.financials!.map((f) => ({
          dueDate: f.dueDate,
          amount: f.amount,
          paidAt: f.paidAt || undefined,
        })),
      };
      await apiService.updateInvoice(selectedInvoice.id, payload);
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      resetForm();
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar nota fiscal');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta nota fiscal?')) return;
    try {
      setError(null);
      await apiService.deleteInvoice(id);
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir nota fiscal');
    }
  };

  const handleMarkFinancialPaid = async (invoiceId: string, financialId: string) => {
    try {
      setError(null);
      const updated = await apiService.markInvoiceFinancialAsPaid(invoiceId, financialId);
      await loadInvoices();
      if (detailInvoice?.id === invoiceId) {
        setDetailInvoice(updated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao marcar parcela como paga');
    }
  };

  const openEditDialog = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setFormData({
      number: inv.number,
      series: inv.series ?? '',
      issueDate: inv.issueDate.slice(0, 10),
      supplierId: inv.supplierId,
      documentTypeId: inv.documentTypeId ?? '',
      notes: inv.notes ?? '',
      items: inv.items.map((it, i) => ({
        itemId: it.itemId,
        itemType: it.itemType as ItemType,
        quantity: it.quantity,
        unit: it.unit,
        unitPrice: it.unitPrice,
        lineOrder: i,
        description: it.description,
      })),
      financials: inv.financials.map((f) => ({
        dueDate: f.dueDate.slice(0, 10),
        amount: f.amount,
        paidAt: f.paidAt?.slice(0, 10),
      })),
    });
    setIsEditDialogOpen(true);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const s = iso.slice(0, 10);
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  };

  const getSupplierName = (supplierId: string) =>
    suppliers.find((s) => s.id === supplierId)?.companyName ?? supplierId;
  const getItemName = (itemId: string) => items.find((i) => i.id === itemId)?.name ?? itemId;

  const onItemSelect = (index: number, itemId: string) => {
    const product = items.find((p) => p.id === itemId);
    if (product) {
      updateItemLine(index, 'itemId', itemId);
      updateItemLine(index, 'unit', product.unit ?? '');
      updateItemLine(index, 'unitPrice', product.price ?? 0);
      updateItemLine(index, 'itemType', product.type as ItemType);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Notas Fiscais</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie notas fiscais com itens (produto/serviço) e parcelas financeiras
              (vencimentos).
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova nota fiscal
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando notas fiscais...</div>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma nota fiscal. Clique em &quot;Nova nota fiscal&quot; para criar.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Número</th>
                      <th className="px-4 py-3 font-medium">Série</th>
                      <th className="px-4 py-3 font-medium">Emissão</th>
                      <th className="px-4 py-3 font-medium">Fornecedor</th>
                      <th className="px-4 py-3 font-medium">Itens</th>
                      <th className="px-4 py-3 font-medium">Total itens</th>
                      <th className="px-4 py-3 font-medium">Parcelas</th>
                      <th className="px-4 py-3 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-t">
                        <td className="px-4 py-3 font-medium">{inv.number}</td>
                        <td className="px-4 py-3">{inv.series ?? '—'}</td>
                        <td className="px-4 py-3">{formatDate(inv.issueDate)}</td>
                        <td className="px-4 py-3">{getSupplierName(inv.supplierId)}</td>
                        <td className="px-4 py-3">{inv.items?.length ?? 0}</td>
                        <td className="px-4 py-3">
                          {inv.itemsTotal != null
                            ? `R$ ${Number(inv.itemsTotal).toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3">{inv.financials?.length ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setDetailInvoice(inv)}
                              title="Detalhes"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(inv)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(inv.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova nota fiscal</DialogTitle>
              <DialogDescription>
                Preencha o cabeçalho, adicione itens (produto ou serviço) e parcelas financeiras
                (vencimentos).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    placeholder="ex: 000123"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Série</Label>
                  <Input
                    value={formData.series ?? ''}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                    placeholder="ex: 1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de emissão *</Label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} {s.person ? `(${s.person.fullName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={formData.notes ?? ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" /> Itens (produto ou serviço)
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItemLine}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar item
                  </Button>
                </div>
                {(formData.items?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum item. Adicione pelo menos um.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(formData.items ?? []).map((line, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-end border rounded p-2 bg-muted/30"
                      >
                        <div className="col-span-4">
                          <Label className="text-xs">Produto/Serviço</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                            value={line.itemId}
                            onChange={(e) => onItemSelect(index, e.target.value)}
                          >
                            <option value="">Selecione...</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.name} ({i.type})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs">Qtd</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={line.quantity}
                            onChange={(e) =>
                              updateItemLine(index, 'quantity', parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <Label className="text-xs">Unidade</Label>
                          <Input
                            value={line.unit}
                            onChange={(e) => updateItemLine(index, 'unit', e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Preço unit.</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={(e) =>
                              updateItemLine(index, 'unitPrice', parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Total</Label>
                          <p className="text-sm font-medium">
                            R$ {(line.quantity * line.unitPrice).toFixed(2)}
                          </p>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => removeItemLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Parcelas financeiras (vencimentos)
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFinancialLine}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar parcela
                  </Button>
                </div>
                {(formData.financials?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma parcela. Adicione pelo menos uma (data de vencimento e valor).
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {(formData.financials ?? []).map((fin, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-end border rounded p-2 bg-muted/30"
                      >
                        <div className="col-span-4">
                          <Label className="text-xs">Data vencimento</Label>
                          <Input
                            type="date"
                            value={fin.dueDate}
                            onChange={(e) =>
                              updateFinancialLine(index, 'dueDate', e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-4">
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fin.amount}
                            onChange={(e) =>
                              updateFinancialLine(index, 'amount', parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="col-span-3" />
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            onClick={() => removeFinancialLine(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar nota fiscal</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar nota fiscal</DialogTitle>
              <DialogDescription>
                Altere o cabeçalho, itens e parcelas conforme necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número *</Label>
                  <Input
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Série</Label>
                  <Input
                    value={formData.series ?? ''}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de emissão *</Label>
                  <Input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input
                  value={formData.notes ?? ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Itens</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItemLine}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar item
                  </Button>
                </div>
                {(formData.items ?? []).map((line, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end border rounded p-2 bg-muted/30 mb-2"
                  >
                    <div className="col-span-4">
                      <Label className="text-xs">Produto/Serviço</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                        value={line.itemId}
                        onChange={(e) => onItemSelect(index, e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {items.map((i) => (
                          <option key={i.id} value={i.id}>
                            {i.name} ({i.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Qtd</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={line.quantity}
                        onChange={(e) =>
                          updateItemLine(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs">Unidade</Label>
                      <Input
                        value={line.unit}
                        onChange={(e) => updateItemLine(index, 'unit', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Preço unit.</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitPrice}
                        onChange={(e) =>
                          updateItemLine(index, 'unitPrice', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Total</Label>
                      <p className="text-sm font-medium">
                        R$ {(line.quantity * line.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => removeItemLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Parcelas financeiras</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFinancialLine}>
                    <Plus className="h-4 w-4 mr-1" /> Adicionar parcela
                  </Button>
                </div>
                {(formData.financials ?? []).map((fin, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-end border rounded p-2 bg-muted/30 mb-2"
                  >
                    <div className="col-span-4">
                      <Label className="text-xs">Data vencimento</Label>
                      <Input
                        type="date"
                        value={fin.dueDate}
                        onChange={(e) =>
                          updateFinancialLine(index, 'dueDate', e.target.value)
                        }
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">Valor (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={fin.amount}
                        onChange={(e) =>
                          updateFinancialLine(index, 'amount', parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="col-span-3" />
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => removeFinancialLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit}>Salvar alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog: items, financials, mark as paid */}
        <Dialog open={!!detailInvoice} onOpenChange={(open) => !open && setDetailInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Nota fiscal {detailInvoice?.number}
                {detailInvoice?.series ? ` - Série ${detailInvoice.series}` : ''}
              </DialogTitle>
              <DialogDescription>
                Emissão: {detailInvoice && formatDate(detailInvoice.issueDate)} • Fornecedor:{' '}
                {detailInvoice && getSupplierName(detailInvoice.supplierId)}
              </DialogDescription>
            </DialogHeader>
            {detailInvoice && (
              <div className="space-y-4 py-4">
                <div>
                  <Label className="text-sm font-medium">Itens</Label>
                  <div className="mt-2 border rounded divide-y text-sm">
                    {detailInvoice.items?.length ? (
                      detailInvoice.items.map((line) => (
                        <div
                          key={line.id}
                          className="flex justify-between px-3 py-2"
                        >
                          <span>{getItemName(line.itemId)}</span>
                          <span>
                            {line.quantity} {line.unit} × R$ {Number(line.unitPrice).toFixed(2)} = R${' '}
                            {(line.totalPrice ?? line.quantity * line.unitPrice).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-muted-foreground">Nenhum item</p>
                    )}
                  </div>
                  {detailInvoice.itemsTotal != null && (
                    <p className="text-right font-medium mt-2">
                      Total itens: R$ {Number(detailInvoice.itemsTotal).toFixed(2)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium">Parcelas financeiras (vencimentos)</Label>
                  <div className="mt-2 border rounded divide-y text-sm">
                    {detailInvoice.financials?.length ? (
                      detailInvoice.financials.map((fin) => (
                        <div
                          key={fin.id}
                          className="flex justify-between items-center px-3 py-2"
                        >
                          <span>
                            Vencimento: {formatDate(fin.dueDate)} • R$ {Number(fin.amount).toFixed(2)}{' '}
                            {fin.status === 'PAID' ? (
                              <span className="text-green-600">(Pago)</span>
                            ) : (
                              <span className="text-amber-600">({fin.status})</span>
                            )}
                          </span>
                          {fin.status !== 'PAID' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkFinancialPaid(detailInvoice.id, fin.id)}
                            >
                              Marcar como paga
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="px-3 py-2 text-muted-foreground">Nenhuma parcela</p>
                    )}
                  </div>
                  {detailInvoice.financialsTotal != null && (
                    <p className="text-right font-medium mt-2">
                      Total parcelas: R$ {Number(detailInvoice.financialsTotal).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
};
