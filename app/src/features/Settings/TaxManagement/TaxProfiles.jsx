import { useState } from 'react';
import { useGetTaxProfilesQuery, useCreateTaxProfileMutation, useUpdateTaxProfileMutation, useDeleteTaxProfileMutation } from '@/services/taxesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxProfiles() {
    const { data: profiles, isLoading } = useGetTaxProfilesQuery();
    const [createProfile, { isLoading: isCreating }] = useCreateTaxProfileMutation();
    const [updateProfile] = useUpdateTaxProfileMutation();
    const [deleteProfile] = useDeleteTaxProfileMutation();

    const [newProfile, setNewProfile] = useState({
        name: '',
        country_code: '',
        region_code: '',
        pricing_mode: 'EXCLUSIVE',
        is_active: false
    });

    const handleCreate = async () => {
        if (!newProfile.name) return toast.error('Name is required');
        try {
            await createProfile(newProfile).unwrap();
            toast.success('Profile created');
            setNewProfile({ name: '', country_code: '', region_code: '', pricing_mode: 'EXCLUSIVE', is_active: false });
        } catch (err) {
            toast.error('Failed to create profile');
        }
    };

    const handleActivate = async (id) => {
        try {
            await updateProfile({ id, is_active: true }).unwrap();
            toast.success('Profile activated');
        } catch (err) {
            toast.error('Failed to activate profile');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure? This will delete all rules associated with this profile.')) return;
        try {
            await deleteProfile(id).unwrap();
            toast.success('Profile deleted');
        } catch (err) {
            toast.error('Failed to delete profile');
        }
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Create Tax Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-4 items-end">
                    <div className="grid w-full items-center gap-1.5">
                        <label>Name</label>
                        <Input value={newProfile.name} onChange={e => setNewProfile({...newProfile, name: e.target.value})} placeholder="e.g. US Sales Tax" />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <label>Country Code</label>
                        <Input value={newProfile.country_code} onChange={e => setNewProfile({...newProfile, country_code: e.target.value})} placeholder="US" />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <label>Region</label>
                        <Input value={newProfile.region_code} onChange={e => setNewProfile({...newProfile, region_code: e.target.value})} placeholder="CA" />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <label>Pricing Mode</label>
                        <Select value={newProfile.pricing_mode} onValueChange={v => setNewProfile({...newProfile, pricing_mode: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="EXCLUSIVE">Exclusive (Tax added)</SelectItem>
                                <SelectItem value="INCLUSIVE">Inclusive (Tax included)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCreate} disabled={isCreating}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Existing Profiles</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {profiles?.map(profile => (
                                <TableRow key={profile.id}>
                                    <TableCell>{profile.name}</TableCell>
                                    <TableCell>{profile.country_code} {profile.region_code}</TableCell>
                                    <TableCell>{profile.pricing_mode}</TableCell>
                                    <TableCell>
                                        {profile.is_active ? <Badge className="bg-green-500">Active</Badge> : <Badge variant="outline">Inactive</Badge>}
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        {!profile.is_active && (
                                            <Button size="sm" variant="outline" onClick={() => handleActivate(profile.id)}>
                                                Activate
                                            </Button>
                                        )}
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(profile.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
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
