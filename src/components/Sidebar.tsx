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
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Wallet,
  PiggyBank,
  Landmark,
  Banknote,
  Tags,
  MapPin,
  CalendarRange,
  Truck,
  Box,
  Ruler,
  Repeat,
  Sprout,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/services/api';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[] | 'all';
}

const farmMenuItems: NavItem[] = [
  {
    name: 'Cadastro de Fazenda',
    path: '/fazendas',
    icon: MapPin,
    roles: 'all',
  },
  {
    name: 'Imóveis rurais',
    path: '/rural-properties',
    icon: Landmark,
    roles: 'all',
  },
  {
    name: 'Matrículas',
    path: '/land-registries',
    icon: FileText,
    roles: 'all',
  },
  {
    name: 'Produtores rurais',
    path: '/produtores-rurais',
    icon: Building2,
    roles: 'all',
  },
];

const peopleMenuItems: NavItem[] = [
  { name: 'Persons', path: '/persons', icon: Users, roles: 'all' },
  { name: 'Clientes e Fornecedores', path: '/clients-suppliers', icon: Building2, roles: 'all' },
  { name: 'Proprietários', path: '/proprietarios', icon: Sprout, roles: 'all' },
  { name: 'Usuários', path: '/users', icon: UserCog, roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN] },
];

const productsMenuItems: NavItem[] = [
  { name: 'Products', path: '/products', icon: Package, roles: 'all' },
  {
    name: 'Unidades de medida',
    path: '/unit-of-measures',
    icon: Ruler,
    roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  },
  {
    name: 'Conversões de medida',
    path: '/unit-of-measure-conversions',
    icon: Repeat,
    roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  },
];

