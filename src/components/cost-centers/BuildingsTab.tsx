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
import { Card } from '@/components/ui/card';
import {
  apiService,
  CostCenter,
  CostCenterCategory,
  CostCenterType,
  CostCenterKindCategory,
  CreateBuildingWithCostCenterRequest,
} from '@/services/api';

interface BuildingsTabProps {
  kindCategory: CostCenterKindCategory;
}

export const BuildingsTab = ({ kindCategory }: BuildingsTabProps) => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [categories, setCategories] = useState<CostCenterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateBuildingWithCostCenterRequest>({
    code: '',
    name: '',
    description: '',
    type: CostCenterType.PRODUCTIVE,
    kindCategoryId: kindCategory.id,
  });

  useEffect(() => {
    loadData();
  }, [kindCategory.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [costCentersByKind, cats] = await Promise.all([
        apiService.getCostCentersByKindCategoryId(kindCategory.id),
        apiService.getCostCenterCategories(),
      ]);
      setCostCenters(costCentersByKind);
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
      await apiService.createBuildingWithCostCenter({ ...formData, kindCategoryId: kindCategory.id });
      setIsCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar benfeitoria');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: CostCenterType.PRODUCTIVE,
      kindCategoryId: kindCategory.id,
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
          {costCenters.length} benfeitoria(s) cadastrada(s)
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Benfeitoria
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
            <DialogTitle>Nova Benfeitoria</DialogTitle>
            <DialogDescription>
              Crie uma benfeitoria com seu centro de custo em uma única etapa
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Código (Sigla) *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: GAL001"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Galpão de Grãos"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="areaM2">Área (m²)</Label>
                <Input
                  id="areaM2"
                  type="number"
                  value={formData.areaM2 || ''}
                  onChange={(e) => setFormData({ ...formData, areaM2: Number(e.target.value) })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="landRegistry">Matrícula</Label>
                <Input
                  id="landRegistry"
                  value={formData.landRegistry || ''}
                  onChange={(e) => setFormData({ ...formData, landRegistry: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="locationDetails">Detalhes de Localização</Label>
              <Input
                id="locationDetails"
                value={formData.locationDetails || ''}
                onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                placeholder="Ex: Próximo à sede"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="constructionDate">Data de Construção</Label>
                <Input
                  id="constructionDate"
                  type="date"
                  value={formData.constructionDate || ''}
                  onChange={(e) => setFormData({ ...formData, constructionDate: e.target.value })}
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
              disabled={!formData.code || !formData.name || !formData.description}
            >
              Criar Benfeitoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
