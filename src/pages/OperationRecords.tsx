import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { operationRecordService } from '@/services/operationRecordService';
import { apiService } from '@/services/api';
import type {
  OperationRecord,
  CreateOperationRecordRequest,
  UpdateOperationRecordRequest,
  OperationRecordWorkerDTO,
  OperationRecordProductDTO,
  Operation,
  MachineItem,
  Asset,
  CostCenter,
  Item,
  UnitOfMeasure,
} from '@/services/api';
import { ClipboardList, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface Field {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

interface Worker {
  id: string;
  personId: string;
  position: string;
  person?: {
    name: string;
  };
}

export const OperationRecords = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<OperationRecord | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Reference data
  const [operations, setOperations] = useState<Operation[]>([]);
  const [machines, setMachines] = useState<MachineItem[]>([]);
  const [availableImplements, setAvailableImplements] = useState<Asset[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [products, setProducts] = useState<Item[]>([]);
  const [unitOfMeasures, setUnitOfMeasures] = useState<UnitOfMeasure[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateOperationRecordRequest>({
    serviceDate: new Date().toISOString().split('T')[0],
    operationId: '',
    machineId: '',
    horimeterStart: 0,
    horimeterEnd: 0,
    implementId: '',
    fieldId: '',
    costCenterId: '',
    notes: '',
    workers: [],
    products: [],
  });

  // Dynamic form arrays
  const [formWorkers, setFormWorkers] = useState<OperationRecordWorkerDTO[]>([]);
  const [formProducts, setFormProducts] = useState<OperationRecordProductDTO[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadOperationRecords(),
        loadReferenceData(),
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadOperationRecords = async () => {
    const data = await operationRecordService.getAllOperationRecords();
    setOperationRecords(data);
  };

  const loadReferenceData = async () => {
    const [ops, machs, assets, flds, ccs, wrks, prods, units] = await Promise.all([
      apiService.getOperations(),
      apiService.getMachines(),
      apiService.getAssets(),
      apiService.getFields() as Promise<Field[]>,
      apiService.getCostCenters(),
      apiService.getWorkers() as Promise<Worker[]>,
      apiService.getItems('PRODUCT'),
      apiService.getUnitOfMeasures(),
    ]);

    setOperations(ops.filter(o => o.isActive));
    setMachines(machs.filter(m => m.isActive));
    setAvailableImplements(assets.filter(a => a.assetKind === 'IMPLEMENT' && a.isActive));
    setFields(flds.filter(f => f.isActive));
    setCostCenters(ccs.filter(cc => cc.isActive));
    setWorkers(wrks);
    setProducts(prods.filter(p => p.isActive));
    setUnitOfMeasures(units.filter(u => u.isActive));
  };

  const validateForm = (): string | null => {
    if (!formData.serviceDate) return 'Service date is required';
    if (!formData.operationId) return 'Operation is required';
    if (!formData.machineId) return 'Machine is required';
    if (!formData.fieldId) return 'Field is required';
    if (!formData.costCenterId) return 'Cost center is required';
    if (formData.horimeterStart < 0) return 'Horimeter start must be 0 or greater';
    if (formData.horimeterEnd <= formData.horimeterStart) {
      return 'Horimeter end must be greater than horimeter start';
    }
    if (formWorkers.length === 0) return 'At least one worker is required';
    
    // Validate workers
    for (const worker of formWorkers) {
      if (!worker.workerId) return 'Worker is required for all worker entries';
      if (!worker.startTime) return 'Start time is required for all workers';
      if (!worker.endTime) return 'End time is required for all workers';
      if (worker.endTime <= worker.startTime) {
        return 'End time must be after start time for all workers';
      }
    }

    // Validate products
    for (const product of formProducts) {
      if (!product.productId) return 'Product is required for all product entries';
      if (!product.unitOfMeasureId) return 'Unit of measure is required for all products';
      if (product.quantity <= 0) return 'Quantity must be greater than 0 for all products';
    }

    return null;
  };

  const handleCreate = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const dataToSend: CreateOperationRecordRequest = {
        ...formData,
        workers: formWorkers,
        products: formProducts,
      };

      await operationRecordService.createOperationRecord(dataToSend);

      setSuccess('Operation record created successfully');
      setShowCreateDialog(false);
      resetForm();
      await loadOperationRecords();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create operation record');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRecord) return;

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const dataToSend: UpdateOperationRecordRequest = {
        serviceDate: formData.serviceDate,
        operationId: formData.operationId,
        machineId: formData.machineId,
        horimeterStart: formData.horimeterStart,
        horimeterEnd: formData.horimeterEnd,
        implementId: formData.implementId || null,
        fieldId: formData.fieldId,
        costCenterId: formData.costCenterId,
        notes: formData.notes || null,
        workers: formWorkers,
        products: formProducts,
      };

      await operationRecordService.updateOperationRecord(selectedRecord.id, dataToSend);

      setSuccess('Operation record updated successfully');
      setShowEditDialog(false);
      setSelectedRecord(null);
      resetForm();
      await loadOperationRecords();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update operation record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    try {
      setSaving(true);
      setError(null);

      await operationRecordService.deleteOperationRecord(selectedRecord.id);

      setSuccess('Operation record deleted successfully');
      setShowDeleteDialog(false);
      setSelectedRecord(null);
      await loadOperationRecords();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete operation record');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      serviceDate: new Date().toISOString().split('T')[0],
      operationId: '',
      machineId: '',
      horimeterStart: 0,
      horimeterEnd: 0,
      implementId: '',
      fieldId: '',
      costCenterId: '',
      notes: '',
      workers: [],
      products: [],
    });
    setFormWorkers([]);
    setFormProducts([]);
  };

  const openCreateDialog = () => {
    resetForm();
    setError(null);
    setShowCreateDialog(true);
  };

  const openEditDialog = (record: OperationRecord) => {
    setSelectedRecord(record);
    setFormData({
      serviceDate: record.serviceDate.split('T')[0],
      operationId: record.operationId,
      machineId: record.machineId,
      horimeterStart: record.horimeterStart,
      horimeterEnd: record.horimeterEnd,
      implementId: record.implementId || '',
      fieldId: record.fieldId,
      costCenterId: record.costCenterId,
      notes: record.notes || '',
      workers: [],
      products: [],
    });
    setFormWorkers(record.workers.map(w => ({
      workerId: w.workerId,
      startTime: w.startTime,
      endTime: w.endTime,
    })));
    setFormProducts(record.products.map(p => ({
      productId: p.productId,
      quantity: p.quantity,
      unitOfMeasureId: p.unitOfMeasureId,
    })));
    setError(null);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (record: OperationRecord) => {
    setSelectedRecord(record);
    setShowDeleteDialog(true);
  };

  // Worker management functions
  const addWorker = () => {
    setFormWorkers([...formWorkers, { workerId: '', startTime: '08:00', endTime: '17:00' }]);
  };

  const removeWorker = (index: number) => {
    setFormWorkers(formWorkers.filter((_, i) => i !== index));
  };

  const updateWorker = (index: number, field: keyof OperationRecordWorkerDTO, value: string) => {
    const updated = [...formWorkers];
    updated[index] = { ...updated[index], [field]: value };
    setFormWorkers(updated);
  };

  // Product management functions
  const addProduct = () => {
    setFormProducts([...formProducts, { productId: '', quantity: 0, unitOfMeasureId: '' }]);
  };

  const removeProduct = (index: number) => {
    setFormProducts(formProducts.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof OperationRecordProductDTO, value: string | number) => {
    const updated = [...formProducts];
    updated[index] = { ...updated[index], [field]: value };
    setFormProducts(updated);
  };

  const getOperationName = (id: string) => {
    const op = operations.find(o => o.id === id);
    return op ? `${op.code} - ${op.description}` : id;
  };

  const getMachineName = (id: string) => {
    const m = machines.find(m => m.id === id);
    return m ? m.name : id;
  };

  const getFieldName = (id: string) => {
    const f = fields.find(f => f.id === id);
    return f ? `${f.code} - ${f.name}` : id;
  };

  const getWorkerName = (id: string) => {
    const w = workers.find(w => w.id === id);
    return w && w.person ? w.person.name : id;
  };

  const getProductName = (id: string) => {
    const p = products.find(p => p.id === id);
    return p ? p.name : id;
  };

  const getUnitName = (id: string) => {
    const u = unitOfMeasures.find(u => u.id === id);
    return u ? u.code : id;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ClipboardList className="h-8 w-8" />
              Apontamentos de Operações
            </h1>
            <p className="text-gray-600 mt-1">
              Registre operações realizadas com máquinas, funcionários e produtos
            </p>
          </div>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Apontamento
          </Button>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Operation Records List */}
        <Card>
          <CardHeader>
            <CardTitle>Apontamentos</CardTitle>
            <CardDescription>
              {operationRecords.length} apontamento(s) registrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Data</th>
                    <th className="text-left p-3 font-semibold">Operação</th>
                    <th className="text-left p-3 font-semibold">Máquina</th>
                    <th className="text-left p-3 font-semibold">Horímetro</th>
                    <th className="text-left p-3 font-semibold">Talhão</th>
                    <th className="text-left p-3 font-semibold">Funcionários</th>
                    <th className="text-left p-3 font-semibold">Produtos</th>
                    <th className="text-right p-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {operationRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {new Date(record.serviceDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3 text-sm">{getOperationName(record.operationId)}</td>
                      <td className="p-3">{getMachineName(record.machineId)}</td>
                      <td className="p-3">
                        {record.horimeterStart} → {record.horimeterEnd}
                        <span className="text-gray-500 text-sm ml-1">
                          ({(record.horimeterEnd - record.horimeterStart).toFixed(2)}h)
                        </span>
                      </td>
                      <td className="p-3 text-sm">{getFieldName(record.fieldId)}</td>
                      <td className="p-3 text-sm">{record.workers.length}</td>
                      <td className="p-3 text-sm">{record.products.length}</td>
                      <td className="p-3">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(record)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {operationRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum apontamento registrado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Apontamento de Operação</DialogTitle>
              <DialogDescription>
                Registre uma nova operação realizada
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* General Data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Dados Gerais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="serviceDate">Data do Serviço *</Label>
                    <Input
                      id="serviceDate"
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="operationId">Operação *</Label>
                    <Select value={formData.operationId} onValueChange={(value) => setFormData({ ...formData, operationId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma operação" />
                      </SelectTrigger>
                      <SelectContent>
                        {operations.map(op => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.code} - {op.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="machineId">Máquina *</Label>
                    <Select value={formData.machineId} onValueChange={(value) => setFormData({ ...formData, machineId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma máquina" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="implementId">Implemento</Label>
                    <Select value={formData.implementId} onValueChange={(value) => setFormData({ ...formData, implementId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um implemento (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {availableImplements.map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="horimeterStart">Horímetro Inicial *</Label>
                    <DecimalInput
                      id="horimeterStart"
                      value={formData.horimeterStart.toString()}
                      onChange={(value) => setFormData({ ...formData, horimeterStart: parseFloat(value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="horimeterEnd">Horímetro Final *</Label>
                    <DecimalInput
                      id="horimeterEnd"
                      value={formData.horimeterEnd.toString()}
                      onChange={(value) => setFormData({ ...formData, horimeterEnd: parseFloat(value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fieldId">Talhão *</Label>
                    <Select value={formData.fieldId} onValueChange={(value) => setFormData({ ...formData, fieldId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um talhão" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.code} - {f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="costCenterId">Centro de Custo *</Label>
                    <Select value={formData.costCenterId} onValueChange={(value) => setFormData({ ...formData, costCenterId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um centro de custo" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map(cc => (
                          <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações sobre a operação"
                    rows={3}
                  />
                </div>
              </div>

              {/* Workers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Funcionários *</h3>
                  <Button type="button" onClick={addWorker} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Funcionário
                  </Button>
                </div>
                <div className="space-y-3">
                  {formWorkers.map((worker, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Funcionário</Label>
                        <Select value={worker.workerId} onValueChange={(value) => updateWorker(index, 'workerId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {workers.map(w => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.person?.name || w.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Label>Hora Início</Label>
                        <Input
                          type="time"
                          value={worker.startTime}
                          onChange={(e) => updateWorker(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="w-32">
                        <Label>Hora Fim</Label>
                        <Input
                          type="time"
                          value={worker.endTime}
                          onChange={(e) => updateWorker(index, 'endTime', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeWorker(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formWorkers.length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum funcionário adicionado</p>
                  )}
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Produtos Utilizados</h3>
                  <Button type="button" onClick={addProduct} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Produto
                  </Button>
                </div>
                <div className="space-y-3">
                  {formProducts.map((product, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Produto</Label>
                        <Select value={product.productId} onValueChange={(value) => updateProduct(index, 'productId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-40">
                        <Label>Quantidade</Label>
                        <DecimalInput
                          value={product.quantity.toString()}
                          onChange={(value) => updateProduct(index, 'quantity', parseFloat(value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-32">
                        <Label>Unidade</Label>
                        <Select value={product.unitOfMeasureId} onValueChange={(value) => updateProduct(index, 'unitOfMeasureId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOfMeasures.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.code}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeProduct(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formProducts.length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum produto adicionado</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? 'Salvando...' : 'Criar Apontamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog - Same structure as Create */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Apontamento de Operação</DialogTitle>
              <DialogDescription>
                Atualize as informações da operação
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Same form as Create Dialog */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Dados Gerais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-serviceDate">Data do Serviço *</Label>
                    <Input
                      id="edit-serviceDate"
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-operationId">Operação *</Label>
                    <Select value={formData.operationId} onValueChange={(value) => setFormData({ ...formData, operationId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma operação" />
                      </SelectTrigger>
                      <SelectContent>
                        {operations.map(op => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.code} - {op.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-machineId">Máquina *</Label>
                    <Select value={formData.machineId} onValueChange={(value) => setFormData({ ...formData, machineId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma máquina" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-implementId">Implemento</Label>
                    <Select value={formData.implementId} onValueChange={(value) => setFormData({ ...formData, implementId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um implemento (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {availableImplements.map(i => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-horimeterStart">Horímetro Inicial *</Label>
                    <DecimalInput
                      id="edit-horimeterStart"
                      value={formData.horimeterStart.toString()}
                      onChange={(value) => setFormData({ ...formData, horimeterStart: parseFloat(value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-horimeterEnd">Horímetro Final *</Label>
                    <DecimalInput
                      id="edit-horimeterEnd"
                      value={formData.horimeterEnd.toString()}
                      onChange={(value) => setFormData({ ...formData, horimeterEnd: parseFloat(value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-fieldId">Talhão *</Label>
                    <Select value={formData.fieldId} onValueChange={(value) => setFormData({ ...formData, fieldId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um talhão" />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map(f => (
                          <SelectItem key={f.id} value={f.id}>{f.code} - {f.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-costCenterId">Centro de Custo *</Label>
                    <Select value={formData.costCenterId} onValueChange={(value) => setFormData({ ...formData, costCenterId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um centro de custo" />
                      </SelectTrigger>
                      <SelectContent>
                        {costCenters.map(cc => (
                          <SelectItem key={cc.id} value={cc.id}>{cc.code} - {cc.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-notes">Observações</Label>
                  <Textarea
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações sobre a operação"
                    rows={3}
                  />
                </div>
              </div>

              {/* Workers Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Funcionários *</h3>
                  <Button type="button" onClick={addWorker} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Funcionário
                  </Button>
                </div>
                <div className="space-y-3">
                  {formWorkers.map((worker, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Funcionário</Label>
                        <Select value={worker.workerId} onValueChange={(value) => updateWorker(index, 'workerId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {workers.map(w => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.person?.name || w.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-32">
                        <Label>Hora Início</Label>
                        <Input
                          type="time"
                          value={worker.startTime}
                          onChange={(e) => updateWorker(index, 'startTime', e.target.value)}
                        />
                      </div>
                      <div className="w-32">
                        <Label>Hora Fim</Label>
                        <Input
                          type="time"
                          value={worker.endTime}
                          onChange={(e) => updateWorker(index, 'endTime', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeWorker(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formWorkers.length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum funcionário adicionado</p>
                  )}
                </div>
              </div>

              {/* Products Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Produtos Utilizados</h3>
                  <Button type="button" onClick={addProduct} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Produto
                  </Button>
                </div>
                <div className="space-y-3">
                  {formProducts.map((product, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Produto</Label>
                        <Select value={product.productId} onValueChange={(value) => updateProduct(index, 'productId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-40">
                        <Label>Quantidade</Label>
                        <DecimalInput
                          value={product.quantity.toString()}
                          onChange={(value) => updateProduct(index, 'quantity', parseFloat(value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-32">
                        <Label>Unidade</Label>
                        <Select value={product.unitOfMeasureId} onValueChange={(value) => updateProduct(index, 'unitOfMeasureId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {unitOfMeasures.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.code}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeProduct(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {formProducts.length === 0 && (
                    <p className="text-gray-500 text-sm">Nenhum produto adicionado</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este apontamento? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving ? 'Excluindo...' : 'Excluir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