const agricultureMenuItems: NavItem[] = [
  { name: 'Locais de Trabalho', path: '/fields', icon: MapPin, roles: 'all' },
  {
    name: 'Tipos de local de trabalho',
    path: '/work-location-types',
    icon: Tags,
    roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  },
  { name: 'Seasons (Safras)', path: '/seasons', icon: CalendarRange, roles: 'all' },
];

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: Home, roles: 'all' },
  { name: 'Cost Centers', path: '/cost-centers', icon: Wallet, roles: 'all' },
  { name: 'Management Accounts', path: '/management-accounts', icon: PiggyBank, roles: 'all' },
  { name: 'Contas bancárias', path: '/bank-accounts', icon: Landmark, roles: 'all' },
  { name: 'Movimentos de Estoque', path: '/stock-movements', icon: ArrowLeftRight, roles: 'all' },
  { name: 'Despesas', path: '/invoices', icon: FileText, roles: 'all' },
  {
    name: 'Tipos de pagamento',
    path: '/invoice-financials-types',
    icon: Banknote,
    roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  },
  { name: 'Recebimento de Produtos', path: '/product-receipts', icon: Package, roles: 'all' },
  { name: 'Saída de Produtos', path: '/product-shipments', icon: Truck, roles: 'all' },
  { name: 'Receitas', path: '/revenues', icon: FileText, roles: 'all' },
  { name: 'Machine Types', path: '/machine-types', icon: Truck, roles: 'all' },
  { name: 'Machines (Máquinas)', path: '/machines', icon: Truck, roles: 'all' },
  { name: 'Patrimônio (Ativos)', path: '/assets', icon: Box, roles: 'all' },
  {
    name: 'Cost Center Categories',
    path: '/cost-center-categories',
    icon: Tags,
    roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN],
  },
  { name: 'Organization', path: '/organization', icon: Building2, roles: [UserRole.SUPER_ADMIN, UserRole.ORG_ADMIN] },
  { name: 'Super Admin', path: '/super-admin', icon: Shield, roles: [UserRole.SUPER_ADMIN] },
  { name: 'Settings', path: '/settings', icon: Settings, roles: 'all' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);
  // Um único estado: qual seção está aberta. Ao clicar num link dentro da seção, não alteramos; só fechamos ao abrir outra.
  type SectionKey = 'farm' | 'people' | 'products' | 'agriculture';
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>(null);

  // Manter a seção aberta quando a rota pertence a ela (ex.: navegar entre Persons e Funcionários)
  useEffect(() => {
    if (farmMenuItems.some((i) => location.pathname === i.path)) setExpandedSection('farm');
    else if (peopleMenuItems.some((i) => location.pathname === i.path)) setExpandedSection('people');
    else if (productsMenuItems.some((i) => location.pathname === i.path)) setExpandedSection('products');
    else if (agricultureMenuItems.some((i) => location.pathname === i.path)) setExpandedSection('agriculture');
  }, [location.pathname]);

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
  // so exclude them from the main flat list. Exclude people, products and agriculture menu items (rendered in groups).
  const farmPaths = farmMenuItems.map((i) => i.path);
  const peoplePaths = peopleMenuItems.map((i) => i.path);
  const productsPaths = productsMenuItems.map((i) => i.path);
  const agriculturePaths = agricultureMenuItems.map((i) => i.path);
  const mainNavItems = visibleNavItems.filter((item) => {
    if (farmPaths.includes(item.path)) return false;
    if (peoplePaths.includes(item.path)) return false;
    if (productsPaths.includes(item.path)) return false;
    if (agriculturePaths.includes(item.path)) return false;
    if (
      user?.role === UserRole.SUPER_ADMIN &&
      (item.path === '/organization' || item.path === '/super-admin')
    ) {
      return false;
    }
    return true;
  });

  const visibleFarmItems = farmMenuItems.filter((item) => {
    if (item.roles === 'all') return true;
    if (!item.roles) return true;
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });
  const isFarmSectionActive = farmPaths.some((path) => location.pathname === path);

  const visiblePeopleItems = peopleMenuItems.filter((item) => {
    if (item.roles === 'all') return true;
    if (!item.roles) return true;
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });
  const isPeopleSectionActive = peoplePaths.some((path) => location.pathname === path);

  const visibleProductsItems = productsMenuItems.filter((item) => {
    if (item.roles === 'all') return true;
    if (!item.roles) return true;
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });
  const isProductsSectionActive = productsPaths.some((path) => location.pathname === path);

  const visibleAgricultureItems = agricultureMenuItems.filter((item) => {
    if (item.roles === 'all') return true;
    if (!item.roles) return true;
    if (!user?.role) return false;
    return item.roles.includes(user.role);
  });
  const isAgricultureSectionActive = agriculturePaths.some((path) => location.pathname === path);

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
                <div key={item.path}>
                  <Link
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
                  {item.path === '/dashboard' && visibleFarmItems.length > 0 && (
                    <div className="mt-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => setExpandedSection((s) => (s === 'farm' ? null : 'farm'))}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isFarmSectionActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Building2 className="h-5 w-5" />
                          <span>Fazenda</span>
                        </span>
                        {expandedSection === 'farm' ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedSection === 'farm' && (
                        <div className="mt-1 space-y-1 pl-8">
                          {visibleFarmItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                                  isSubActive
                                    ? 'bg-primary/90 text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <SubIcon className="h-4 w-4" />
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Menu Pessoas: Persons, Funcionários, Clientes e Fornecedores */}
                  {item.path === '/dashboard' && visiblePeopleItems.length > 0 && (
                    <div className="mt-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => setExpandedSection((s) => (s === 'people' ? null : 'people'))}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isPeopleSectionActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Users className="h-5 w-5" />
                          <span>Pessoas</span>
                        </span>
                        {expandedSection === 'people' ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedSection === 'people' && (
                        <div className="mt-1 space-y-1 pl-8">
                          {visiblePeopleItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                                  isSubActive
                                    ? 'bg-primary/90 text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <SubIcon className="h-4 w-4" />
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Menu Produtos: Products, Unidades de medida, Conversões de medida */}
                  {item.path === '/dashboard' && visibleProductsItems.length > 0 && (
                    <div className="mt-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => setExpandedSection((s) => (s === 'products' ? null : 'products'))}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isProductsSectionActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Package className="h-5 w-5" />
                          <span>Produtos</span>
                        </span>
                        {expandedSection === 'products' ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedSection === 'products' && (
                        <div className="mt-1 space-y-1 pl-8">
                          {visibleProductsItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                                  isSubActive
                                    ? 'bg-primary/90 text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <SubIcon className="h-4 w-4" />
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Menu Agricultura: Locais de trabalho, Tipos de local de trabalho, Safras */}
                  {item.path === '/dashboard' && visibleAgricultureItems.length > 0 && (
                    <div className="mt-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => setExpandedSection((s) => (s === 'agriculture' ? null : 'agriculture'))}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          isAgricultureSectionActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <Sprout className="h-5 w-5" />
                          <span>Agricultura</span>
                        </span>
                        {expandedSection === 'agriculture' ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedSection === 'agriculture' && (
                        <div className="mt-1 space-y-1 pl-8">
                          {visibleAgricultureItems.map((subItem) => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname === subItem.path;
                            return (
                              <Link
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                                  isSubActive
                                    ? 'bg-primary/90 text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                              >
                                <SubIcon className="h-4 w-4" />
                                {subItem.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
                    <Link
                      to="/super-admin#stock-movement-types"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                        location.pathname === '/super-admin' &&
                          location.hash === '#stock-movement-types'
                          ? 'bg-primary/90 text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                      Tipos de movimento de estoque
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
