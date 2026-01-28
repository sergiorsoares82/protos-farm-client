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
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Temporarily unprotected for development */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/persons" element={<Persons />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cost-centers" element={<CostCenters />} />
          <Route path="/management-accounts" element={<ManagementAccounts />} />
          <Route path="/cost-center-categories" element={<CostCenterCategories />} />
          <Route path="/fields" element={<Fields />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users-debug" element={<UsersSimple />} />
          <Route path="/organization" element={<OrganizationSettings />} />
          <Route path="/super-admin" element={<SuperAdmin />} />
          <Route path="/settings" element={<Settings />} />

          {/* To re-protect, wrap routes with ProtectedRoute:
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
