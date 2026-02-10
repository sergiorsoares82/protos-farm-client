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
  CreateCostCenterRequest,
} from '@/services/api';

interface GeneralCostCentersTabProps {
  kindCategory: CostCenterKindCategory;
}

export const GeneralCostCentersTab = ({ kindCategory }: GeneralCostCentersTabProps) => {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [categories, setCategories] = useState<CostCenterCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [formData, setFormData] = useState<CreateCostCenterRequest>({
    code: '',
    description: '',
    kindCategoryId: kindCategory.id,
    type: CostCenterType.ADMINISTRATIVE,
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
      await apiService.createCostCenter({ ...formData, kindCategoryId: kindCategory.id });
      setIsCreateDialogOpen(false);
      resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar centro de custo');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      kindCategoryId: kindCategory.id,
      type: CostCenterType.ADMINISTRATIVE,
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
          {costCenters.length} centro(s) de custo geral(is) cadastrado(s)
        </p>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Centro de Custo
        </Button>
      </div>

      <div className="grid gap-4">
        {costCenters.map((cc) => (
          <Card key={cc.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-semibold">{cc.name || cc.description}</h3>
                <p className="text-sm text-muted-foreground">Código: {cc.code}</p>
                <p className="text-sm text-muted-foreground">Tipo: {cc.type}</p>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Centro de Custo Geral</DialogTitle>
            <DialogDescription>
              Crie um centro de custo para fins administrativos ou compartilhados
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Código (Sigla) *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Ex: ADM001"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Administrativo"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do centro de custo"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as CostCenterType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CostCenterType.PRODUCTIVE}>Produtivo</SelectItem>
                  <SelectItem value={CostCenterType.ADMINISTRATIVE}>Administrativo</SelectItem>
                  <SelectItem value={CostCenterType.SHARED}>Compartilhado</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={handleCreate} disabled={!formData.code || !formData.description}>
              Criar Centro de Custo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
