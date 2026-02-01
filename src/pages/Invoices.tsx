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
import { Autocomplete } from '@/components/ui/autocomplete';
import { AutocompleteWithCreate } from '@/components/ui/autocomplete-with-create';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Pencil, Trash2, AlertCircle, DollarSign, Package, UserPlus } from 'lucide-react';
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
  InvoiceType,
  DocumentType,
  CreatePersonRequest,
  PersonType,
  PersonRole,
  CreateItemRequest,
} from '@/services/api';

const defaultForm: CreateInvoiceRequest = {
  number: '',
  series: '',
  issueDate: new Date().toISOString().slice(0, 10),
  supplierId: '',
  documentTypeId: '',
  notes: '',
  type: InvoiceType.DESPESA,
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
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  const [formData, setFormData] = useState<CreateInvoiceRequest>({ ...defaultForm });
  
  // Modal de novo fornecedor
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    nome: '',
    personType: 'FISICA' as 'FISICA' | 'JURIDICA',
    cpfCnpj: '',
    email: '',
    phone: '',
    supplyCategories: '',
  });
  const [supplierFormError, setSupplierFormError] = useState<string | null>(null);
  
  // Modal de novo item (produto/serviço)
  const [showItemModal, setShowItemModal] = useState(false);
  const [itemFormSearchTerm, setItemFormSearchTerm] = useState('');
  const [itemFormIndex, setItemFormIndex] = useState<number | null>(null);
  const [itemForm, setItemForm] = useState<CreateItemRequest>({
    name: '',
    description: '',
    type: ItemType.PRODUCT,
    price: undefined,
    unit: '',
  });
  const [itemFormError, setItemFormError] = useState<string | null>(null);
  const [itemAutocompleteOpenCount, setItemAutocompleteOpenCount] = useState(0);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getInvoices();
      // Filtrar apenas despesas
      setInvoices(data.filter((inv) => inv.type === InvoiceType.DESPESA));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar despesas');
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
        const [suppliersRes, itemsRes, documentTypesRes] = await Promise.all([
          apiService.getSuppliers(),
          apiService.getItems(),
          apiService.getDocumentTypes(),
        ]);
        setSuppliers(suppliersRes);
        setItems(itemsRes);
        setDocumentTypes(documentTypesRes);
      } catch (err) {
        console.error('Failed to load lookups', err);
      }
    };
    init();
  }, []);

  const handleCreateSupplier = async () => {
    if (!supplierForm.nome.trim()) {
      setSupplierFormError('Nome é obrigatório');
      return;
    }
    if (!supplierForm.email.trim()) {
      setSupplierFormError('E-mail é obrigatório');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(supplierForm.email)) {
      setSupplierFormError('Informe um e-mail válido');
      return;
    }

    try {
      setSupplierFormError(null);
      const payload: CreatePersonRequest = {
        nome: supplierForm.nome,
        personType: supplierForm.personType as PersonType,
        cpfCnpj: supplierForm.cpfCnpj || undefined,
        email: supplierForm.email,
        phone: supplierForm.phone || undefined,
        roles: [
          {
            type: PersonRole.SUPPLIER,
            data: { supplyCategories: supplierForm.supplyCategories || undefined },
          },
        ],
      };
      const newPerson = await apiService.createPerson(payload);
      
      // Recarregar fornecedores
      const suppliersRes = await apiService.getSuppliers();
      setSuppliers(suppliersRes);
      
      // Encontrar o novo fornecedor criado
      const newSupplier = suppliersRes.find((s) => s.personId === newPerson.id);
      if (newSupplier) {
        setFormData({ ...formData, supplierId: newSupplier.id });
      }
      
      // Fechar modal e resetar form
      setShowSupplierModal(false);
      setSupplierForm({
        nome: '',
        personType: 'FISICA',
        cpfCnpj: '',
        email: '',
        phone: '',
        supplyCategories: '',
      });
    } catch (err: any) {
      setSupplierFormError(err.message || 'Falha ao cadastrar fornecedor');
    }
  };

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
        type: InvoiceType.DESPESA,
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
      setError(err instanceof Error ? err.message : 'Falha ao criar despesa');
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
        type: InvoiceType.DESPESA,
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
      setError(err instanceof Error ? err.message : 'Falha ao atualizar despesa');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return;
    try {
      setError(null);
      await apiService.deleteInvoice(id);
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir despesa');
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
      type: InvoiceType.DESPESA,
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

  const getSupplierName = (supplierId: string) => {
    const s = suppliers.find((s) => s.id === supplierId);
    return s ? (s.person?.nome ?? s.supplyCategories ?? s.id) : supplierId;
  };
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

  const handleCreateItemClick = (index: number, searchTerm: string) => {
    setItemFormSearchTerm(searchTerm);
    setItemFormIndex(index);
    setItemForm({
      name: searchTerm,
      description: '',
      type: ItemType.PRODUCT,
      price: undefined,
      unit: '',
    });
    setItemFormError(null);
    setShowItemModal(true);
  };

  const handleCreateItem = async () => {
    if (!itemForm.name.trim()) {
      setItemFormError('Nome é obrigatório');
      return;
    }

    try {
      setItemFormError(null);
      const newItem = await apiService.createItem(itemForm);
      
      // Recarregar itens
      const itemsRes = await apiService.getItems();
      setItems(itemsRes);
      
      // Selecionar o novo item na linha correspondente
      if (itemFormIndex !== null) {
        onItemSelect(itemFormIndex, newItem.id);
      }
      
      // Fechar modal e resetar form
      setShowItemModal(false);
      setItemFormIndex(null);
      setItemFormSearchTerm('');
      setItemForm({
        name: '',
        description: '',
        type: ItemType.PRODUCT,
        price: undefined,
        unit: '',
      });
    } catch (err: any) {
      setItemFormError(err.message || 'Falha ao cadastrar item');
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Despesas</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie despesas com itens (produto/serviço) e parcelas financeiras
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
            Nova despesa
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando despesas...</div>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma despesa. Clique em &quot;Nova despesa&quot; para criar.</p>
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
              <DialogTitle>Nova despesa</DialogTitle>
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
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Autocomplete
                        options={suppliers.map((s) => ({
                          value: s.id,
                          label: s.person?.nome ?? s.supplyCategories ?? s.id,
                        }))}
                        value={formData.supplierId}
                        onChange={(value) => setFormData({ ...formData, supplierId: value })}
                        placeholder="Digite para buscar fornecedor..."
                        emptyMessage="Nenhum fornecedor encontrado"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSupplierModal(true)}
                      title="Cadastrar novo fornecedor"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={formData.documentTypeId ?? ''}
                    onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value || undefined })}
                  >
                    <option value="">Selecione...</option>
                    {documentTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.name} ({dt.group})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    value={formData.notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
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
                  <div
                    className={`space-y-2 max-h-48 ${itemAutocompleteOpenCount > 0 ? 'overflow-visible' : 'overflow-y-auto'}`}
                  >
                    {(formData.items ?? []).map((line, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 items-end border rounded p-2 bg-muted/30"
                      >
                        <div className="col-span-4">
                          <Label className="text-xs">Produto/Serviço</Label>
                          <AutocompleteWithCreate
                            options={items.map((i) => ({
                              value: i.id,
                              label: `${i.name} (${i.type})`,
                            }))}
                            value={line.itemId}
                            onChange={(value) => onItemSelect(index, value)}
                            onDropdownOpenChange={(open) =>
                              setItemAutocompleteOpenCount((c) => (open ? c + 1 : Math.max(0, c - 1)))
                            }
                            onCreateClick={(searchTerm) => handleCreateItemClick(index, searchTerm)}
                            placeholder="Digite para buscar..."
                            emptyMessage="Nenhum item encontrado"
                            createButtonText="Criar novo produto/serviço"
                          />
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
              <Button onClick={handleCreate}>Criar despesa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar despesa</DialogTitle>
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
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Autocomplete
                        options={suppliers.map((s) => ({
                          value: s.id,
                          label: s.person?.nome ?? s.supplyCategories ?? s.id,
                        }))}
                        value={formData.supplierId}
                        onChange={(value) => setFormData({ ...formData, supplierId: value })}
                        placeholder="Digite para buscar fornecedor..."
                        emptyMessage="Nenhum fornecedor encontrado"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSupplierModal(true)}
                      title="Cadastrar novo fornecedor"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={formData.documentTypeId ?? ''}
                    onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value || undefined })}
                  >
                    <option value="">Selecione...</option>
                    {documentTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.name} ({dt.group})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    value={formData.notes ?? ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
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
                Despesa {detailInvoice?.number}
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

        {/* Create Supplier Dialog */}
        <Dialog open={showSupplierModal} onOpenChange={(open) => {
          setShowSupplierModal(open);
          if (!open) {
            setSupplierFormError(null);
            setSupplierForm({
              nome: '',
              personType: 'FISICA',
              cpfCnpj: '',
              email: '',
              phone: '',
              supplyCategories: '',
            });
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Cadastre um novo fornecedor rapidamente
              </DialogDescription>
            </DialogHeader>
            {supplierFormError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {supplierFormError}
              </div>
            )}
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-nome">Nome *</Label>
                <Input
                  id="supplier-nome"
                  value={supplierForm.nome}
                  onChange={(e) => {
                    setSupplierForm({ ...supplierForm, nome: e.target.value });
                    if (supplierFormError) setSupplierFormError(null);
                  }}
                  placeholder="Nome completo ou razão social"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-personType">Tipo de pessoa *</Label>
                <Select
                  value={supplierForm.personType}
                  onValueChange={(v) => setSupplierForm({ ...supplierForm, personType: v as 'FISICA' | 'JURIDICA' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FISICA">Pessoa física</SelectItem>
                    <SelectItem value="JURIDICA">Pessoa jurídica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="supplier-cpfCnpj"
                  value={supplierForm.cpfCnpj}
                  onChange={(e) => setSupplierForm({ ...supplierForm, cpfCnpj: e.target.value })}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-email">E-mail *</Label>
                <Input
                  id="supplier-email"
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => {
                    setSupplierForm({ ...supplierForm, email: e.target.value });
                    if (supplierFormError) setSupplierFormError(null);
                  }}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-phone">Telefone</Label>
                <Input
                  id="supplier-phone"
                  type="tel"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-supplyCategories">Categorias de fornecimento</Label>
                <Input
                  id="supplier-supplyCategories"
                  value={supplierForm.supplyCategories}
                  onChange={(e) => setSupplierForm({ ...supplierForm, supplyCategories: e.target.value })}
                  placeholder="Ex: Insumos, Máquinas"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSupplierModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSupplier}>
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Item Dialog */}
        <Dialog open={showItemModal} onOpenChange={(open) => {
          setShowItemModal(open);
          if (!open) {
            setItemFormError(null);
            setItemFormIndex(null);
            setItemFormSearchTerm('');
            setItemForm({
              name: '',
              description: '',
              type: ItemType.PRODUCT,
              price: undefined,
              unit: '',
            });
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Produto/Serviço</DialogTitle>
              <DialogDescription>
                Cadastre um novo produto ou serviço rapidamente
              </DialogDescription>
            </DialogHeader>
            {itemFormError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {itemFormError}
              </div>
            )}
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Nome *</Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(e) => {
                    setItemForm({ ...itemForm, name: e.target.value });
                    if (itemFormError) setItemFormError(null);
                  }}
                  placeholder="Nome do produto ou serviço"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-type">Tipo *</Label>
                <Select
                  value={itemForm.type}
                  onValueChange={(v) => setItemForm({ ...itemForm, type: v as ItemType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ItemType.PRODUCT}>Produto</SelectItem>
                    <SelectItem value={ItemType.SERVICE}>Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-description">Descrição</Label>
                <Input
                  id="item-description"
                  value={itemForm.description || ''}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-price">Preço</Label>
                  <Input
                    id="item-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.price ?? ''}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-unit">Unidade</Label>
                  <Input
                    id="item-unit"
                    value={itemForm.unit || ''}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    placeholder="ex: kg, un, h"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowItemModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateItem}>
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
};
