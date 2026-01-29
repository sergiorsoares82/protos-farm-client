import { AuthProvider } from '@/contexts/AuthContext';
import { Dashboard } from '@/pages/Dashboard';
import { LoginPage } from '@/pages/LoginPage';
import { Persons } from '@/pages/Persons';
import { Products } from '@/pages/Products';
import { Settings } from '@/pages/Settings';
import { SuperAdmin } from '@/pages/SuperAdmin';
import { OrganizationSettings } from '@/pages/OrganizationSettings';
import { Users } from '@/pages/Users';
import { UsersSimple } from '@/pages/UsersSimple';
import { CostCenters } from '@/pages/CostCenters';
import { ManagementAccounts } from '@/pages/ManagementAccounts';
import { CostCenterCategories } from '@/pages/CostCenterCategories';
import { Fields } from '@/pages/Fields';
import { Seasons } from '@/pages/Seasons';
import { MachineTypes } from '@/pages/MachineTypes';
import { Machines } from '@/pages/Machines';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <Router>
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
            path="/seasons"
            element={
              <ProtectedRoute>
                <Seasons />
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
