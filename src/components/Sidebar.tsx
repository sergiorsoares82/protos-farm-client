import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Home,
  Users,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Shield,
  UserCog,
  FileText,
  ChevronDown,
  ChevronRight,
  Wallet,
  PiggyBank,
  Tags,
  MapPin,
  CalendarRange,
  Truck,
  Box,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/services/api';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[] | 'all';
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: Home, roles: 'all' },
  { name: 'Persons', path: '/persons', icon: Users, roles: 'all' },
  { name: 'Products', path: '/products', icon: Package, roles: 'all' },
  { name: 'Cost Centers', path: '/cost-centers', icon: Wallet, roles: 'all' },
  { name: 'Management Accounts', path: '/management-accounts', icon: PiggyBank, roles: 'all' },
  { name: 'Locais de Trabalho', path: '/fields', icon: MapPin, roles: 'all' },
  {
    name: 'Tipos de local de trabalho',
    path: '/work-location-types',
    icon: Tags,
    roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  },
  { name: 'Seasons (Safras)', path: '/seasons', icon: CalendarRange, roles: 'all' },
  { name: 'Machine Types', path: '/machine-types', icon: Truck, roles: 'all' },
  { name: 'Machines (Máquinas)', path: '/machines', icon: Truck, roles: 'all' },
  { name: 'Patrimônio (Ativos)', path: '/assets', icon: Box, roles: 'all' },
  {
    name: 'Cost Center Categories',
    path: '/cost-center-categories',
    icon: Tags,
    roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  },
  { name: 'User Management', path: '/users', icon: UserCog, roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN] },
  { name: 'Organization', path: '/organization', icon: Building2, roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN] },
  { name: 'Super Admin', path: '/super-admin', icon: Shield, roles: [UserRole.SUPER_ADMIN] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: 'all' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter navigation items based on user role
  const visibleNavItems = navItems.filter((item) => {
    if (item.roles === 'all') return true;
    if (!item.roles) return true;
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });

  // For super admins, we'll render Organization + Super Admin under a collapsible section,
  // so exclude them from the main flat list. For other roles, keep them as-is.
  const mainNavItems = visibleNavItems.filter((item) => {
    if (
      user?.role === UserRole.SUPER_ADMIN &&
      (item.path === '/organization' || item.path === '/super-admin')
    ) {
      return false;
    }
    return true;
  });

  const isSuperAdminSectionActive = location.pathname === '/super-admin';

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-center h-16 border-b px-6">
            <h1 className="text-xl font-bold text-primary">Protos Farm</h1>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Super Admin collapsible section */}
            {user?.role === UserRole.SUPER_ADMIN && (
              <div className="mt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => setIsSuperAdminOpen((open) => !open)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isSuperAdminSectionActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Shield className="h-5 w-5" />
                    <span>Super Admin</span>
                  </span>
                  {isSuperAdminOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {isSuperAdminOpen && (
                  <div className="mt-1 space-y-1 pl-8">
                    <Link
                      to="/super-admin#organizations"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                        location.pathname === '/super-admin' &&
                          (location.hash === '#organizations' || location.hash === '')
                          ? 'bg-primary/90 text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      Organizations
                    </Link>
                    <Link
                      to="/super-admin#document-types"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                        location.pathname === '/super-admin' &&
                          location.hash === '#document-types'
                          ? 'bg-primary/90 text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      Document Type
                    </Link>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
