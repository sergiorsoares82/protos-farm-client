import { AuthProvider } from '@/contexts/AuthContext';
import { Dashboard } from '@/pages/Dashboard';
import { LoginPage } from '@/pages/LoginPage';
import { Persons } from '@/pages/Persons';
import { ClientsSuppliers } from '@/pages/ClientsSuppliers';
import { Products } from '@/pages/Products';
import { Settings } from '@/pages/Settings';
import { SuperAdmin } from '@/pages/SuperAdmin';
import { OrganizationSettings } from '@/pages/OrganizationSettings';
import { Users } from '@/pages/Users';
import { UsersSimple } from '@/pages/UsersSimple';
import { CostCenters } from '@/pages/CostCenters';
import { ManagementAccounts } from '@/pages/ManagementAccounts';
import { BankAccounts } from '@/pages/BankAccounts';
import { CostCenterCategories } from '@/pages/CostCenterCategories';
import { Fields } from '@/pages/Fields';
import { WorkLocationTypes } from '@/pages/WorkLocationTypes';
import { ActivityTypes } from '@/pages/ActivityTypes';
import { Operations } from '@/pages/Operations';
import { OperationRecords } from '@/pages/OperationRecords';
import { UnitOfMeasures } from '@/pages/UnitOfMeasures';
import { UnitOfMeasureConversions } from '@/pages/UnitOfMeasureConversions';
import { Seasons } from '@/pages/Seasons';
import { StockMovements } from '@/pages/StockMovements';
import { Invoices } from '@/pages/Invoices';
import { InvoiceFinancialsTypes } from '@/pages/InvoiceFinancialsTypes';
import { Revenues } from '@/pages/Revenues';
import { ProductReceipts } from '@/pages/ProductReceipts';
import { ProductShipments } from '@/pages/ProductShipments';
import { MachineTypes } from '@/pages/MachineTypes';
import { Machines } from '@/pages/Machines';
import { Assets } from '@/pages/Assets';
import { Funcionarios } from '@/pages/Funcionarios';
import { Proprietarios } from '@/pages/Proprietarios';
import { Fazendas } from '@/pages/Fazendas';
import { RuralProperties } from '@/pages/RuralProperties';
import { LandRegistries } from '@/pages/LandRegistries';
import { ProdutoresRurais } from '@/pages/ProdutoresRurais';
import { PermissionManagement } from '@/pages/PermissionManagement';
import { RoleManagement } from '@/pages/RoleManagement';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected application routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/persons"
            element={
              <ProtectedRoute>
                <Persons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funcionarios"
            element={
              <ProtectedRoute>
                <Funcionarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clients-suppliers"
            element={
              <ProtectedRoute>
                <ClientsSuppliers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtores"
            element={
              <ProtectedRoute>
                <Proprietarios />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fazendas"
            element={
              <ProtectedRoute>
                <Fazendas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rural-properties"
            element={
              <ProtectedRoute>
                <RuralProperties />
              </ProtectedRoute>
            }
          />
          <Route
            path="/land-registries"
            element={
              <ProtectedRoute>
                <LandRegistries />
              </ProtectedRoute>
            }
          />
          <Route
            path="/produtores-rurais"
            element={
              <ProtectedRoute>
                <ProdutoresRurais />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cost-centers"
            element={
              <ProtectedRoute>
                <CostCenters />
              </ProtectedRoute>
            }
          />
          <Route
            path="/management-accounts"
            element={
              <ProtectedRoute>
                <ManagementAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bank-accounts"
            element={
              <ProtectedRoute>
                <BankAccounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cost-center-categories"
            element={
              <ProtectedRoute>
                <CostCenterCategories />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fields"
            element={
              <ProtectedRoute>
                <Fields />
              </ProtectedRoute>
            }
          />
          <Route
            path="/work-location-types"
            element={
              <ProtectedRoute>
                <WorkLocationTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/activity-types"
            element={
              <ProtectedRoute>
                <ActivityTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operations"
            element={
              <ProtectedRoute>
                <Operations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operation-records"
            element={
              <ProtectedRoute>
                <OperationRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unit-of-measures"
            element={
              <ProtectedRoute>
                <UnitOfMeasures />
              </ProtectedRoute>
            }
          />
          <Route
            path="/unit-of-measure-conversions"
            element={
              <ProtectedRoute>
                <UnitOfMeasureConversions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seasons"
            element={
              <ProtectedRoute>
                <Seasons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/stock-movements"
            element={
              <ProtectedRoute>
                <StockMovements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoices"
            element={
              <ProtectedRoute>
                <Invoices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice-financials-types"
            element={
              <ProtectedRoute>
                <InvoiceFinancialsTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-receipts"
            element={
              <ProtectedRoute>
                <ProductReceipts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-shipments"
            element={
              <ProtectedRoute>
                <ProductShipments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/revenues"
            element={
              <ProtectedRoute>
                <Revenues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machine-types"
            element={
              <ProtectedRoute>
                <MachineTypes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machines"
            element={
              <ProtectedRoute>
                <Machines />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets"
            element={
              <ProtectedRoute>
                <Assets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users-debug"
            element={
              <ProtectedRoute>
                <UsersSimple />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organization"
            element={
              <ProtectedRoute>
                <OrganizationSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute>
                <SuperAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/permissions"
            element={
              <ProtectedRoute>
                <PermissionManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute>
                <RoleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
