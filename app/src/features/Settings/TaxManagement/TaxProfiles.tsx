import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGetTaxProfilesQuery, useCreateTaxProfileMutation, useDeleteTaxProfileMutation, useUpdateTaxProfileMutation } from '@/services/taxesApi';
import { toast } from 'sonner';
import { Trash2, Plus, Edit2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TaxProfiles() {
    const { data: profiles, isLoading } = useGetTaxProfilesQuery(undefined);
    const [createProfile] = useCreateTaxProfileMutation();
    const [deleteProfile] = useDeleteTaxProfileMutation();
    const [updateProfile] = useUpdateTaxProfileMutation();

    const [newProfile, setNewProfile] = useState({ name: '', country_code: 'IN', region_code: '', pricing_mode: 'exclusive' });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<any>({});

    const handleCreate = async () => {
        try {
            await createProfile({ ...newProfile, is_active: true }).unwrap();
            toast.success('Profile created');
            setNewProfile({ name: '', country_code: 'IN', region_code: '', pricing_mode: 'exclusive' });
        } catch (err) {
            toast.error('Failed to create profile');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteProfile(id).unwrap();
            toast.success('Profile deleted');
        } catch (err) {
            toast.error('Failed to delete profile');
        }
    };

    const startEdit = (profile: any) => {
        setEditingId(profile.id);
        setEditForm(profile);
    };

    const saveEdit = async () => {
        try {
            await updateProfile({ id: editingId!, ...editForm }).unwrap();
            toast.success('Profile updated');
            setEditingId(null);
        } catch (err) {
            toast.error('Failed to update profile');
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Add New Profile</CardTitle></CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="grid gap-1.5 flex-1">
                        <label className="text-sm font-medium">Name</label>
                        <Input value={newProfile.name} onChange={e => setNewProfile({ ...newProfile, name: e.target.value })} placeholder="e.g. GST India" />
                    </div>
                    <div className="grid gap-1.5 w-[100px]">
                        <label className="text-sm font-medium">Country</label>
                        <Input value={newProfile.country_code} onChange={e => setNewProfile({ ...newProfile, country_code: e.target.value })} />
                    </div>
                    <div className="grid gap-1.5 w-[100px]">
                        <label className="text-sm font-medium">Region</label>
                        <Input value={newProfile.region_code} onChange={e => setNewProfile({ ...newProfile, region_code: e.target.value })} />
                    </div>
                    <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Existing Profiles</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Region</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles?.map((profile: any) => (
                                <TableRow key={profile.id}>
                                    <TableCell>
                                        {editingId === profile.id ? (
                                            <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                        ) : profile.name}
                                    </TableCell>
                                    <TableCell>{profile.region_code || 'All'}</TableCell>
                                    <TableCell>
                                        {editingId === profile.id ? (
                                            <select
                                                className="border rounded p-1"
                                                value={editForm.pricing_mode}
                                                onChange={e => setEditForm({ ...editForm, pricing_mode: e.target.value })}
                                            >
                                                <option value="exclusive">Exclusive</option>
                                                <option value="inclusive">Inclusive</option>
                                            </select>
                                        ) : <Badge variant="outline">{profile.pricing_mode}</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                                            {profile.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {editingId === profile.id ? (
                                            <Button size="sm" onClick={saveEdit}><Save className="h-4 w-4" /></Button>
                                        ) : (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost" onClick={() => startEdit(profile)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(profile.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
