import { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  apiService,
  Organization,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  DocumentType,
  CreateDocumentTypeRequest,
} from '@/services/api';
import { Search, Plus, Edit, Trash2, Building2, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useAuthorization } from '@/hooks/useAuthorization';

export const SuperAdmin = () => {
  const { isSuperAdmin } = useAuthorization();
  const location = useLocation();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeSearch, setDocTypeSearch] = useState('');
  
  // Determine which section to show based on URL hash
  const activeSection = location.hash === '#document-types' ? 'document-types' : 'organizations';
  
  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrg, setNewOrg] = useState<CreateOrganizationRequest>({
    name: '',
    slug: '',
  });
  
  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateOrganizationRequest>({});

  // Document type modal
  const [showCreateDocTypeModal, setShowCreateDocTypeModal] = useState(false);
  const [newDocType, setNewDocType] = useState<CreateDocumentTypeRequest>({
    name: '',
    group: '',
    hasAccessKey: false,
  });
  const [showEditDocTypeModal, setShowEditDocTypeModal] = useState(false);
  const [editingDocType, setEditingDocType] = useState<DocumentType | null>(null);
  const [editDocTypeForm, setEditDocTypeForm] = useState<CreateDocumentTypeRequest>({
    name: '',
    group: '',
    hasAccessKey: false,
  });

  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
      loadDocumentTypes();
    }
  }, [isSuperAdmin]);

  // Scroll to section when hash changes
  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location.hash]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getOrganizations();
      setOrganizations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentTypes = async () => {
    try {
      setError(null);
      const data = await apiService.getDocumentTypes();
      setDocumentTypes(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load document types');
    }
  };

  const handleCreateOrganization = async () => {
    try {
      await apiService.createOrganization(newOrg);
      setShowCreateModal(false);
      setNewOrg({ name: '', slug: '' });
      await loadOrganizations();
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    }
  };

  const handleCreateDocumentType = async () => {
    try {
      await apiService.createDocumentType(newDocType);
      setShowCreateDocTypeModal(false);
      setNewDocType({
        name: '',
        group: '',
        hasAccessKey: false,
      });
      await loadDocumentTypes();
    } catch (err: any) {
      setError(err.message || 'Failed to create document type');
    }
  };

  const openEditDocTypeModal = (docType: DocumentType) => {
    setEditingDocType(docType);
    setEditDocTypeForm({
      name: docType.name,
      group: docType.group,
      hasAccessKey: docType.hasAccessKey,
    });
    setShowEditDocTypeModal(true);
  };

  const handleUpdateDocumentType = async () => {
    if (!editingDocType) return;
    try {
      await apiService.updateDocumentType(editingDocType.id, editDocTypeForm);
      setShowEditDocTypeModal(false);
      setEditingDocType(null);
      await loadDocumentTypes();
    } catch (err: any) {
      setError(err.message || 'Failed to update document type');
    }
  };

  const handleDeleteDocumentType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document type?')) {
      return;
    }
    try {
      await apiService.deleteDocumentType(id);
      await loadDocumentTypes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete document type');
    }
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setEditFormData({
      name: org.name,
      slug: org.slug,
      isActive: org.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdateOrganization = async () => {
    if (!editingOrg) return;
    
    try {
      await apiService.updateOrganization(editingOrg.id, editFormData);
      setShowEditModal(false);
      setEditingOrg(null);
      setEditFormData({});
      await loadOrganizations();
    } catch (err: any) {
      setError(err.message || 'Failed to update organization');
    }
  };

  const handleDeleteOrganization = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiService.deleteOrganization(id);
      await loadOrganizations();
    } catch (err: any) {
      setError(err.message || 'Failed to delete organization');
    }
  };

  const handleSlugGeneration = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setNewOrg({ ...newOrg, slug });
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredDocumentTypes = documentTypes.filter((dt) =>
    dt.name.toLowerCase().includes(docTypeSearch.toLowerCase()),
  );

  if (!isSuperAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <div>
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Super Admin Panel</h1>
            <p className="text-gray-600 mt-2">Manage all organizations and platform settings</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
              <p className="text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                ×
              </button>
            </div>
          )}

          {/* Organizations Card */}
          {activeSection === 'organizations' && (
          <Card id="organizations">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Organizations</CardTitle>
                  <CardDescription>Manage all client organizations</CardDescription>
                </div>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Organization
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Organizations List */}
              {loading ? (
                <p className="text-center py-8 text-gray-500">Loading organizations...</p>
              ) : filteredOrganizations.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">No organizations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrganizations.map((org) => (
                    <div
                      key={org.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-gray-600" />
                            <div>
                              <h3 className="font-semibold text-lg">{org.name}</h3>
                              <p className="text-sm text-gray-600">
                                Slug: <span className="font-mono">{org.slug}</span>
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Created: {new Date(org.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2 mr-4">
                            {org.isActive ? (
                              <span className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="flex items-center text-red-600 text-sm">
                                <XCircle className="h-4 w-4 mr-1" />
                                Inactive
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(org)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteOrganization(org.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Document Types Card */}
          {activeSection === 'document-types' && (
          <Card id="document-types">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Types
                  </CardTitle>
                  <CardDescription>
                    Configure document types for income and expenses
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateDocTypeModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Document Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search document types..."
                  value={docTypeSearch}
                  onChange={(e) => setDocTypeSearch(e.target.value)}
                />
              </div>

              {filteredDocumentTypes.length === 0 ? (
                <p className="text-sm text-gray-500">No document types configured yet.</p>
              ) : (
                <div className="space-y-2">
                  {filteredDocumentTypes.map((dt) => (
                    <div
                      key={dt.id}
                      className="flex items-center justify-between border rounded-lg px-4 py-2"
                    >
                      <div>
                        <p className="font-medium">{dt.name}</p>
                        <p className="text-xs text-gray-500">
                          Group: {dt.group || 'N/A'} ·
                          {dt.hasAccessKey ? ' Requires access key' : ' No access key required'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDocTypeModal(dt)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteDocumentType(dt.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Create Organization Modal */}
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Add a new client organization to the platform
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    value={newOrg.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewOrg({ ...newOrg, name });
                      if (!newOrg.slug || newOrg.slug === '') {
                        handleSlugGeneration(name);
                      }
                    }}
                    placeholder="Acme Farm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org-slug">Slug</Label>
                  <Input
                    id="org-slug"
                    value={newOrg.slug}
                    onChange={(e) => setNewOrg({ ...newOrg, slug: e.target.value })}
                    placeholder="acme-farm"
                  />
                  <p className="text-sm text-gray-500">
                    Lowercase letters, numbers, and hyphens only
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowCreateModal(false);
                  setNewOrg({ name: '', slug: '' });
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateOrganization}
                  disabled={!newOrg.name || !newOrg.slug}
                >
                  Create Organization
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Document Type Modal */}
          <Dialog open={showCreateDocTypeModal} onOpenChange={setShowCreateDocTypeModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Document Type</DialogTitle>
                <DialogDescription>
                  Define a document type for income or expenses
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="doc-type-name">Name</Label>
                  <Input
                    id="doc-type-name"
                    value={newDocType.name}
                    onChange={(e) => setNewDocType({ ...newDocType, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="doc-type-group">Group</Label>
                  <Input
                    id="doc-type-group"
                    value={newDocType.group}
                    onChange={(e) =>
                      setNewDocType({
                        ...newDocType,
                        group: e.target.value,
                      })
                    }
                    placeholder="e.g., Income, Expense, Tax, etc."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="doc-type-access-key"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={newDocType.hasAccessKey}
                    onChange={(e) =>
                      setNewDocType({ ...newDocType, hasAccessKey: e.target.checked })
                    }
                  />
                  <Label htmlFor="doc-type-access-key" className="text-sm">
                    Requires access key (NF-e like documents)
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDocTypeModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDocumentType} disabled={!newDocType.name.trim()}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Document Type Modal */}
          <Dialog open={showEditDocTypeModal} onOpenChange={setShowEditDocTypeModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Document Type</DialogTitle>
                <DialogDescription>Update document type details</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-doc-type-name">Name</Label>
                  <Input
                    id="edit-doc-type-name"
                    value={editDocTypeForm.name}
                    onChange={(e) =>
                      setEditDocTypeForm({ ...editDocTypeForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-doc-type-group">Group</Label>
                  <Input
                    id="edit-doc-type-group"
                    value={editDocTypeForm.group}
                    onChange={(e) =>
                      setEditDocTypeForm({
                        ...editDocTypeForm,
                        group: e.target.value,
                      })
                    }
                    placeholder="e.g., Income, Expense, Tax, etc."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="edit-doc-type-access-key"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={editDocTypeForm.hasAccessKey}
                    onChange={(e) =>
                      setEditDocTypeForm({
                        ...editDocTypeForm,
                        hasAccessKey: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="edit-doc-type-access-key" className="text-sm">
                    Requires access key (NF-e like documents)
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDocTypeModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateDocumentType} disabled={!editDocTypeForm.name.trim()}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Organization Modal */}
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Organization</DialogTitle>
                <DialogDescription>
                  Update organization details
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Organization Name</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-slug">Slug</Label>
                  <Input
                    id="edit-slug"
                    value={editFormData.slug || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-active"
                    checked={editFormData.isActive ?? true}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="edit-active">Organization is active</Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowEditModal(false);
                  setEditingOrg(null);
                  setEditFormData({});
                }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateOrganization}>
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </Layout>
  );
};
