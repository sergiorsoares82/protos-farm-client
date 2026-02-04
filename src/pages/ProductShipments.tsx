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
  InvoiceShipmentDTO,
  CreateInvoiceShipmentRequest,
  Item,
  Supplier,
} from '@/services/api';

type ShipmentFilter = 'pending' | 'with_shipments';

export const ProductShipments = () => {
  const [filter, setFilter] = useState<ShipmentFilter>('pending');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
  const [, setInvoiceShipments] = useState<InvoiceShipmentDTO[]>([]);
  const [shipmentError, setShipmentError] = useState<string | null>(null);

  const [detailViewInvoice, setDetailViewInvoice] = useState<Invoice | null>(null);
  const [detailShipments, setDetailShipments] = useState<InvoiceShipmentDTO[]>([]);
  const [deletingShipmentId, setDeletingShipmentId] = useState<string | null>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data =
        filter === 'pending'
          ? await apiService.getInvoices({ pendingShipment: true })
          : await apiService.getInvoices({ withShipments: true });
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

  const openShipmentModal = async (invoice: Invoice, fromDetailDialog = false) => {
    try {
      const full = await apiService.getInvoice(invoice.id);
      const shipments = await apiService.getInvoiceShipments(invoice.id);
      setDetailInvoice(full);
      setInvoiceShipments(shipments);
      if (fromDetailDialog) {
        setDetailShipments(shipments);
      }
      const stockItems = full.items.filter((i) => (i as { goesToStock?: boolean }).goesToStock);
      setShipmentForm({
        shipmentDate: full.issueDate.slice(0, 10),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao abrir nota');
    }
  };

  const openDetailDialog = async (invoice: Invoice) => {
    try {
      const full = await apiService.getInvoice(invoice.id);
      const shipments = await apiService.getInvoiceShipments(invoice.id);
      setDetailViewInvoice(full);
      setDetailShipments(shipments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao abrir detalhes');
    }
  };

  const handleDeleteShipment = async (invoiceId: string, shipmentId: string) => {
    try {
      setDeletingShipmentId(shipmentId);
      await apiService.deleteInvoiceShipment(invoiceId, shipmentId);
      const shipments = await apiService.getInvoiceShipments(invoiceId);
      setDetailShipments(shipments);
      if (detailViewInvoice?.id === invoiceId) {
        const full = await apiService.getInvoice(invoiceId);
        setDetailViewInvoice(full);
      }
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao excluir saída');
    } finally {
      setDeletingShipmentId(null);
    }
  };

  const openNewShipmentFromDetail = () => {
    if (detailViewInvoice) {
      openShipmentModal(detailViewInvoice, true);
    }
  };

  const handleCreateShipmentSuccess = async () => {
    if (detailInvoice && detailViewInvoice?.id === detailInvoice.id) {
      const shipments = await apiService.getInvoiceShipments(detailInvoice.id);
      setDetailShipments(shipments);
      const full = await apiService.getInvoice(detailInvoice.id);
      setDetailViewInvoice(full);
    }
    await loadInvoices();
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
      await handleCreateShipmentSuccess();
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
    const s = suppliers.find((x) => x.id === supplierId);
    return s ? (s.person?.nome ?? s.supplyCategories ?? s.id) : supplierId;
  };

  const getItemName = (itemId: string) => items.find((i) => i.id === itemId)?.name ?? itemId;

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Saída de Produtos</h1>
          <p className="text-muted-foreground">
            {filter === 'pending'
              ? 'Notas fiscais de venda (receitas) com itens a entregar. Clique em "Registrar saída" para dar baixa no estoque (movimento tipo Venda).'
              : 'Notas fiscais de venda que já possuem saídas. Clique em "Ver saídas" para editar ou excluir.'}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Label className="text-sm font-medium">Filtrar:</Label>
              <Select
                value={filter}
                onValueChange={(v) => setFilter(v as ShipmentFilter)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">A entregar</SelectItem>
                  <SelectItem value="with_shipments">Com saídas</SelectItem>
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
                  ? 'Nenhuma nota de venda com produtos a entregar.'
                  : 'Nenhuma nota com saídas registradas.'}
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
                              onClick={() => openShipmentModal(inv)}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Registrar saída
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => openDetailDialog(inv)}
                            >
                              <ListChecks className="h-4 w-4 mr-1" />
                              Ver saídas
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

        {/* Detail dialog: list shipments and allow delete / new shipment */}
        <Dialog
          open={detailViewInvoice !== null}
          onOpenChange={(open) => !open && setDetailViewInvoice(null)}
        >
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Saídas da nota</DialogTitle>
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
              {detailShipments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma saída registrada.</p>
              ) : (
                <ul className="space-y-3">
                  {detailShipments.map((sh) => (
                    <li
                      key={sh.id}
                      className="flex items-center justify-between gap-4 rounded-lg border p-3"
                    >
                      <div>
                        <span className="font-medium">{formatDate(sh.shipmentDate)}</span>
                        {sh.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5">{sh.notes}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {sh.items.length} item(ns) •{' '}
                          {sh.items
                            .reduce((sum, i) => sum + i.quantityShipped, 0)
                            .toLocaleString('pt-BR')}{' '}
                          un.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingShipmentId === sh.id}
                        onClick={() =>
                          detailViewInvoice &&
                          window.confirm(
                            'Excluir esta saída? O estoque será ajustado (entrada de ajuste).'
                          ) &&
                          handleDeleteShipment(detailViewInvoice.id, sh.id)
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingShipmentId === sh.id ? 'Excluindo...' : 'Excluir'}
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
                <Button onClick={openNewShipmentFromDetail}>
                  <Package className="h-4 w-4 mr-1" />
                  Registrar nova saída
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Shipment Modal */}
        <Dialog open={isShipmentModalOpen} onOpenChange={(open) => !open && setIsShipmentModalOpen(false)}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
            <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
              <DialogTitle>Registrar saída de produtos</DialogTitle>
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
              {shipmentError && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {shipmentError}
                </div>
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
                    const alreadyShipped =
                      (invItem as { quantityShippedTotal?: number }).quantityShippedTotal ?? 0;
                    const max = Math.max(0, ordered - alreadyShipped);
                    return (
                      <div key={ri.invoiceItemId} className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="min-w-[140px] text-sm">
                            {getItemName(invItem.itemId)}
                          </span>
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
                              updateShipmentLineQty(
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
      </div>
    </Layout>
  );
};
