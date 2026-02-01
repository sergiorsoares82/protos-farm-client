import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiService, Organization, UpdateOrganizationRequest, DocumentType, CreateDocumentTypeRequest } from '@/services/api';
import { Building2, Save, CheckCircle, XCircle, Users, FileText, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuthorization } from '@/hooks/useAuthorization';

export const OrganizationSettings = () => {
  const { canManageOwnOrganization, hasAdminAccess } = useAuthorization();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<UpdateOrganizationRequest>({});
  
  // Document type modals
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
  const [docTypeSearch, setDocTypeSearch] = useState('');

  useEffect(() => {
    loadOrganization();
    if (hasAdminAccess) {
      loadDocumentTypes();
    }
  }, [hasAdminAccess]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMyOrganization();
      setOrganization(data);
      setFormData({
        name: data.name,
        slug: data.slug,
        isActive: data.isActive,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;
    
    try {
      setError(null);
      setSuccess(null);
      await apiService.updateOrganization(organization.id, formData);
      setSuccess('Organization updated successfully');
      setIsEditing(false);
      await loadOrganization();
    } catch (err: any) {
      setError(err.message || 'Failed to update organization');
    }
  };

  const handleCancel = () => {
    if (organization) {
      setFormData({
        name: organization.name,
        slug: organization.slug,
        isActive: organization.isActive,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const loadDocumentTypes = async () => {
    try {
      setError(null);
      const data = await apiService.getDocumentTypes();
      // Filtrar apenas tipos da organização (não tipos do sistema)
      setDocumentTypes(data.filter((dt) => !dt.isSystem));
    } catch (err: any) {
      setError(err.message || 'Failed to load document types');
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
      setSuccess('Document type created successfully');
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
      setSuccess('Document type updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update document type');
    }
  };

  const handleDeleteDocumentType = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de documento?')) {
      return;
    }
    try {
      await apiService.deleteDocumentType(id);
      await loadDocumentTypes();
      setSuccess('Document type deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete document type');
    }
  };

  const filteredDocumentTypes = documentTypes.filter((dt) =>
    dt.name.toLowerCase().includes(docTypeSearch.toLowerCase()) ||
    dt.group.toLowerCase().includes(docTypeSearch.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
            <p className="text-gray-600 mt-2">Manage your organization details and preferences</p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start justify-between">
              <p className="text-red-800">{error}</p>
              <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between">
              <p className="text-green-800">{success}</p>
              <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
                ×
              </button>
            </div>
          )}

          {loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-gray-500">Loading organization details...</p>
              </CardContent>
            </Card>
          ) : !organization ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-red-600">Failed to load organization</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Organization Details */}
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-6 w-6 text-gray-600" />
                      <div>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>Basic information about your organization</CardDescription>
                      </div>
                    </div>
                    {!isEditing && canManageOwnOrganization && (
                      <Button onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Organization Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-lg font-medium">{organization.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    {isEditing ? (
                      <div>
                        <Input
                          id="slug"
                          value={formData.slug || ''}
                          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          Used in URLs and API calls
                        </p>
                      </div>
                    ) : (
                      <p className="font-mono text-sm text-gray-700">{organization.slug}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <div className="flex items-center gap-2">
                      {organization.isActive ? (
                        <span className="flex items-center text-green-600">
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600">
                          <XCircle className="h-5 w-5 mr-2" />
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <Label className="text-gray-500">Organization ID</Label>
                      <p className="font-mono text-sm text-gray-700 break-all">{organization.id}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Last Updated</Label>
                      <p className="text-sm text-gray-700">
                        {new Date(organization.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Statistics</CardTitle>
                  <CardDescription>Overview of your organization's data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">-</p>
                      <p className="text-sm text-gray-600">Users</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">-</p>
                      <p className="text-sm text-gray-600">Persons</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Building2 className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                      <p className="text-2xl font-bold text-gray-900">
                        {organization.isActive ? 'Active' : 'Inactive'}
                      </p>
                      <p className="text-sm text-gray-600">Status</p>
                    </div>
                  </div>
                </CardContent>
            </Card>

              {/* Document Types - Only for admins */}
              {hasAdminAccess && (
                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-gray-600" />
                        <div>
                          <CardTitle>Tipos de Documento da Organização</CardTitle>
                          <CardDescription>
                            Gerencie os tipos de documento específicos da sua organização
                          </CardDescription>
                        </div>
                      </div>
                      <Button onClick={() => setShowCreateDocTypeModal(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Tipo
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Input
                        placeholder="Buscar tipos de documento..."
                        value={docTypeSearch}
                        onChange={(e) => setDocTypeSearch(e.target.value)}
                      />
                    </div>

                    {filteredDocumentTypes.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Nenhum tipo de documento da organização. Os tipos do sistema estão disponíveis para uso.
                      </p>
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
                                Grupo: {dt.group || 'N/A'} ·
                                {dt.hasAccessKey ? ' Requer chave de acesso' : ' Não requer chave de acesso'}
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
          </>
        )}
      </div>

      {/* Create Document Type Modal */}
      {hasAdminAccess && (
        <Dialog open={showCreateDocTypeModal} onOpenChange={setShowCreateDocTypeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Tipo de Documento</DialogTitle>
              <DialogDescription>
                Defina um tipo de documento específico da sua organização
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="doc-type-name">Nome</Label>
                <Input
                  id="doc-type-name"
                  value={newDocType.name}
                  onChange={(e) => setNewDocType({ ...newDocType, name: e.target.value })}
                  placeholder="ex: Nota Fiscal Eletrônica"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-type-group">Grupo</Label>
                <Input
                  id="doc-type-group"
                  value={newDocType.group}
                  onChange={(e) =>
                    setNewDocType({
                      ...newDocType,
                      group: e.target.value,
                    })
                  }
                  placeholder="ex: FISCAL, COMERCIAL, FINANCEIRO"
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
                  Requer chave de acesso (documentos como NF-e)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDocTypeModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateDocumentType} disabled={!newDocType.name.trim()}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Document Type Modal */}
      {hasAdminAccess && (
        <Dialog open={showEditDocTypeModal} onOpenChange={setShowEditDocTypeModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Tipo de Documento</DialogTitle>
              <DialogDescription>Atualize os detalhes do tipo de documento</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-doc-type-name">Nome</Label>
                <Input
                  id="edit-doc-type-name"
                  value={editDocTypeForm.name}
                  onChange={(e) =>
                    setEditDocTypeForm({ ...editDocTypeForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-doc-type-group">Grupo</Label>
                <Input
                  id="edit-doc-type-group"
                  value={editDocTypeForm.group}
                  onChange={(e) =>
                    setEditDocTypeForm({
                      ...editDocTypeForm,
                      group: e.target.value,
                    })
                  }
                  placeholder="ex: FISCAL, COMERCIAL, FINANCEIRO"
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
                  Requer chave de acesso (documentos como NF-e)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDocTypeModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateDocumentType} disabled={!editDocTypeForm.name.trim()}>
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
};
