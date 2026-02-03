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
  InvoiceShipmentDTO,
  CreateInvoiceShipmentRequest,
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
  type: InvoiceType.RECEITA,
  items: [],
  financials: [],
};

/** Valor sentinela para opção "Nenhum/Nenhuma" (Radix Select não aceita value="") */
const NONE_VALUE = '__none__';

export const Revenues = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [shipmentForm, setShipmentForm] = useState<{
    shipmentDate: string;
    notes: string;
    items: {
      invoiceItemId: string;
      quantityShipped: number;
      useDefaultDate: boolean;
      customShipmentDate?: string;
    }[];
  }>({ shipmentDate: '', notes: '', items: [] });
  const [invoiceShipments, setInvoiceShipments] = useState<InvoiceShipmentDTO[]>([]);
  const [shipmentError, setShipmentError] = useState<string | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [managementAccounts, setManagementAccounts] = useState<ManagementAccount[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  const [formData, setFormData] = useState<CreateInvoiceRequest>({ ...defaultForm });
  const [showUnshipConfirm, setShowUnshipConfirm] = useState(false);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<UpdateInvoiceRequest | null>(null);
  const [pendingUnshipCount, setPendingUnshipCount] = useState(0);
  const [isProcessingUnship, setIsProcessingUnship] = useState(false);
  
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
      // Filtrar apenas receitas
      setInvoices(data.filter((inv) => inv.type === InvoiceType.RECEITA));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar receitas');
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
        type: InvoiceType.RECEITA,
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
      setError(err instanceof Error ? err.message : 'Falha ao criar receita');
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

      // Itens que passarão a ter saída imediata (antes não iam para estoque e agora vão com "Entregue" marcado)
      const newAutoShipmentIndexes: number[] = [];

      const payload: UpdateInvoiceRequest = {
        number: formData.number.trim(),
        series: formData.series?.trim() || undefined,
        issueDate: formData.issueDate,
        supplierId: formData.supplierId,
        documentTypeId: formData.documentTypeId?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        type: InvoiceType.RECEITA,
        items: formData.items!.map((it, i) => {
          const orig = selectedInvoice.items[i] as
            | (typeof selectedInvoice.items)[number]
            | undefined;
          const goesToStockOrig = (orig as { goesToStock?: boolean } | undefined)?.goesToStock ?? false;
          const goesToStockNow = it.goesToStock ?? false;
          const shippedNow = it.shipped ?? false;

          if (!goesToStockOrig && goesToStockNow && shippedNow) {
            newAutoShipmentIndexes.push(i);
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
            shipped: shippedNow,
          };
        }),
        financials: formData.financials!.map((f) => ({
          dueDate: f.dueDate,
          amount: f.amount,
          paidAt: f.paidAt || undefined,
        })),
      };

      // Verificar se houve itens que tinham saída e foram desmarcados como "Entregue"
      let hadShipmentCount = 0;
      let unshipCount = 0;
      selectedInvoice.items.forEach((orig, index) => {
        const formItem = formData.items?.[index];
        if (!formItem) return;
        const goesToStockOrig = (orig as { goesToStock?: boolean }).goesToStock ?? false;
        const quantityShippedTotal =
          (orig as { quantityShippedTotal?: number }).quantityShippedTotal ?? 0;
        const hadShipment = goesToStockOrig && quantityShippedTotal > 0;
        if (!hadShipment) return;
        hadShipmentCount++;
        const nowShipped = (formItem.goesToStock ?? false) && (formItem.shipped ?? false);
        if (!nowShipped) {
          unshipCount++;
        }
      });

      if (unshipCount > 0) {
        // Se o usuário tentou "desfazer entrega" apenas de alguns itens, bloquear e instruir usar tela específica
        if (hadShipmentCount > 0 && unshipCount < hadShipmentCount) {
          setError(
            'Para remover saídas de apenas alguns itens, utilize a tela "Saída de Produtos".'
          );
          return;
        }

        // Todos os itens que tinham saída foram desmarcados: pedir confirmação
        setPendingUpdatePayload(payload);
        setPendingUnshipCount(unshipCount);
        setShowUnshipConfirm(true);
        return;
      }

      // Nenhuma alteração de "Entregue" que exija confirmação: salva normalmente
      const updated = await apiService.updateInvoice(selectedInvoice.id, payload);

      // Se algum item passou a ir para estoque com "Entregue" marcado, lançar saída automática
      if (newAutoShipmentIndexes.length > 0) {
        const autoItems = newAutoShipmentIndexes
          .map((idx) => updated.items[idx])
          .filter((it) => it && it.id)
          .map((it) => ({
            invoiceItemId: it.id,
            quantityShipped: it.quantity,
          }));

        if (autoItems.length > 0) {
          const shipmentPayload: CreateInvoiceShipmentRequest = {
            shipmentDate: formData.issueDate,
            notes: 'Saída automática ao marcar estoque/entregue na edição da receita.',
            items: autoItems,
          };
          await apiService.createInvoiceShipment(updated.id, shipmentPayload);
        }
      }

      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      resetForm();
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar receita');
    }
  };

  const handleConfirmUnshipAndSave = async () => {
    if (!selectedInvoice || !pendingUpdatePayload) {
      setShowUnshipConfirm(false);
      setPendingUpdatePayload(null);
      return;
    }
    try {
      setIsProcessingUnship(true);
      setError(null);

      // Remover todos os registros de saída desta nota (movimentos de estoque de saída/venda)
      const shipments = await apiService.getInvoiceShipments(selectedInvoice.id);
      for (const sh of shipments) {
        await apiService.deleteInvoiceShipment(selectedInvoice.id, sh.id);
      }

      // Agora salvar a edição da receita
      await apiService.updateInvoice(selectedInvoice.id, pendingUpdatePayload);
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      resetForm();
      await loadInvoices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Falha ao remover saídas de produtos e atualizar receita'
      );
    } finally {
      setIsProcessingUnship(false);
      setShowUnshipConfirm(false);
      setPendingUpdatePayload(null);
      setPendingUnshipCount(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return;
    try {
      setError(null);
      await apiService.deleteInvoice(id);
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir receita');
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
      const full = await apiService.getInvoice(inv.id);
      setSelectedInvoice(full);
      setFormData({
        number: full.number,
        series: full.series ?? '',
        issueDate: full.issueDate.slice(0, 10),
        supplierId: full.supplierId,
        documentTypeId: full.documentTypeId ?? '',
        notes: full.notes ?? '',
        type: InvoiceType.RECEITA,
        items: full.items.map((it, i) => {
          const goesToStock = (it as { goesToStock?: boolean }).goesToStock ?? false;
          const quantityShippedTotal =
            (it as { quantityShippedTotal?: number }).quantityShippedTotal ?? 0;

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
            // Se já houve saída (mesmo parcial), marcar como entregue ao carregar
            shipped: goesToStock && quantityShippedTotal > 0,
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
      setError(err instanceof Error ? err.message : 'Falha ao carregar receita para edição');
    }
  };

  const openShipmentModal = () => {
    if (!detailInvoice) return;
    const stockItems = detailInvoice.items.filter((i) => (i as { goesToStock?: boolean }).goesToStock);
    setShipmentForm({
      shipmentDate: detailInvoice.issueDate.slice(0, 10),
      notes: '',
      items: stockItems.map((i) => {
        const ordered = i.quantity;
        const alreadyShipped = (i as { quantityShippedTotal?: number }).quantityShippedTotal ?? 0;
        const pending = Math.max(0, ordered - alreadyShipped);
        return {
          invoiceItemId: i.id,
          quantityShipped: pending,
          useDefaultDate: true,
          customShipmentDate: undefined,
        };
      }),
    });
    setShipmentError(null);
    setIsShipmentModalOpen(true);
  };

  const updateShipmentLineQty = (invoiceItemId: string, quantityShipped: number) => {
    setShipmentForm((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.invoiceItemId === invoiceItemId ? { ...it, quantityShipped } : it
      ),
    }));
  };

  const updateShipmentLineDate = (
    invoiceItemId: string,
    useDefaultDate: boolean,
    customShipmentDate?: string
  ) => {
    setShipmentForm((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.invoiceItemId === invoiceItemId
          ? { ...it, useDefaultDate, customShipmentDate }
          : it
      ),
    }));
  };

  const handleCreateShipment = async () => {
    if (!detailInvoice) return;
    try {
      setShipmentError(null);
      const withQty = shipmentForm.items.filter((i) => i.quantityShipped > 0);
      if (withQty.length === 0) {
        setShipmentError('Informe ao menos uma quantidade na saída.');
        return;
      }
      const getEffectiveDate = (item: (typeof shipmentForm.items)[0]): string => {
        if (item.useDefaultDate) return shipmentForm.shipmentDate;
        const custom = item.customShipmentDate?.slice(0, 10);
        if (custom) return custom;
        return shipmentForm.shipmentDate;
      };
      const byDate = new Map<string, typeof withQty>();
      for (const item of withQty) {
        const date = getEffectiveDate(item);
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date)!.push(item);
      }
      const notes = shipmentForm.notes.trim() || undefined;
      for (const [shipmentDate, groupItems] of byDate) {
        const payload: CreateInvoiceShipmentRequest = {
          shipmentDate,
          notes,
          items: groupItems.map((i) => ({
            invoiceItemId: i.invoiceItemId,
            quantityShipped: i.quantityShipped,
          })),
        };
        await apiService.createInvoiceShipment(detailInvoice.id, payload);
      }
      const full = await apiService.getInvoice(detailInvoice.id);
      setDetailInvoice(full);
      const shipments = await apiService.getInvoiceShipments(detailInvoice.id);
      setInvoiceShipments(shipments);
      setIsShipmentModalOpen(false);
    } catch (err) {
      setShipmentError(err instanceof Error ? err.message : 'Falha ao registrar saída');
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
      const itemsRes = await apiService.getItems(undefined, true);
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
            <h1 className="text-3xl font-bold">Receitas</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie receitas com itens (produto/serviço) e parcelas financeiras
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
            Nova receita
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Carregando receitas...</div>
        ) : invoices.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma receita. Clique em &quot;Nova receita&quot; para criar.</p>
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
                                  const shipments = await apiService.getInvoiceShipments(inv.id);
                                  setInvoiceShipments(shipments);
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
              <DialogTitle>Nova receita</DialogTitle>
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
                  <div
                    className={`space-y-2 max-h-48 ${itemAutocompleteOpenCount > 0 ? 'overflow-visible' : 'overflow-y-auto'}`}
                  >
                    {(formData.items ?? []).map((line, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[minmax(140px,2fr)_56px_70px_80px_80px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_40px_36px] gap-x-2 gap-y-1.5 border rounded p-2 bg-muted/30 items-end"
                      >
                        <div className="min-w-0 flex flex-col gap-1.5">
                          <Label className="text-xs block text-left">Produto/Serviço</Label>
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
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs block text-left">Qtd</Label>
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
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs block text-left">Un.</Label>
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
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs block text-left">Preço unit.</Label>
                          <DecimalInput
                            placeholder="0,00"
                            className="h-9 px-2"
                            value={line.unitPrice}
                            onChange={(v) => updateItemLine(index, 'unitPrice', v)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs block text-left">Total</Label>
                          <DecimalInput
                            placeholder="0,00"
                            className="h-9 px-2"
                            value={line.quantity && line.unitPrice ? line.quantity * line.unitPrice : 0}
                            onChange={(total) => {
                              const qty = line.quantity > 0 ? line.quantity : 1;
                              updateItemLine(index, 'unitPrice', total / qty);
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex flex-col gap-1.5">
                          <Label className="text-xs block text-left">Centro custo</Label>
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
                        </div>
                        <div className="min-w-0 flex flex-col gap-1.5">
                          <Label className="text-xs block text-left">Conta ger.</Label>
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
                        </div>
                        <div className="min-w-0 flex flex-col gap-1.5">
                          <Label className="text-xs block text-left">Safra</Label>
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
                        </div>
                        <div className="flex flex-col gap-1.5 justify-end">
                          <Label className="text-xs block text-left">Estoque</Label>
                          <Checkbox
                            checked={line.goesToStock ?? false}
                            disabled={line.shipped === true}
                            onCheckedChange={(checked) => {
                              const value = checked === true;
                              updateItemLine(index, 'goesToStock', value);
                              if (!value && line.shipped) {
                                updateItemLine(index, 'shipped', false);
                              }
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 justify-end">
                          <Label className="text-xs block text-left">Entregue</Label>
                          {line.goesToStock ? (
                            <Checkbox
                              checked={line.shipped ?? false}
                              onCheckedChange={(checked) =>
                                updateItemLine(index, 'shipped', checked === true)
                              }
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                        <div className="flex flex-col justify-end">
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
              <Button onClick={handleCreate}>Criar receita</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Editar receita</DialogTitle>
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
                {(formData.items ?? []).map((line, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[minmax(140px,2fr)_56px_70px_80px_80px_minmax(100px,1fr)_minmax(100px,1fr)_minmax(80px,1fr)_40px_56px_36px] gap-x-2 gap-y-1.5 border rounded p-2 bg-muted/30 mb-2 items-end"
                  >
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <Label className="text-xs block text-left">Produto/Serviço</Label>
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
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs block text-left">Qtd</Label>
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
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs block text-left">Un.</Label>
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
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs block text-left">Preço unit.</Label>
                      <DecimalInput
                        placeholder="0,00"
                        className="h-9 px-2"
                        value={line.unitPrice}
                        onChange={(v) => updateItemLine(index, 'unitPrice', v)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs block text-left">Total</Label>
                      <DecimalInput
                        placeholder="0,00"
                        className="h-9 px-2"
                        value={line.quantity && line.unitPrice ? line.quantity * line.unitPrice : 0}
                        onChange={(total) => {
                          const qty = line.quantity > 0 ? line.quantity : 1;
                          updateItemLine(index, 'unitPrice', total / qty);
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <Label className="text-xs block text-left">Centro custo</Label>
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
                    </div>
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <Label className="text-xs block text-left">Conta ger.</Label>
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
                    </div>
                    <div className="min-w-0 flex flex-col gap-1.5">
                      <Label className="text-xs block text-left">Safra</Label>
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
                    </div>
                    <div className="flex flex-col gap-1.5 justify-end">
                      <Label className="text-xs block text-left">Estoque</Label>
                      <Checkbox
                        checked={line.goesToStock ?? false}
                        disabled={line.shipped === true}
                        onCheckedChange={(checked) => {
                          const value = checked === true;
                          updateItemLine(index, 'goesToStock', value);
                          if (!value && line.shipped) {
                            updateItemLine(index, 'shipped', false);
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 justify-end">
                      <Label className="text-xs block text-left">Entregue</Label>
                      {line.goesToStock ? (
                        <Checkbox
                          checked={line.shipped ?? false}
                          onCheckedChange={(checked) =>
                            updateItemLine(index, 'shipped', checked === true)
                          }
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="flex flex-col justify-end">
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

        {/* Confirmação para remover saídas de produtos ao desmarcar "Entregue" na edição */}
        <Dialog
          open={showUnshipConfirm}
          onOpenChange={(open) => {
            if (!open && !isProcessingUnship) {
              setShowUnshipConfirm(false);
              setPendingUpdatePayload(null);
              setPendingUnshipCount(0);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Remover saídas de produtos desta receita?</DialogTitle>
              <DialogDescription>
                {pendingUnshipCount > 1
                  ? `Você desmarcou a entrega de ${pendingUnshipCount} itens que já tinham saída registrada no estoque.`
                  : 'Você desmarcou a entrega de um item que já tinha saída registrada no estoque.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p>
                Se confirmar, todos os registros de saída desta nota serão removidos e o estoque será
                ajustado (entrada dos produtos que haviam sido baixados como venda).
              </p>
              <p className="font-medium">Essa operação não pode ser desfeita automaticamente.</p>
            </div>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                disabled={isProcessingUnship}
                onClick={() => {
                  if (isProcessingUnship) return;
                  setShowUnshipConfirm(false);
                  setPendingUpdatePayload(null);
                  setPendingUnshipCount(0);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmUnshipAndSave}
                disabled={isProcessingUnship}
              >
                {isProcessingUnship ? 'Processando...' : 'Remover saídas e salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog: items, financials, mark as paid */}
        <Dialog open={!!detailInvoice} onOpenChange={(open) => !open && setDetailInvoice(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>
                Receita {detailInvoice?.number}
                {detailInvoice?.series ? ` - Série ${detailInvoice.series}` : ''}
              </DialogTitle>
              <DialogDescription>
                Emissão: {detailInvoice && formatDate(detailInvoice.issueDate)} • Fornecedor:{' '}
                {detailInvoice && getSupplierName(detailInvoice.supplierId)}
              </DialogDescription>
              {detailInvoice && detailInvoice.items.some((i) => (i as { goesToStock?: boolean }).goesToStock) && (
                <Button type="button" variant="outline" size="sm" className="mt-2 w-fit" onClick={openShipmentModal}>
                  <Package className="h-4 w-4 mr-1" /> Registrar saída de produtos
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
                        const shipped = (line as { quantityShippedTotal?: number }).quantityShippedTotal ?? 0;
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
                                  {shipped > 0 && ` • Entregue: ${shipped} ${line.unit}`}
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
                {invoiceShipments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Saídas de produtos</Label>
                    <div className="mt-2 border rounded divide-y text-sm">
                      {invoiceShipments.map((sh) => (
                        <div key={sh.id} className="px-3 py-2">
                          <span className="font-medium">{formatDate(sh.shipmentDate)}</span>
                          {sh.notes && <span className="text-muted-foreground ml-2">— {sh.notes}</span>}
                          <ul className="mt-1 ml-2 text-muted-foreground list-disc list-inside">
                            {sh.items.map((si) => {
                              const invItem = detailInvoice.items.find((i) => i.id === si.invoiceItemId);
                              return (
                                <li key={si.id}>
                                  {invItem ? getItemName(invItem.itemId) : si.invoiceItemId}: {si.quantityShipped}{' '}
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

        {/* Saída de produtos Modal */}
        <Dialog open={isShipmentModalOpen} onOpenChange={(open) => !open && setIsShipmentModalOpen(false)}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Registrar saída de produtos</DialogTitle>
              <DialogDescription>
                Informe a data e as quantidades entregues por item (apenas itens que vão para estoque). O movimento de estoque será registrado como Venda.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
              {shipmentError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">{shipmentError}</div>
              )}
              <div>
                <Label>Data da saída (padrão para todos)</Label>
                <Input
                  type="date"
                  value={shipmentForm.shipmentDate}
                  onChange={(e) => setShipmentForm((p) => ({ ...p, shipmentDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Observações (opcional)</Label>
                <Input
                  value={shipmentForm.notes}
                  onChange={(e) => setShipmentForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Ex.: Entrega parcial"
                  className="mt-1"
                />
              </div>
              {shipmentForm.items.some((i) => !i.useDefaultDate) && (
                <p className="text-xs text-muted-foreground">
                  Itens com data diferente serão registrados em saídas separadas.
                </p>
              )}
              <div>
                <Label>Quantidades nesta saída</Label>
                <div className="mt-2 space-y-2">
                  {shipmentForm.items.map((ri) => {
                    const invItem = detailInvoice?.items.find((i) => i.id === ri.invoiceItemId);
                    if (!invItem) return null;
                    const ordered = invItem.quantity;
                    const alreadyShipped = (invItem as { quantityShippedTotal?: number }).quantityShippedTotal ?? 0;
                    const max = Math.max(0, ordered - alreadyShipped);
                    return (
                      <div key={ri.invoiceItemId} className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="min-w-[140px] text-sm">{getItemName(invItem.itemId)}</span>
                          <span className="text-xs text-muted-foreground">
                            faturado: {ordered} {invItem.unit} • já entregue: {alreadyShipped}
                          </span>
                          <Input
                            type="number"
                            min={0}
                            max={max}
                            step="any"
                            value={ri.quantityShipped || ''}
                            onChange={(e) =>
                              updateShipmentLineQty(ri.invoiceItemId, parseFloat(e.target.value) || 0)
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
                                updateShipmentLineDate(ri.invoiceItemId, false, shipmentForm.shipmentDate)
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
                                value={ri.customShipmentDate ?? shipmentForm.shipmentDate}
                                onChange={(e) =>
                                  updateShipmentLineDate(ri.invoiceItemId, false, e.target.value)
                                }
                                className="h-8 w-[140px]"
                              />
                              <Button
                                type="button"
                                variant="link"
                                className="h-auto p-0 text-xs"
                                onClick={() => updateShipmentLineDate(ri.invoiceItemId, true)}
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
              <Button variant="outline" onClick={() => setIsShipmentModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateShipment}>Registrar saída</Button>
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
