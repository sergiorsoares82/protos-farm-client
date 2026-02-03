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
import { DecimalInput } from '@/components/ui/decimal-input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import { Autocomplete } from '@/components/ui/autocomplete';
import { AutocompleteWithCreate } from '@/components/ui/autocomplete-with-create';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Plus, Pencil, Trash2, AlertCircle, DollarSign, Package, UserPlus } from 'lucide-react';
import {
  apiService,
  Invoice,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  InvoiceItemDTO,
  InvoiceFinancialDTO,
  InvoiceReceiptDTO,
  CreateInvoiceReceiptRequest,
  ItemType,
  Item,
  Supplier,
  InvoiceType,
  DocumentType,
  UnitOfMeasure,
  CostCenter,
  ManagementAccount,
  Season,
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

/** Valor sentinela para opção "Nenhum/Nenhuma" (Radix Select não aceita value="") */
const NONE_VALUE = '__none__';

export const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptForm, setReceiptForm] = useState<{
    receiptDate: string;
    notes: string;
    items: {
      invoiceItemId: string;
      quantityReceived: number;
      useDefaultDate: boolean;
      customReceiptDate?: string;
    }[];
  }>({ receiptDate: '', notes: '', items: [] });
  const [invoiceReceipts, setInvoiceReceipts] = useState<InvoiceReceiptDTO[]>([]);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [managementAccounts, setManagementAccounts] = useState<ManagementAccount[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [formData, setFormData] = useState<CreateInvoiceRequest>({ ...defaultForm });
  const [showUnreceiveConfirm, setShowUnreceiveConfirm] = useState(false);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<UpdateInvoiceRequest | null>(null);
  const [pendingUnreceiveCount, setPendingUnreceiveCount] = useState(0);
  const [isProcessingUnreceive, setIsProcessingUnreceive] = useState(false);
  
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
  const [_itemFormSearchTerm, setItemFormSearchTerm] = useState('');
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
        const [
          suppliersRes,
          itemsRes,
          documentTypesRes,
          unitOfMeasuresRes,
          costCentersRes,
          managementAccountsRes,
          seasonsRes,
        ] = await Promise.all([
          apiService.getSuppliers(),
          apiService.getItems(),
          apiService.getDocumentTypes(),
          apiService.getUnitOfMeasures(),
          apiService.getCostCenters(),
          apiService.getManagementAccounts(),
          apiService.getSeasons(),
        ]);
        setSuppliers(suppliersRes);
        setItems(itemsRes);
        setDocumentTypes(documentTypesRes);
        setUnitOfMeasures(unitOfMeasuresRes.filter((u) => u.isActive));
        setCostCenters(costCentersRes.filter((c) => c.isActive));
        setManagementAccounts(managementAccountsRes);
        setSeasons(seasonsRes.filter((s) => s.isActive));
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
          quantity: 0,
          unit: '',
          unitPrice: 0,
          lineOrder: prev.items?.length ?? 0,
          costCenterId: undefined,
          managementAccountId: undefined,
          seasonId: undefined,
          goesToStock: false,
          received: false,
        },
      ],
    }));
  };

  const updateItemLine = (index: number, field: keyof InvoiceItemDTO, value: string | number | boolean) => {
    setFormData((prev) => {
      const lines = [...(prev.items ?? [])];
      if (!lines[index]) return prev;
      lines[index] = { ...lines[index], [field]: value };
      if (field === 'itemId' && typeof value === 'string') {
        const product = items.find((p) => p.id === value);
        if (product) {
          const productUnit = (product.unit ?? '').trim();
          const unitCode =
            productUnit &&
            unitOfMeasures.find((u) => u.code.toLowerCase() === productUnit.toLowerCase())?.code;
          lines[index].unit = unitCode ?? product.unit ?? lines[index].unit ?? '';
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
          costCenterId: it.costCenterId?.trim() || undefined,
          managementAccountId: it.managementAccountId?.trim() || undefined,
          seasonId: it.seasonId?.trim() || undefined,
          goesToStock: it.goesToStock ?? false,
          received: it.received ?? false,
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

      // Itens que passarão a ter recebimento imediato (antes não iam para estoque e agora vão com "Recebido" marcado)
      const newAutoReceiveIndexes: number[] = [];

      const payload: UpdateInvoiceRequest = {
        number: formData.number.trim(),
        series: formData.series?.trim() || undefined,
        issueDate: formData.issueDate,
        supplierId: formData.supplierId,
        documentTypeId: formData.documentTypeId?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        type: InvoiceType.DESPESA,
        items: formData.items!.map((it, i) => {
          const orig = selectedInvoice.items[i] as
            | (typeof selectedInvoice.items)[number]
            | undefined;
          const goesToStockOrig = (orig as { goesToStock?: boolean } | undefined)?.goesToStock ?? false;
          const goesToStockNow = it.goesToStock ?? false;
          const receivedNow = it.received ?? false;

          if (!goesToStockOrig && goesToStockNow && receivedNow) {
            newAutoReceiveIndexes.push(i);
          }

          return {
            itemId: it.itemId,
            itemType: it.itemType,
            quantity: it.quantity,
            unit: it.unit.trim(),
            unitPrice: it.unitPrice,
            lineOrder: i,
            description: it.description?.trim() || undefined,
            costCenterId: it.costCenterId?.trim() || undefined,
            managementAccountId: it.managementAccountId?.trim() || undefined,
            seasonId: it.seasonId?.trim() || undefined,
            goesToStock: goesToStockNow,
            received: receivedNow,
          };
        }),
        financials: formData.financials!.map((f) => ({
          dueDate: f.dueDate,
          amount: f.amount,
          paidAt: f.paidAt || undefined,
        })),
      };

      // Verificar se houve itens que tinham recebimento e foram desmarcados como "Recebido"
      let hadReceiptCount = 0;
      let unreceiveCount = 0;
      selectedInvoice.items.forEach((orig, index) => {
        const formItem = formData.items?.[index];
        if (!formItem) return;
        const goesToStockOrig = (orig as { goesToStock?: boolean }).goesToStock ?? false;
        const quantityReceivedTotal =
          (orig as { quantityReceivedTotal?: number }).quantityReceivedTotal ?? 0;
        const hadReceipt = goesToStockOrig && quantityReceivedTotal > 0;
        if (!hadReceipt) return;
        hadReceiptCount++;
        const nowReceived = (formItem.goesToStock ?? false) && (formItem.received ?? false);
        if (!nowReceived) {
          unreceiveCount++;
        }
      });

      if (unreceiveCount > 0) {
        // Se o usuário tentou "desmarcar recebido" apenas de alguns itens, bloqueamos aqui
        if (hadReceiptCount > 0 && unreceiveCount < hadReceiptCount) {
          setError(
            'Para remover recebimentos de apenas alguns itens, utilize a tela "Recebimento de Produtos".'
          );
          return;
        }

        // Todos os itens que tinham recebimento foram desmarcados: pedir confirmação
        setPendingUpdatePayload(payload);
        setPendingUnreceiveCount(unreceiveCount);
        setShowUnreceiveConfirm(true);
        return;
      }

      // Nenhuma alteração de "Recebido" que exija confirmação: salva normalmente
      const updated = await apiService.updateInvoice(selectedInvoice.id, payload);

      // Se algum item passou a ir para estoque com "Recebido" marcado, lançar recebimento automático
      if (newAutoReceiveIndexes.length > 0) {
        const autoItems = newAutoReceiveIndexes
          .map((idx) => updated.items[idx])
          .filter((it) => it && it.id)
          .map((it) => ({
            invoiceItemId: it.id,
            quantityReceived: it.quantity,
          }));

        if (autoItems.length > 0) {
          const receiptPayload: CreateInvoiceReceiptRequest = {
            receiptDate: formData.issueDate,
            notes: 'Recebimento automático ao marcar estoque/recebido na edição da despesa.',
            items: autoItems,
          };
          await apiService.createInvoiceReceipt(updated.id, receiptPayload);
        }
      }

      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      resetForm();
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar despesa');
    }
  };

  const handleConfirmUnreceiveAndSave = async () => {
    if (!selectedInvoice || !pendingUpdatePayload) {
      setShowUnreceiveConfirm(false);
      setPendingUpdatePayload(null);
      return;
    }
    try {
      setIsProcessingUnreceive(true);
      setError(null);

      // Remover todos os registros de recebimento desta nota (movimentos de estoque de entrada)
      const receipts = await apiService.getInvoiceReceipts(selectedInvoice.id);
      for (const rec of receipts) {
        await apiService.deleteInvoiceReceipt(selectedInvoice.id, rec.id);
      }

      // Agora salvar a edição da despesa
      await apiService.updateInvoice(selectedInvoice.id, pendingUpdatePayload);
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      resetForm();
      await loadInvoices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao remover recebimentos e atualizar despesa'
      );
    } finally {
      setIsProcessingUnreceive(false);
      setShowUnreceiveConfirm(false);
      setPendingUpdatePayload(null);
      setPendingUnreceiveCount(0);
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

  const openEditDialog = async (inv: Invoice) => {
    try {
      setError(null);
      // Buscar a nota completa para garantir que tenhamos os totais de recebimento por item
      const full = await apiService.getInvoice(inv.id);
      setSelectedInvoice(full);
      setFormData({
        number: full.number,
        series: full.series ?? '',
        issueDate: full.issueDate.slice(0, 10),
        supplierId: full.supplierId,
        documentTypeId: full.documentTypeId ?? '',
        notes: full.notes ?? '',
        type: InvoiceType.DESPESA,
        items: full.items.map((it, i) => {
          const goesToStock = (it as { goesToStock?: boolean }).goesToStock ?? false;
          const quantityReceivedTotal =
            (it as { quantityReceivedTotal?: number }).quantityReceivedTotal ?? 0;

          return {
            itemId: it.itemId,
            itemType: it.itemType as ItemType,
            quantity: it.quantity,
            unit: it.unit,
            unitPrice: it.unitPrice,
            lineOrder: i,
            description: it.description,
            costCenterId: (it as { costCenterId?: string | null }).costCenterId ?? undefined,
            managementAccountId: (it as { managementAccountId?: string | null }).managementAccountId ?? undefined,
            seasonId: (it as { seasonId?: string | null }).seasonId ?? undefined,
            goesToStock,
            // Se já houve recebimento (mesmo parcial), marcar como recebido ao carregar
            received: goesToStock && quantityReceivedTotal > 0,
          };
        }),
        financials: full.financials.map((f) => ({
          dueDate: f.dueDate.slice(0, 10),
          amount: f.amount,
          paidAt: f.paidAt?.slice(0, 10),
        })),
      });
      setIsEditDialogOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar despesa para edição');
    }
  };

  const openReceiptModal = () => {
    if (!detailInvoice) return;
    const stockItems = detailInvoice.items.filter((i) => (i as { goesToStock?: boolean }).goesToStock);
    setReceiptForm({
      receiptDate: detailInvoice.issueDate.slice(0, 10),
      notes: '',
      items: stockItems.map((i) => {
        const ordered = i.quantity;
        const alreadyReceived = (i as { quantityReceivedTotal?: number }).quantityReceivedTotal ?? 0;
        const pending = Math.max(0, ordered - alreadyReceived);
        return {
          invoiceItemId: i.id,
          quantityReceived: pending,
          useDefaultDate: true,
          customReceiptDate: undefined,
        };
      }),
    });
    setReceiptError(null);
    setIsReceiptModalOpen(true);
  };

  const updateReceiptLineQty = (invoiceItemId: string, quantityReceived: number) => {
    setReceiptForm((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.invoiceItemId === invoiceItemId ? { ...it, quantityReceived } : it
      ),
    }));
  };

  const updateReceiptLineDate = (
    invoiceItemId: string,
    useDefaultDate: boolean,
    customReceiptDate?: string
  ) => {
    setReceiptForm((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.invoiceItemId === invoiceItemId
          ? { ...it, useDefaultDate, customReceiptDate }
          : it
      ),
    }));
  };

  const handleCreateReceipt = async () => {
    if (!detailInvoice) return;
    try {
      setReceiptError(null);
      const withQty = receiptForm.items.filter((i) => i.quantityReceived > 0);
      if (withQty.length === 0) {
        setReceiptError('Informe ao menos uma quantidade recebida.');
        return;
      }
      const getEffectiveDate = (item: (typeof receiptForm.items)[0]): string => {
        if (item.useDefaultDate) return receiptForm.receiptDate;
        const custom = item.customReceiptDate?.slice(0, 10);
        if (custom) return custom;
        return receiptForm.receiptDate;
      };
      const byDate = new Map<string, typeof withQty>();
      for (const item of withQty) {
        const date = getEffectiveDate(item);
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date)!.push(item);
      }
      const notes = receiptForm.notes.trim() || undefined;
      for (const [receiptDate, groupItems] of byDate) {
        const payload: CreateInvoiceReceiptRequest = {
          receiptDate,
          notes,
          items: groupItems.map((i) => ({
            invoiceItemId: i.invoiceItemId,
            quantityReceived: i.quantityReceived,
          })),
        };
        await apiService.createInvoiceReceipt(detailInvoice.id, payload);
      }
      const full = await apiService.getInvoice(detailInvoice.id);
      setDetailInvoice(full);
      const receipts = await apiService.getInvoiceReceipts(detailInvoice.id);
      setInvoiceReceipts(receipts);
      setIsReceiptModalOpen(false);
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : 'Falha ao registrar recebimento');
    }
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
      const productUnit = (product.unit ?? '').trim();
      const unitCode =
        productUnit &&
        unitOfMeasures.find((u) => u.code.toLowerCase() === productUnit.toLowerCase())?.code;
      const resolvedUnit = unitCode ?? product.unit ?? '';
      updateItemLine(index, 'itemId', itemId);
      updateItemLine(index, 'unit', resolvedUnit);
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
    if (!itemForm.unit?.trim()) {
      setItemFormError('Unidade de medida é obrigatória');
      return;
    }

    try {
      setItemFormError(null);
      const newItem = await apiService.createItem({ ...itemForm, unit: itemForm.unit.trim() });
      
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
                            ? formatCurrency(Number(inv.itemsTotal))
                            : '—'}
                        </td>
                        <td className="px-4 py-3">{inv.financials?.length ?? 0}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={async () => {
                                try {
                                  const full = await apiService.getInvoice(inv.id);
                                  setDetailInvoice(full);
                                  const receipts = await apiService.getInvoiceReceipts(inv.id);
                                  setInvoiceReceipts(receipts);
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
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
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Nova despesa</DialogTitle>
              <DialogDescription>
                Preencha o cabeçalho, adicione itens (produto ou serviço) e parcelas financeiras
                (vencimentos).
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid gap-4 py-4 px-6">
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
                  <div className={`overflow-x-auto rounded-md border max-h-48 ${itemAutocompleteOpenCount > 0 ? 'overflow-visible' : 'overflow-y-auto'}`}>
                    <div className="grid grid-cols-[minmax(140px,2fr)_56px_70px_80px_80px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_40px_56px_36px] gap-x-2 gap-y-1 px-2 py-2 bg-muted/50 text-xs text-muted-foreground font-medium min-w-[860px]">
                      <span>Produto/Serviço</span>
                      <span>Qtd</span>
                      <span>Un.</span>
                      <span>Preço unit.</span>
                      <span>Total</span>
                      <span>Centro custo</span>
                      <span>Conta ger.</span>
                      <span>Safra</span>
                      <span>Estoque</span>
                      <span>Recebido</span>
                      <span className="w-9" />
                    </div>
                    {(formData.items ?? []).map((line, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[minmax(140px,2fr)_56px_70px_80px_80px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_40px_56px_36px] gap-x-2 gap-y-1 px-2 py-2 border-t bg-muted/20 items-center min-w-[860px]"
                      >
                        <div className="min-w-0">
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
                            placeholder="Buscar..."
                            emptyMessage="Nenhum item encontrado"
                            createButtonText="Criar novo produto/serviço"
                          />
                        </div>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="1"
                          className="h-9 px-2"
                          value={line.quantity === 0 ? '' : line.quantity}
                          onChange={(e) =>
                            updateItemLine(index, 'quantity', parseFloat(e.target.value) || 0)
                          }
                        />
                        <Select
                          value={line.unit || ''}
                          onValueChange={(value) => updateItemLine(index, 'unit', value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Un." />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOfMeasures.map((u) => (
                              <SelectItem key={u.id} value={u.code}>
                                {u.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <DecimalInput
                          placeholder="0,00"
                          className="h-9 px-2"
                          value={line.unitPrice}
                          onChange={(v) => updateItemLine(index, 'unitPrice', v)}
                        />
                        <DecimalInput
                          placeholder="0,00"
                          className="h-9 px-2"
                          value={line.quantity && line.unitPrice ? line.quantity * line.unitPrice : 0}
                          onChange={(total) => {
                            const qty = line.quantity > 0 ? line.quantity : 1;
                            updateItemLine(index, 'unitPrice', total / qty);
                          }}
                        />
                        <Select
                          value={line.costCenterId || NONE_VALUE}
                          onValueChange={(value) => updateItemLine(index, 'costCenterId', value === NONE_VALUE ? (undefined as any) : value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                            {costCenters.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.code} - {c.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={line.managementAccountId || NONE_VALUE}
                          onValueChange={(value) => updateItemLine(index, 'managementAccountId', value === NONE_VALUE ? (undefined as any) : value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                            {managementAccounts.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                {m.code} - {m.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={line.seasonId || NONE_VALUE}
                          onValueChange={(value) => updateItemLine(index, 'seasonId', value === NONE_VALUE ? (undefined as any) : value)}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                            {seasons.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Checkbox
                          checked={line.goesToStock ?? false}
                          disabled={line.received === true}
                          onCheckedChange={(checked) => {
                            const value = checked === true;
                            updateItemLine(index, 'goesToStock', value);
                            if (!value && line.received) {
                              updateItemLine(index, 'received', false);
                            }
                          }}
                        />
                        <div className="flex items-center justify-center" title="Receber no estoque na data da nota ao salvar">
                          {line.goesToStock ? (
                            <Checkbox
                              checked={line.received ?? false}
                              onCheckedChange={(checked) => updateItemLine(index, 'received', checked === true)}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 shrink-0"
                          onClick={() => removeItemLine(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
                          <DecimalInput
                            value={fin.amount}
                            onChange={(v) => updateFinancialLine(index, 'amount', v)}
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
            </div>
            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate}>Criar despesa</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Editar despesa</DialogTitle>
              <DialogDescription>
                Altere o cabeçalho, itens e parcelas conforme necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid gap-4 py-4 px-6">
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
                <div className="overflow-x-auto rounded-md border">
                  <div className="grid grid-cols-[minmax(140px,2fr)_56px_70px_80px_80px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_40px_56px_36px] gap-x-2 gap-y-1 px-2 py-2 bg-muted/50 text-xs text-muted-foreground font-medium min-w-[860px]">
                    <span>Produto/Serviço</span>
                    <span>Qtd</span>
                    <span>Un.</span>
                    <span>Preço unit.</span>
                    <span>Total</span>
                    <span>Centro custo</span>
                    <span>Conta ger.</span>
                    <span>Safra</span>
                    <span>Estoque</span>
                    <span>Recebido</span>
                    <span className="w-9" />
                  </div>
                  {(formData.items ?? []).map((line, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[minmax(140px,2fr)_56px_70px_80px_80px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_40px_56px_36px] gap-x-2 gap-y-1 px-2 py-2 border-t bg-muted/20 items-center min-w-[860px]"
                    >
                      <div className="min-w-0">
                        <select
                          className="flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-2 text-sm"
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
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="1"
                        className="h-9 px-2"
                        value={line.quantity === 0 ? '' : line.quantity}
                        onChange={(e) =>
                          updateItemLine(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                      />
                      <Select
                        value={line.unit || ''}
                        onValueChange={(value) => updateItemLine(index, 'unit', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Un." />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOfMeasures.map((u) => (
                            <SelectItem key={u.id} value={u.code}>
                              {u.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <DecimalInput
                        placeholder="0,00"
                        className="h-9 px-2"
                        value={line.unitPrice}
                        onChange={(v) => updateItemLine(index, 'unitPrice', v)}
                      />
                      <DecimalInput
                        placeholder="0,00"
                        className="h-9 px-2"
                        value={line.quantity && line.unitPrice ? line.quantity * line.unitPrice : 0}
                        onChange={(total) => {
                          const qty = line.quantity > 0 ? line.quantity : 1;
                          updateItemLine(index, 'unitPrice', total / qty);
                        }}
                      />
                      <Select
                        value={line.costCenterId || NONE_VALUE}
                        onValueChange={(value) => updateItemLine(index, 'costCenterId', value === NONE_VALUE ? (undefined as any) : value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Nenhum</SelectItem>
                          {costCenters.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.code} - {c.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={line.managementAccountId || NONE_VALUE}
                        onValueChange={(value) => updateItemLine(index, 'managementAccountId', value === NONE_VALUE ? (undefined as any) : value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                          {managementAccounts.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.code} - {m.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={line.seasonId || NONE_VALUE}
                        onValueChange={(value) => updateItemLine(index, 'seasonId', value === NONE_VALUE ? (undefined as any) : value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>Nenhuma</SelectItem>
                          {seasons.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Checkbox
                        checked={line.goesToStock ?? false}
                        disabled={line.received === true}
                        onCheckedChange={(checked) => {
                          const value = checked === true;
                          updateItemLine(index, 'goesToStock', value);
                          if (!value && line.received) {
                            updateItemLine(index, 'received', false);
                          }
                        }}
                      />
                      <div className="flex items-center justify-center" title="Receber no estoque na data da nota ao salvar">
                        {line.goesToStock ? (
                          <Checkbox
                            checked={line.received ?? false}
                            onCheckedChange={(checked) => updateItemLine(index, 'received', checked === true)}
                          />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 shrink-0"
                        onClick={() => removeItemLine(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
                      <DecimalInput
                        value={fin.amount}
                        onChange={(v) => updateFinancialLine(index, 'amount', v)}
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
            </div>
            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEdit}>Salvar alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmação para remover recebimentos ao desmarcar "Recebido" na edição */}
        <Dialog open={showUnreceiveConfirm} onOpenChange={(open) => {
          if (!open && !isProcessingUnreceive) {
            setShowUnreceiveConfirm(false);
            setPendingUpdatePayload(null);
            setPendingUnreceiveCount(0);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Remover recebimentos desta nota?</DialogTitle>
              <DialogDescription>
                {pendingUnreceiveCount > 1
                  ? `Você desmarcou o recebimento de ${pendingUnreceiveCount} itens que já tinham entrada registrada no estoque.`
                  : 'Você desmarcou o recebimento de um item que já tinha entrada registrada no estoque.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                Se confirmar, todos os registros de recebimento desta nota serão removidos e o
                estoque será ajustado (saída dos produtos recebidos anteriormente).
              </p>
              <p className="font-medium">
                Essa operação não pode ser desfeita automaticamente.
              </p>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isProcessingUnreceive}
                onClick={() => {
                  if (isProcessingUnreceive) return;
                  setShowUnreceiveConfirm(false);
                  setPendingUpdatePayload(null);
                  setPendingUnreceiveCount(0);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmUnreceiveAndSave}
                disabled={isProcessingUnreceive}
              >
                {isProcessingUnreceive ? 'Processando...' : 'Remover recebimentos e salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog: items, financials, mark as paid */}
        <Dialog open={!!detailInvoice} onOpenChange={(open) => !open && setDetailInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>
                Despesa {detailInvoice?.number}
                {detailInvoice?.series ? ` - Série ${detailInvoice.series}` : ''}
              </DialogTitle>
              <DialogDescription>
                Emissão: {detailInvoice && formatDate(detailInvoice.issueDate)} • Fornecedor:{' '}
                {detailInvoice && getSupplierName(detailInvoice.supplierId)}
              </DialogDescription>
              {detailInvoice && detailInvoice.items.some((i) => (i as { goesToStock?: boolean }).goesToStock) && (
                <Button type="button" variant="outline" size="sm" className="mt-2 w-fit" onClick={openReceiptModal}>
                  <Package className="h-4 w-4 mr-1" /> Registrar recebimento
                </Button>
              )}
            </DialogHeader>
            {detailInvoice && (
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Itens</Label>
                  <div className="mt-2 border rounded divide-y text-sm">
                    {detailInvoice.items?.length ? (
                      detailInvoice.items.map((line) => {
                        const goesToStock = (line as { goesToStock?: boolean }).goesToStock;
                        const received = (line as { quantityReceivedTotal?: number }).quantityReceivedTotal ?? 0;
                        return (
                          <div
                            key={line.id}
                            className="flex justify-between items-start px-3 py-2 gap-2"
                          >
                            <span>
                              {getItemName(line.itemId)}
                              {goesToStock && (
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                  Faturado: {line.quantity} {line.unit}
                                  {received > 0 && ` • Recebido: ${received} ${line.unit}`}
                                </span>
                              )}
                            </span>
                            <span>
                              {line.quantity} {line.unit} × {formatCurrency(Number(line.unitPrice))} ={' '}
                              {formatCurrency(line.totalPrice ?? line.quantity * line.unitPrice)}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="px-3 py-2 text-muted-foreground">Nenhum item</p>
                    )}
                  </div>
                  {detailInvoice.itemsTotal != null && (
                    <p className="text-right font-medium mt-2">
                      Total itens: {formatCurrency(Number(detailInvoice.itemsTotal))}
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
                            Vencimento: {formatDate(fin.dueDate)} • {formatCurrency(Number(fin.amount))}{' '}
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
                      Total parcelas: {formatCurrency(Number(detailInvoice.financialsTotal))}
                    </p>
                  )}
                </div>
                {invoiceReceipts.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Recebimentos</Label>
                    <div className="mt-2 border rounded divide-y text-sm">
                      {invoiceReceipts.map((rec) => (
                        <div key={rec.id} className="px-3 py-2">
                          <span className="font-medium">{formatDate(rec.receiptDate)}</span>
                          {rec.notes && <span className="text-muted-foreground ml-2">— {rec.notes}</span>}
                          <ul className="mt-1 ml-2 text-muted-foreground list-disc list-inside">
                            {rec.items.map((ri) => {
                              const invItem = detailInvoice.items.find((i) => i.id === ri.invoiceItemId);
                              return (
                                <li key={ri.id}>
                                  {invItem ? getItemName(invItem.itemId) : ri.invoiceItemId}: {ri.quantityReceived}{' '}
                                  {invItem?.unit ?? ''}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Receipt (Registrar recebimento) Modal */}
        <Dialog open={isReceiptModalOpen} onOpenChange={(open) => !open && setIsReceiptModalOpen(false)}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Registrar recebimento</DialogTitle>
              <DialogDescription>
                Informe a data e as quantidades recebidas por item (apenas itens que vão para estoque).
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
              {receiptError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{receiptError}</div>
              )}
              <div>
                <Label>Data do recebimento (padrão para todos)</Label>
                <Input
                  type="date"
                  value={receiptForm.receiptDate}
                  onChange={(e) => setReceiptForm((p) => ({ ...p, receiptDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Observações (opcional)</Label>
                <Input
                  value={receiptForm.notes}
                  onChange={(e) => setReceiptForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Ex.: Entrega parcial"
                  className="mt-1"
                />
              </div>
              {receiptForm.items.some((i) => !i.useDefaultDate) && (
                <p className="text-xs text-muted-foreground">
                  Itens com data diferente serão registrados em recebimentos separados.
                </p>
              )}
              <div>
                <Label>Quantidades neste recebimento</Label>
                <div className="mt-2 space-y-2">
                  {receiptForm.items.map((ri) => {
                    const invItem = detailInvoice?.items.find((i) => i.id === ri.invoiceItemId);
                    if (!invItem) return null;
                    const ordered = invItem.quantity;
                    const alreadyReceived = (invItem as { quantityReceivedTotal?: number }).quantityReceivedTotal ?? 0;
                    const max = Math.max(0, ordered - alreadyReceived);
                    return (
                      <div key={ri.invoiceItemId} className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="min-w-[140px] text-sm">{getItemName(invItem.itemId)}</span>
                          <span className="text-xs text-muted-foreground">
                            faturado: {ordered} {invItem.unit} • já recebido: {alreadyReceived}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            max={max}
                            step="any"
                            value={ri.quantityReceived || ''}
                            onChange={(e) =>
                              updateReceiptLineQty(ri.invoiceItemId, parseFloat(e.target.value) || 0)
                            }
                            placeholder="0"
                            className="w-24 h-8"
                          />
                          <span className="text-xs text-muted-foreground">{invItem.unit}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-0">
                          {ri.useDefaultDate ? (
                            <Button
                              type="button"
                              variant="link"
                              className="h-auto p-0 text-xs text-muted-foreground"
                              onClick={() =>
                                updateReceiptLineDate(ri.invoiceItemId, false, receiptForm.receiptDate)
                              }
                            >
                              Alterar data para este item
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">
                                Data específica para este item (opcional):
                              </Label>
                              <Input
                                type="date"
                                value={ri.customReceiptDate ?? receiptForm.receiptDate}
                                onChange={(e) =>
                                  updateReceiptLineDate(ri.invoiceItemId, false, e.target.value)
                                }
                                className="h-8 w-[140px]"
                              />
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-xs"
                                onClick={() => updateReceiptLineDate(ri.invoiceItemId, true)}
                              >
                                Usar data padrão
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateReceipt}>Registrar recebimento</Button>
            </DialogFooter>
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
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Novo Fornecedor</DialogTitle>
              <DialogDescription>
                Cadastre um novo fornecedor rapidamente
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-6">
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
            </div>
            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
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
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Novo Produto/Serviço</DialogTitle>
              <DialogDescription>
                Cadastre um novo produto ou serviço rapidamente
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-6">
            {itemFormError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
                {itemFormError}
              </div>
            )}
            <div className="grid grid-cols-[1fr_120px_1fr_100px_120px] gap-4 py-4 items-end">
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
              <div className="space-y-2">
                <Label htmlFor="item-price">Preço</Label>
                <DecimalInput
                  id="item-price"
                  value={itemForm.price ?? undefined}
                  onChange={(v) => setItemForm({ ...itemForm, price: v })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unit">Unidade *</Label>
                <Select
                  value={itemForm.unit || ''}
                  onValueChange={(value) => setItemForm({ ...itemForm, unit: value })}
                >
                  <SelectTrigger id="item-unit">
                    <SelectValue placeholder="Un." />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOfMeasures.map((u) => (
                      <SelectItem key={u.id} value={u.code}>
                        {u.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            </div>
            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
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
