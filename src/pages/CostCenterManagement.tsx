import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Building2, FolderKanban, BarChart3 } from 'lucide-react';
import { MachinesTab } from '@/components/cost-centers/MachinesTab';
import { BuildingsTab } from '@/components/cost-centers/BuildingsTab';
import { GeneralCostCentersTab } from '@/components/cost-centers/GeneralCostCentersTab';
import { CostStructureTab } from '@/components/cost-centers/CostStructureTab';
import { apiService, CostCenterKindCategory } from '@/services/api';

function kindCategoryIcon(type: string) {
  switch (type) {
    case 'machine':
      return <Truck className="h-4 w-4" />;
    case 'building':
      return <Building2 className="h-4 w-4" />;
    default:
      return <FolderKanban className="h-4 w-4" />;
  }
}

export const CostCenterManagement = () => {
  const [kindCategories, setKindCategories] = useState<CostCenterKindCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await apiService.getCostCenterKindCategories();
        const active = list.filter((c) => c.isActive);
        setKindCategories(active);
        if (active.length > 0 && !active.some((c) => c.id === activeTab)) {
          setActiveTab('tree');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha ao carregar categorias');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Layout>
        <Card className="mb-6">
          <CardContent className="py-8 text-center">Carregando...</CardContent>
        </Card>
      </Layout>
    );
  }

  if (error || kindCategories.length === 0) {
    return (
      <Layout>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gerenciamento de Centros de Custo</CardTitle>
            <CardDescription>
              {error || 'Nenhuma categoria de centro de custo cadastrada. Cadastre categorias em "Categorias de centros de custo".'}
            </CardDescription>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  const gridCols = Math.min(kindCategories.length + 1, 7);

  return (
    <Layout>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Gerenciamento de Centros de Custo</CardTitle>
          <CardDescription>
            Gerencie máquinas, benfeitorias e centros de custo gerais em um só lugar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList
              className="grid w-full"
              style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
            >
              <TabsTrigger value="tree" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Estrutura de custos
              </TabsTrigger>
              {kindCategories.map((kc) => (
                <TabsTrigger
                  key={kc.id}
                  value={kc.id}
                  className="flex items-center gap-2"
                >
                  {kindCategoryIcon(kc.type)}
                  {kc.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="tree" className="mt-6">
              <CostStructureTab />
            </TabsContent>

            {kindCategories.map((kindCategory) => {
              if (kindCategory.type === 'machine') {
                return (
                  <TabsContent
                    key={kindCategory.id}
                    value={kindCategory.id}
                    className="mt-6"
                  >
                    <MachinesTab kindCategory={kindCategory} />
                  </TabsContent>
                );
              }
              if (kindCategory.type === 'building') {
                return (
                  <TabsContent
                    key={kindCategory.id}
                    value={kindCategory.id}
                    className="mt-6"
                  >
                    <BuildingsTab kindCategory={kindCategory} />
                  </TabsContent>
                );
              }
              return (
                <TabsContent
                  key={kindCategory.id}
                  value={kindCategory.id}
                  className="mt-6"
                >
                  <GeneralCostCentersTab kindCategory={kindCategory} />
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </Layout>
  );
};
