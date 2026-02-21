import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Loader2, Info, ChevronDown, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import {
  useGetRolesQuery,
  useGetPermissionsQuery,
  useGetUserRolesQuery,
  useGetUserPermissionsQuery,
  useUpdateUserRolesMutation,
  useUpdateUserPermissionsMutation,
  useGetUsersQuery,
} from '@/services/usersApi';

export default function ManageRolesPermissionsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [permissionOverrides, setPermissionOverrides] = useState<Record<number, boolean | null>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const { data: usersData } = useGetUsersQuery({ searchTerm: '', currentPage: 1, itemsPerPage: 100, sortBy: 'name', sortOrder: 'ASC' });
  const user = usersData?.users.find(u => u.id === Number(userId));

  const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();
  const { data: permissions = [], isLoading: permissionsLoading } = useGetPermissionsQuery();
  const { data: userRoles = [], isLoading: userRolesLoading } = useGetUserRolesQuery(Number(userId) ?? 0, {
    skip: !userId,
  });
  const { data: userPermissions = [], isLoading: userPermissionsLoading } = useGetUserPermissionsQuery(
    Number(userId) ?? 0,
    { skip: !userId }
  );

  const [updateRoles, { isLoading: updatingRoles }] = useUpdateUserRolesMutation();
  const [updatePermissions, { isLoading: updatingPermissions }] = useUpdateUserPermissionsMutation();

  useEffect(() => {
    if (userId && userRoles) {
      setSelectedRoleIds(userRoles.map((r) => r.id));
    }
  }, [userId, userRoles]);

  useEffect(() => {
    if (userId && userPermissions) {
      const overrides: Record<number, boolean | null> = {};
      userPermissions.forEach((p) => {
        overrides[p.permission_id] = p.granted === 1;
      });
      setPermissionOverrides(overrides);
    }
  }, [userId, userPermissions]);

  const handleRoleToggle = (roleId: number) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handlePermissionOverride = (permissionId: number, value: boolean | null) => {
    setPermissionOverrides((prev) => ({
      ...prev,
      [permissionId]: value,
    }));
  };

  const toggleSection = (resource: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [resource]: !prev[resource],
    }));
  };

  const handleSave = async () => {
    if (!userId) return;

    try {
      await updateRoles({ userId: Number(userId), roleIds: selectedRoleIds }).unwrap();

      const permissionsToUpdate = Object.entries(permissionOverrides)
        .filter(([_, value]) => value !== null)
        .map(([permissionId, granted]) => ({
          permissionId: Number(permissionId),
          granted: granted as boolean,
        }));

      if (permissionsToUpdate.length > 0) {
        await updatePermissions({ userId: Number(userId), permissions: permissionsToUpdate }).unwrap();
      }

      toast.success('Roles and permissions updated successfully');
      navigate('/employees');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update roles and permissions');
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const [resource] = perm.key.split('.');
    if (!acc[resource]) acc[resource] = [];
    acc[resource].push(perm);
    return acc;
  }, {} as Record<string, typeof permissions>);

  const isLoading = rolesLoading || permissionsLoading || userRolesLoading || userPermissionsLoading;
  const isSaving = updatingRoles || updatingPermissions;

  if (!user && !isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">User Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/employees')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Manage Roles & Permissions</h1>
        </div>
      </div>

      {user && (
        <p className="text-muted-foreground">
          Assign roles and customize permissions for {user.name}
        </p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Roles</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Roles provide a set of permissions to the user
              </p>
            </div>
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={() => handleRoleToggle(role.id)}
                  />
                  <div className="flex-1 space-y-1">
                    <Label htmlFor={`role-${role.id}`} className="font-medium cursor-pointer capitalize">
                      {role.name}
                    </Label>
                    {role.description && (
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold">Permission Overrides</h3>
              <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1.5">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  Grant or revoke specific permissions regardless of role assignments
                </span>
              </p>
            </div>

            <div className="space-y-2">
              {Object.entries(groupedPermissions).map(([resource, perms]) => (
                <div key={resource} className="border rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleSection(resource)}
                    className="flex w-full items-center justify-between p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize">
                        {resource.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {perms.length}
                      </Badge>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        openSections[resource] ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openSections[resource] && (
                    <div className="space-y-2 p-3 pt-0">
                      {perms.map((perm) => {
                        const override = permissionOverrides[perm.id];
                        return (
                          <div
                            key={perm.id}
                            className="flex items-center justify-between p-2 rounded border bg-card"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-mono">{perm.key}</p>
                              {perm.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant={override === true ? 'default' : 'outline'}
                                onClick={() => handlePermissionOverride(perm.id, override === true ? null : true)}
                                className="h-7 text-xs"
                              >
                                Grant
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={override === false ? 'destructive' : 'outline'}
                                onClick={() => handlePermissionOverride(perm.id, override === false ? null : false)}
                                className="h-7 text-xs"
                              >
                                Revoke
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/employees')} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
