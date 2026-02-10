import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import {
  apiService,
  CostCenter,
  Machine,
  MachineType,
  CostCenterCategory,
  CostCenterType,
  CostCenterKindCategory,
  CreateMachineWithCostCenterRequest,
} from '@/services/api';

interface MachinesTabProps {
  kindCategory: CostCenterKindCategory;
}

export const MachinesTab = ({ kindCategory }: MachinesTabProps) => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [machineTypes, setMachineTypes] = useState<MachineType[]>([]);
  const [categories, setCategories] = useState<CostCenterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateMachineWithCostCenterRequest>({
    code: '',
    name: '',
    description: '',
    type: CostCenterType.PRODUCTIVE,
    kindCategoryId: kindCategory.id,
    machineTypeId: '',
  });

  useEffect(() => {
    loadData();
  }, [kindCategory.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [costCentersByKind, types, cats] = await Promise.all([
        apiService.getCostCentersByKindCategoryId(kindCategory.id),
        apiService.getMachineTypes(),
        apiService.getCostCenterCategories(),
      ]);
      setCostCenters(costCentersByKind);
      setMachineTypes(types.filter((t) => t.isActive));
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setError(null);
      await apiService.createMachineWithCostCenter({ ...formData, kindCategoryId: kindCategory.id });
      setIsCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar máquina');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: CostCenterType.PRODUCTIVE,
      kindCategoryId: kindCategory.id,
      machineTypeId: '',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {costCenters.length} máquina(s) cadastrada(s)
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Máquina
        </Button>
      </div>

      <div className="grid gap-4">
        {costCenters.map((cc) => (
          <Card key={cc.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-semibold">{cc.name || cc.description}</h3>
                <p className="text-sm text-muted-foreground">Código: {cc.code}</p>
                {cc.acquisitionValue && (
                  <p className="text-sm">
                    Valor: R$ {cc.acquisitionValue.toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Máquina</DialogTitle>
            <DialogDescription>
              Crie uma máquina com seu centro de custo em uma única etapa
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Código (Sigla) *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: TRA001"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Trator John Deere 6110"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição detalhada"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="machineType">Tipo de Máquina *</Label>
              <Select
                value={formData.machineTypeId}
                onValueChange={(value) => setFormData({ ...formData, machineTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {machineTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="Ex: John Deere"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ex: 6110"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serialNumber">Número de Série</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber || ''}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="horimeterInitial">Horímetro Inicial</Label>
                <Input
                  id="horimeterInitial"
                  type="number"
                  value={formData.horimeterInitial || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, horimeterInitial: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="powerHp">Potência (CV)</Label>
                <Input
                  id="powerHp"
                  type="number"
                  value={formData.powerHp || ''}
                  onChange={(e) => setFormData({ ...formData, powerHp: Number(e.target.value) })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="fuelType">Tipo de Combustível</Label>
                <Select
                  value={formData.fuelType || ''}
                  onValueChange={(value) => setFormData({ ...formData, fuelType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIESEL">Diesel</SelectItem>
                    <SelectItem value="GASOLINE">Gasolina</SelectItem>
                    <SelectItem value="ELECTRIC">Elétrico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="acquisitionDate">Data de Aquisição</Label>
                <Input
                  id="acquisitionDate"
                  type="date"
                  value={formData.acquisitionDate || ''}
                  onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="acquisitionValue">Valor de Aquisição (R$)</Label>
                <Input
                  id="acquisitionValue"
                  type="number"
                  value={formData.acquisitionValue || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, acquisitionValue: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.categoryId || ''}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.code || !formData.name || !formData.machineTypeId}
            >
              Criar Máquina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
