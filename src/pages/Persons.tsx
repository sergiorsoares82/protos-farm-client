import { useState, useEffect, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Search,
  Loader2,
  Eye,
  UserPlus,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react';
import {
  apiService,
  Person,
  PersonRole,
  CreatePersonRequest,
  UpdatePersonRequest,
} from '@/services/api';

const ITEMS_PER_PAGE = 10;

export const Persons = () => {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoleType, setSelectedRoleType] = useState<PersonRole | ''>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  // Field-level errors for better UX
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Role form state for creation
  const [createRoleType, setCreateRoleType] = useState<PersonRole>(PersonRole.CLIENT);
  const [createRoleData, setCreateRoleData] = useState<Record<string, any>>({});

  // Role form state for assignment
  const [roleFormData, setRoleFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPersons();
      setPersons(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load persons');
      console.error('Error loading persons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async () => {
    try {
      setFormError(null);
      setFieldErrors({});
      
      console.log('=== CREATE PERSON DEBUG ===');
      console.log('Form Data:', formData);
      console.log('Role Type:', createRoleType);
      console.log('Role Data:', createRoleData);
      
      const errors: Record<string, string> = {};
      
      // Validate basic information first
      if (!formData.firstName.trim()) {
        errors.firstName = 'First Name is required';
      }
      if (!formData.lastName.trim()) {
        errors.lastName = 'Last Name is required';
      }
      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          errors.email = 'Please enter a valid email address (e.g., john.doe@example.com)';
        } else if (formData.email.includes('..')) {
          errors.email = 'Email cannot contain consecutive dots (..)';
        }
      }
      
      // Validate role data based on type
      let roleData: any = { ...createRoleData };
      
      // Ensure required fields are present based on role type
      if (createRoleType === PersonRole.SUPPLIER) {
        if (!roleData.companyName) {
          errors.companyName = 'Company Name is required for Supplier';
        }
        if (!roleData.taxId) {
          errors.taxId = 'Tax ID is required for Supplier';
        }
      } else if (createRoleType === PersonRole.WORKER) {
        console.log('Validating Worker fields:', {
          position: roleData.position,
          hireDate: roleData.hireDate,
          employmentType: roleData.employmentType
        });
        if (!roleData.position) {
          errors.position = 'Position is required for Worker';
        }
        if (!roleData.hireDate) {
          errors.hireDate = 'Hire Date is required for Worker';
        }
        if (!roleData.employmentType) {
          errors.employmentType = 'Employment Type is required for Worker';
        }
      } else if (createRoleType === PersonRole.FARM_OWNER) {
        if (!roleData.farmName) {
          errors.farmName = 'Farm Name is required for Farm Owner';
        }
      }
      // CLIENT role has no required fields, so empty object is fine
      
      // If there are any errors, display them
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setFormError('Please fix the errors below');
        return;
      }
      
      const newPerson: CreatePersonRequest = {
        ...formData,
        roles: [
          {
            type: createRoleType,
            data: roleData,
          },
        ],
      };
      
      console.log('Sending person data:', JSON.stringify(newPerson, null, 2));
      
      await apiService.createPerson(newPerson);
      await loadPersons();
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      console.error('Error creating person:', err);
      setFormError(err.message || 'Failed to create person');
    }
  };

  const handleUpdatePerson = async () => {
    if (!selectedPerson) return;
    
    try {
      setError(null);
      const updates: UpdatePersonRequest = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
      };
      await apiService.updatePerson(selectedPerson.id, updates);
      await loadPersons();
      setShowEditModal(false);
      setSelectedPerson(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update person');
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (!confirm('Are you sure you want to delete this person?')) return;
    
    try {
      setError(null);
      await apiService.deletePerson(id);
      await loadPersons();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to delete person');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} person(s)?`)) return;

    try {
      setBulkLoading(true);
      setError(null);
      await Promise.all(Array.from(selectedIds).map((id) => apiService.deletePerson(id)));
      await loadPersons();
      setSelectedIds(new Set());
    } catch (err: any) {
      setError(err.message || 'Failed to delete persons');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedPerson || !selectedRoleType) return;

    try {
      setError(null);
      await apiService.assignRole(selectedPerson.id, selectedRoleType, roleFormData);
      await loadPersons();
      setShowRoleModal(false);
      setSelectedRoleType('');
      setRoleFormData({});
    } catch (err: any) {
      setError(err.message || 'Failed to assign role');
    }
  };

  const handleRemoveRole = async (personId: string, role: PersonRole) => {
    if (!confirm(`Are you sure you want to remove the ${role} role?`)) return;

    try {
      setError(null);
      await apiService.removeRole(personId, role);
      await loadPersons();
    } catch (err: any) {
      setError(err.message || 'Failed to remove role');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Roles', 'Created At'];
    const csvData = filteredAndSortedPersons.map((person) => [
      person.id,
      person.firstName,
      person.lastName,
      person.email,
      person.phone || '',
      Object.keys(person.roles).join('; '),
      new Date(person.createdAt).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `persons-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    });
    setCreateRoleType(PersonRole.CLIENT);
    setCreateRoleData({});
    setFieldErrors({});
    setFormError(null);
  };

  const startEdit = (person: Person) => {
    setSelectedPerson(person);
    setFormData({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone || '',
    });
    setShowEditModal(true);
  };

  const openRoleModal = (person: Person) => {
    setSelectedPerson(person);
    setShowRoleModal(true);
  };

  const openDetailsModal = (person: Person) => {
    setSelectedPerson(person);
    setShowDetailsModal(true);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedPersons.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPersons.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Filtering and sorting
  const filteredAndSortedPersons = useMemo(() => {
    let filtered = persons.filter((person) => {
      const matchesSearch =
        person.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        roleFilter === 'all' || Object.keys(person.roles).includes(roleFilter);

      return matchesSearch && matchesRole;
    });

    return filtered;
  }, [persons, searchTerm, roleFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPersons.length / ITEMS_PER_PAGE);
  const paginatedPersons = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredAndSortedPersons.slice(start, end);
  }, [filteredAndSortedPersons, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const getRoleBadges = (roles: Record<string, any>) => {
    const roleKeys = Object.keys(roles);
    return roleKeys.map((role) => (
      <span
        key={role}
        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
      >
        {role.replace('_', ' ')}
      </span>
    ));
  };

  const getRoleForm = () => {
    if (!selectedRoleType) return null;

    switch (selectedRoleType) {
      case PersonRole.CLIENT:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={roleFormData.companyName || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, companyName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={roleFormData.taxId || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, taxId: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredPaymentMethod">Preferred Payment Method</Label>
              <Input
                id="preferredPaymentMethod"
                value={roleFormData.preferredPaymentMethod || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, preferredPaymentMethod: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit</Label>
              <Input
                id="creditLimit"
                type="number"
                value={roleFormData.creditLimit || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, creditLimit: parseFloat(e.target.value) })
                }
              />
            </div>
          </div>
        );

      case PersonRole.SUPPLIER:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                required
                value={roleFormData.companyName || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, companyName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID *</Label>
              <Input
                id="taxId"
                required
                value={roleFormData.taxId || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, taxId: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplyCategories">Supply Categories</Label>
              <Input
                id="supplyCategories"
                value={roleFormData.supplyCategories || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, supplyCategories: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                value={roleFormData.paymentTerms || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, paymentTerms: e.target.value })
                }
              />
            </div>
          </div>
        );

      case PersonRole.WORKER:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                required
                value={roleFormData.position || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, position: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date *</Label>
              <Input
                id="hireDate"
                type="date"
                required
                value={roleFormData.hireDate || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, hireDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Hourly Rate</Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={roleFormData.hourlyRate || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, hourlyRate: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type *</Label>
              <Select
                value={roleFormData.employmentType || ''}
                onValueChange={(value) =>
                  setRoleFormData({ ...roleFormData, employmentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="SEASONAL">Seasonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case PersonRole.FARM_OWNER:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name *</Label>
              <Input
                id="farmName"
                required
                value={roleFormData.farmName || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, farmName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmLocation">Farm Location</Label>
              <Input
                id="farmLocation"
                value={roleFormData.farmLocation || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, farmLocation: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalArea">Total Area (hectares)</Label>
              <Input
                id="totalArea"
                type="number"
                step="0.01"
                value={roleFormData.totalArea || ''}
                onChange={(e) =>
                  setRoleFormData({ ...roleFormData, totalArea: parseFloat(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownershipType">Ownership Type</Label>
              <Select
                value={roleFormData.ownershipType || ''}
                onValueChange={(value) =>
                  setRoleFormData({ ...roleFormData, ownershipType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNED">Owned</SelectItem>
                  <SelectItem value="LEASED">Leased</SelectItem>
                  <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Persons</h1>
            <p className="text-muted-foreground">
              Manage clients, suppliers, workers, and farm owners
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Person
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setError(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search persons by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="CLIENT">Clients</SelectItem>
              <SelectItem value="SUPPLIER">Suppliers</SelectItem>
              <SelectItem value="WORKER">Workers</SelectItem>
              <SelectItem value="FARM_OWNER">Farm Owners</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <Card className="bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedIds.size} person(s) selected
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Selected
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Form (keeping this inline for now, or we can move to modal too) */}
        {showEditModal && (
          <Card>
            <CardHeader>
              <CardTitle>Edit Person</CardTitle>
              <CardDescription>
                Update the person information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedPerson(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdatePerson}>
                  Update Person
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Persons List */}
        <div className="grid gap-4">
          {paginatedPersons.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || roleFilter !== 'all'
                    ? 'No persons found matching your filters'
                    : 'No persons yet. Click "Add Person" to create one.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Checkbox
                      checked={
                        selectedIds.size === paginatedPersons.length &&
                        paginatedPersons.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>
                </CardContent>
              </Card>
              {paginatedPersons.map((person) => (
                <Card key={person.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedIds.has(person.id)}
                        onCheckedChange={() => toggleSelect(person.id)}
                      />
                      <div className="flex-1 space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold">{person.fullName}</h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {getRoleBadges(person.roles)}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {person.email}
                          </div>
                          {person.phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {person.phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetailsModal(person)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRoleModal(person)}
                          title="Manage roles"
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(person)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePerson(person.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedPersons.length)} of{' '}
                  {filteredAndSortedPersons.length} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                      )
                      .map((page, idx, arr) => (
                        <>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span key={`ellipsis-${page}`} className="px-2">
                              ...
                            </span>
                          )}
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Persons</p>
                <p className="text-2xl font-bold">{persons.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">
                  {persons.filter((p) => p.roles.CLIENT).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suppliers</p>
                <p className="text-2xl font-bold">
                  {persons.filter((p) => p.roles.SUPPLIER).length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Workers</p>
                <p className="text-2xl font-bold">
                  {persons.filter((p) => p.roles.WORKER).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPerson?.fullName}</DialogTitle>
            <DialogDescription>Detailed person information</DialogDescription>
          </DialogHeader>
          {selectedPerson && (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">First Name</p>
                    <p className="text-sm">{selectedPerson.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                    <p className="text-sm">{selectedPerson.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{selectedPerson.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <p className="text-sm">{selectedPerson.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">ID</p>
                    <p className="text-sm font-mono text-xs">{selectedPerson.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(selectedPerson.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="roles" className="space-y-4">
                {Object.entries(selectedPerson.roles).map(([role, data]) => (
                  <Card key={role}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {role.replace('_', ' ')}
                        </CardTitle>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            handleRemoveRole(selectedPerson.id, role as PersonRole)
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
                {Object.keys(selectedPerson.roles).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    No roles assigned
                  </p>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Person Modal */}
      <Dialog open={showCreateModal} onOpenChange={(open) => {
        setShowCreateModal(open);
        if (!open) {
          // Clear form-specific errors when closing the modal
          setFormError(null);
          setFieldErrors({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b">
            <DialogTitle>Create New Person</DialogTitle>
            <DialogDescription>
              Fill in all required fields below (* indicates required)
            </DialogDescription>
          </DialogHeader>
          
          {/* Error Message (form only) */}
          {formError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{formError}</p>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900">📋 Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="modal-firstName" className="text-sm font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-firstName"
                      placeholder="Enter first name"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (fieldErrors.firstName) {
                          setFieldErrors({ ...fieldErrors, firstName: '' });
                        }
                      }}
                      required
                      autoFocus
                      className={fieldErrors.firstName ? 'border-red-500 focus-visible:ring-red-500' : 'border-blue-300'}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modal-lastName" className="text-sm font-medium">
                      Last Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="modal-lastName"
                      placeholder="Enter last name"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (fieldErrors.lastName) {
                          setFieldErrors({ ...fieldErrors, lastName: '' });
                        }
                      }}
                      required
                      className={fieldErrors.lastName ? 'border-red-500 focus-visible:ring-red-500' : 'border-blue-300'}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-email" className="text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="modal-email"
                    type="email"
                    placeholder="person@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (fieldErrors.email) {
                        setFieldErrors({ ...fieldErrors, email: '' });
                      }
                    }}
                    required
                    className={fieldErrors.email ? 'border-red-500 focus-visible:ring-red-500' : 'border-blue-300'}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠️</span> {fieldErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modal-phone" className="text-sm font-medium">Phone (optional)</Label>
                  <Input
                    id="modal-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="border-blue-300"
                  />
                </div>
              </div>

              {/* Role Configuration */}
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-sm font-semibold text-green-900">👔 Initial Role *</h3>
                <div className="space-y-2">
                  <Label>Role Type</Label>
                  <Select
                    value={createRoleType}
                    onValueChange={(value) => {
                      setCreateRoleType(value as PersonRole);
                      setCreateRoleData({});
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PersonRole.CLIENT}>Client</SelectItem>
                      <SelectItem value={PersonRole.SUPPLIER}>Supplier</SelectItem>
                      <SelectItem value={PersonRole.WORKER}>Worker</SelectItem>
                      <SelectItem value={PersonRole.FARM_OWNER}>Farm Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {createRoleType === PersonRole.CLIENT && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      All fields are optional for Client role
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="modal-companyName">Company Name</Label>
                      <Input
                        id="modal-companyName"
                        value={createRoleData.companyName || ''}
                        onChange={(e) =>
                          setCreateRoleData({ ...createRoleData, companyName: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modal-taxId">Tax ID</Label>
                      <Input
                        id="modal-taxId"
                        value={createRoleData.taxId || ''}
                        onChange={(e) =>
                          setCreateRoleData({ ...createRoleData, taxId: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
                {createRoleType === PersonRole.SUPPLIER && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="modal-companyName">Company Name *</Label>
                      <Input
                        id="modal-companyName"
                        required
                        value={createRoleData.companyName || ''}
                        onChange={(e) => {
                          setCreateRoleData({ ...createRoleData, companyName: e.target.value });
                          if (fieldErrors.companyName) {
                            setFieldErrors({ ...fieldErrors, companyName: '' });
                          }
                        }}
                        className={fieldErrors.companyName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {fieldErrors.companyName && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠️</span> {fieldErrors.companyName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modal-taxId">Tax ID *</Label>
                      <Input
                        id="modal-taxId"
                        required
                        value={createRoleData.taxId || ''}
                        onChange={(e) => {
                          setCreateRoleData({ ...createRoleData, taxId: e.target.value });
                          if (fieldErrors.taxId) {
                            setFieldErrors({ ...fieldErrors, taxId: '' });
                          }
                        }}
                        className={fieldErrors.taxId ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {fieldErrors.taxId && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠️</span> {fieldErrors.taxId}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {createRoleType === PersonRole.WORKER && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="modal-position">Position *</Label>
                      <Input
                        id="modal-position"
                        placeholder="e.g., Manager, Field Worker"
                        required
                        value={createRoleData.position || ''}
                        onChange={(e) => {
                          setCreateRoleData({ ...createRoleData, position: e.target.value });
                          if (fieldErrors.position) {
                            setFieldErrors({ ...fieldErrors, position: '' });
                          }
                        }}
                        className={fieldErrors.position ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {fieldErrors.position && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠️</span> {fieldErrors.position}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modal-hireDate">Hire Date *</Label>
                      <Input
                        id="modal-hireDate"
                        type="date"
                        required
                        value={createRoleData.hireDate || ''}
                        onChange={(e) => {
                          setCreateRoleData({ ...createRoleData, hireDate: e.target.value });
                          if (fieldErrors.hireDate) {
                            setFieldErrors({ ...fieldErrors, hireDate: '' });
                          }
                        }}
                        className={fieldErrors.hireDate ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {fieldErrors.hireDate && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠️</span> {fieldErrors.hireDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modal-employmentType">Employment Type *</Label>
                      <Select
                        value={createRoleData.employmentType || ''}
                        onValueChange={(value) => {
                          setCreateRoleData({ ...createRoleData, employmentType: value });
                          if (fieldErrors.employmentType) {
                            setFieldErrors({ ...fieldErrors, employmentType: '' });
                          }
                        }}
                      >
                        <SelectTrigger className={fieldErrors.employmentType ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="SEASONAL">Seasonal</SelectItem>
                        </SelectContent>
                      </Select>
                      {fieldErrors.employmentType && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠️</span> {fieldErrors.employmentType}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {createRoleType === PersonRole.FARM_OWNER && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="modal-farmName">Farm Name *</Label>
                      <Input
                        id="modal-farmName"
                        placeholder="e.g., Green Valley Farm"
                        required
                        value={createRoleData.farmName || ''}
                        onChange={(e) => {
                          setCreateRoleData({ ...createRoleData, farmName: e.target.value });
                          if (fieldErrors.farmName) {
                            setFieldErrors({ ...fieldErrors, farmName: '' });
                          }
                        }}
                        className={fieldErrors.farmName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {fieldErrors.farmName && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <span>⚠️</span> {fieldErrors.farmName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="modal-farmLocation">Farm Location</Label>
                      <Input
                        id="modal-farmLocation"
                        placeholder="e.g., Springfield, IL"
                        value={createRoleData.farmLocation || ''}
                        onChange={(e) =>
                          setCreateRoleData({ ...createRoleData, farmLocation: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t bg-background shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePerson}>
              Create Person
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Assignment Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Add a new role to {selectedPerson?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Role Type</Label>
              <Select
                value={selectedRoleType}
                onValueChange={(value) => {
                  setSelectedRoleType(value as PersonRole);
                  setRoleFormData({});
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PersonRole.CLIENT}>Client</SelectItem>
                  <SelectItem value={PersonRole.SUPPLIER}>Supplier</SelectItem>
                  <SelectItem value={PersonRole.WORKER}>Worker</SelectItem>
                  <SelectItem value={PersonRole.FARM_OWNER}>Farm Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {getRoleForm()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRoleModal(false);
                setSelectedRoleType('');
                setRoleFormData({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignRole} disabled={!selectedRoleType}>
              Assign Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};
