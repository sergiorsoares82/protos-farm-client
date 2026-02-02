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
import { formatCurrency } from '@/lib/utils';
import { Package, ListChecks, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  apiService,
  Invoice,
  InvoiceReceiptDTO,
  CreateInvoiceReceiptRequest,
  Item,
  Supplier,
} from '@/services/api';

type ReceiptFilter = 'pending' | 'with_receipts';

export const ProductReceipts = () => {
  const [filter, setFilter] = useState<ReceiptFilter>('pending');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const [detailViewInvoice, setDetailViewInvoice] = useState<Invoice | null>(null);
  const [detailReceipts, setDetailReceipts] = useState<InvoiceReceiptDTO[]>([]);
  const [deletingReceiptId, setDeletingReceiptId] = useState<string | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data =
        filter === 'pending'
          ? await apiService.getInvoices({ pendingReceipt: true })
          : await apiService.getInvoices({ withReceipts: true });
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar notas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [filter]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [suppliersRes, itemsRes] = await Promise.all([
          apiService.getSuppliers(),
          apiService.getItems(),
        ]);
        setSuppliers(suppliersRes);
        setItems(itemsRes);
      } catch {
        // ignore
      }
    };
    loadLookups();
  }, []);

  const openReceiptModal = async (invoice: Invoice, fromDetailDialog = false) => {
    try {
      const full = await apiService.getInvoice(invoice.id);
      const receipts = await apiService.getInvoiceReceipts(invoice.id);
      setDetailInvoice(full);
      setInvoiceReceipts(receipts);
      if (fromDetailDialog) {
        setDetailReceipts(receipts);
      }
      const stockItems = full.items.filter((i) => (i as { goesToStock?: boolean }).goesToStock);
      setReceiptForm({
        receiptDate: full.issueDate.slice(0, 10),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao abrir nota');
    }
  };

  const openDetailDialog = async (invoice: Invoice) => {
    try {
      const full = await apiService.getInvoice(invoice.id);
      const receipts = await apiService.getInvoiceReceipts(invoice.id);
      setDetailViewInvoice(full);
      setDetailReceipts(receipts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao abrir detalhes');
    }
  };

  const handleDeleteReceipt = async (invoiceId: string, receiptId: string) => {
    try {
      setDeletingReceiptId(receiptId);
      await apiService.deleteInvoiceReceipt(invoiceId, receiptId);
      const receipts = await apiService.getInvoiceReceipts(invoiceId);
      setDetailReceipts(receipts);
      if (detailViewInvoice?.id === invoiceId) {
        const full = await apiService.getInvoice(invoiceId);
        setDetailViewInvoice(full);
      }
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir recebimento');
    } finally {
      setDeletingReceiptId(null);
    }
  };

  const openNewReceiptFromDetail = () => {
    if (detailViewInvoice) {
      openReceiptModal(detailViewInvoice, true);
    }
  };

  const handleCreateReceiptSuccess = async () => {
    if (detailInvoice && detailViewInvoice?.id === detailInvoice.id) {
      const receipts = await apiService.getInvoiceReceipts(detailInvoice.id);
      setDetailReceipts(receipts);
      const full = await apiService.getInvoice(detailInvoice.id);
      setDetailViewInvoice(full);
    }
    await loadInvoices();
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
      await handleCreateReceiptSuccess();
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
    const s = suppliers.find((x) => x.id === supplierId);
    return s ? (s.person?.nome ?? s.supplyCategories ?? s.id) : supplierId;
  };

  const getItemName = (itemId: string) => items.find((i) => i.id === itemId)?.name ?? itemId;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Recebimento de Produtos</h1>
          <p className="text-muted-foreground">
            {filter === 'pending'
              ? 'Notas fiscais com itens a receber no estoque. Clique em "Registrar recebimento" para dar entrada nos produtos.'
              : 'Notas fiscais que já possuem recebimentos. Clique em "Ver recebimentos" para editar ou excluir.'}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Label className="text-sm font-medium">Filtrar:</Label>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as ReceiptFilter)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">A receber</SelectItem>
                  <SelectItem value="with_receipts">Com recebimentos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <Package className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {loading ? (
              <p className="text-muted-foreground">Carregando notas...</p>
            ) : invoices.length === 0 ? (
              <p className="text-muted-foreground">
                {filter === 'pending'
                  ? 'Nenhuma nota com produtos a receber. Todas as notas com itens de estoque já foram totalmente recebidas.'
                  : 'Nenhuma nota com recebimentos registrados.'}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Número</th>
                      <th className="px-4 py-3 text-left font-medium">Série</th>
                      <th className="px-4 py-3 text-left font-medium">Emissão</th>
                      <th className="px-4 py-3 text-left font-medium">Fornecedor</th>
                      <th className="px-4 py-3 text-left font-medium">Itens</th>
                      <th className="px-4 py-3 text-right font-medium">Total itens</th>
                      <th className="px-4 py-3 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-3">{inv.number}</td>
                        <td className="px-4 py-3">{inv.series ?? '—'}</td>
                        <td className="px-4 py-3">{formatDate(inv.issueDate)}</td>
                        <td className="px-4 py-3">{getSupplierName(inv.supplierId)}</td>
                        <td className="px-4 py-3">{inv.items?.length ?? 0}</td>
                        <td className="px-4 py-3 text-right">
                          {inv.itemsTotal != null
                            ? formatCurrency(Number(inv.itemsTotal))
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {filter === 'pending' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openReceiptModal(inv)}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Registrar recebimento
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailDialog(inv)}
                            >
                              <ListChecks className="h-4 w-4 mr-1" />
                              Ver recebimentos
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail dialog: list receipts and allow delete / new receipt */}
        <Dialog
          open={detailViewInvoice !== null}
          onOpenChange={(open) => !open && setDetailViewInvoice(null)}
        >
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Recebimentos da nota</DialogTitle>
              <DialogDescription>
                {detailViewInvoice && (
                  <>
                    Nota {detailViewInvoice.number}
                    {detailViewInvoice.series ? ` - Série ${detailViewInvoice.series}` : ''} • Emissão:{' '}
                    {formatDate(detailViewInvoice.issueDate)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
              {detailReceipts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum recebimento registrado.</p>
              ) : (
                <ul className="space-y-3">
                  {detailReceipts.map((rec) => (
                    <li
                      key={rec.id}
                      className="flex items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <div>
                        <span className="font-medium">{formatDate(rec.receiptDate)}</span>
                        {rec.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{rec.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {rec.items.length} item(ns) •{' '}
                          {rec.items
                            .reduce((sum, i) => sum + i.quantityReceived, 0)
                            .toLocaleString('pt-BR')}{' '}
                          un.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingReceiptId === rec.id}
                        onClick={() =>
                          detailViewInvoice &&
                          window.confirm(
                            'Excluir este recebimento? O estoque será ajustado (saída).'
                          ) &&
                          handleDeleteReceipt(detailViewInvoice.id, rec.id)
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingReceiptId === rec.id ? 'Excluindo...' : 'Excluir'}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <DialogFooter className="flex-shrink-0 px-6 py-4 border-t">
              <Button variant="outline" onClick={() => setDetailViewInvoice(null)}>
                Fechar
              </Button>
              {detailViewInvoice && (
                <Button onClick={openNewReceiptFromDetail}>
                  <Package className="h-4 w-4 mr-1" />
                  Registrar novo recebimento
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Receipt Modal */}
        <Dialog open={isReceiptModalOpen} onOpenChange={(open) => !open && setIsReceiptModalOpen(false)}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Registrar recebimento</DialogTitle>
              <DialogDescription>
                {detailInvoice && (
                  <>
                    Nota {detailInvoice.number}
                    {detailInvoice.series ? ` - Série ${detailInvoice.series}` : ''} • Emissão:{' '}
                    {formatDate(detailInvoice.issueDate)}
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
              {receiptError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {receiptError}
                </div>
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
                    const alreadyReceived =
                      (invItem as { quantityReceivedTotal?: number }).quantityReceivedTotal ?? 0;
                    const max = Math.max(0, ordered - alreadyReceived);
                    return (
                      <div key={ri.invoiceItemId} className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="min-w-[140px] text-sm">
                            {getItemName(invItem.itemId)}
                          </span>
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
                              updateReceiptLineQty(
                                ri.invoiceItemId,
                                parseFloat(e.target.value) || 0
                              )
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
      </div>
    </Layout>
  );
};
