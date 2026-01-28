import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiService, Organization, UpdateOrganizationRequest } from '@/services/api';
import { Building2, Save, CheckCircle, XCircle, Users } from 'lucide-react';
import { useAuthorization } from '@/hooks/useAuthorization';

export const OrganizationSettings = () => {
  const { canManageOwnOrganization } = useAuthorization();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState<UpdateOrganizationRequest>({});

  useEffect(() => {
    loadOrganization();
  }, []);

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
          </>
        )}
      </div>
    </Layout>
  );
};
