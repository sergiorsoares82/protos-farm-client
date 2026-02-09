import { useState } from 'react';
import { Layout } from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Building2, FolderKanban } from 'lucide-react';
import { MachinesTab } from '@/components/cost-centers/MachinesTab';
import { BuildingsTab } from '@/components/cost-centers/BuildingsTab';
import { GeneralCostCentersTab } from '@/components/cost-centers/GeneralCostCentersTab';

export const CostCenterManagement = () => {
  const [activeTab, setActiveTab] = useState('machines');

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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="machines" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Máquinas
              </TabsTrigger>
              <TabsTrigger value="buildings" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Benfeitorias
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Gerais
              </TabsTrigger>
            </TabsList>

            <TabsContent value="machines" className="mt-6">
              <MachinesTab />
            </TabsContent>

            <TabsContent value="buildings" className="mt-6">
              <BuildingsTab />
            </TabsContent>

            <TabsContent value="general" className="mt-6">
              <GeneralCostCentersTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Layout>
  );
};
