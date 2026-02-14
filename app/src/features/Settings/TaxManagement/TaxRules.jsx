import { useState, useEffect } from 'react';
import { useGetTaxProfilesQuery, useGetTaxCategoriesQuery, useGetTaxRulesQuery, useCreateTaxRuleMutation, useUpdateTaxRuleMutation, useDeleteTaxRuleMutation } from '@/services/taxesApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxRules() {
    const { data: profiles } = useGetTaxProfilesQuery();
    const { data: categories } = useGetTaxCategoriesQuery();

    const [selectedProfileId, setSelectedProfileId] = useState(null);

    useEffect(() => {
        if (profiles?.length > 0 && !selectedProfileId) {
            const active = profiles.find(p => p.is_active);
            setSelectedProfileId(active ? active.id : profiles[0].id);
        }
    }, [profiles, selectedProfileId]);

    const { data: rules, isLoading: rulesLoading } = useGetTaxRulesQuery(selectedProfileId, { skip: !selectedProfileId });
    const [createRule] = useCreateTaxRuleMutation();
    const [deleteRule] = useDeleteTaxRuleMutation();

    const [newRule, setNewRule] = useState({
        tax_category_id: 'ALL', // Special value for UI
        rule_scope: 'ITEM',
        rate_percent: 0,
        priority: 0,
        is_compound: false,
        min_price: '',
        max_price: ''
    });

    const handleCreate = async () => {
        if (!selectedProfileId) return;

        const payload = {
            tax_profile_id: selectedProfileId,
            rate_percent: parseFloat(newRule.rate_percent),
            priority: parseInt(newRule.priority),
            is_compound: newRule.is_compound ? 1 : 0,
            rule_scope: newRule.rule_scope,
            tax_category_id: newRule.tax_category_id === 'ALL' ? null : parseInt(newRule.tax_category_id),
            min_price: newRule.min_price ? parseFloat(newRule.min_price) : null,
            max_price: newRule.max_price ? parseFloat(newRule.max_price) : null
        };

        try {
            await createRule(payload).unwrap();
            toast.success('Rule created');
            setNewRule({
                tax_category_id: 'ALL',
                rule_scope: 'ITEM',
                rate_percent: 0,
                priority: 0,
                is_compound: false,
                min_price: '',
                max_price: ''
            });
        } catch (err) {
            toast.error('Failed to create rule');
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteRule(id).unwrap();
            toast.success('Rule deleted');
        } catch (err) {
            toast.error('Failed to delete rule');
        }
    };

    if (!selectedProfileId) return <div>Loading profiles...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <label className="font-medium">Select Profile:</label>
                <Select value={String(selectedProfileId)} onValueChange={v => setSelectedProfileId(parseInt(v))}>
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {profiles?.map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name} {p.is_active && '(Active)'}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Card>
                <CardHeader><CardTitle>Add New Rule</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                        <label>Category</label>
                        <Select value={String(newRule.tax_category_id)} onValueChange={v => setNewRule({...newRule, tax_category_id: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Categories</SelectItem>
                                {categories?.map(c => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <label>Scope</label>
                        <Select value={newRule.rule_scope} onValueChange={v => setNewRule({...newRule, rule_scope: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ITEM">Per Item</SelectItem>
                                <SelectItem value="INVOICE">Whole Invoice</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <label>Rate (%)</label>
                        <Input type="number" value={newRule.rate_percent} onChange={e => setNewRule({...newRule, rate_percent: e.target.value})} />
                    </div>
                    <div className="grid gap-1.5">
                        <label>Priority</label>
                        <Input type="number" value={newRule.priority} onChange={e => setNewRule({...newRule, priority: e.target.value})} />
                    </div>
                    <div className="grid gap-1.5">
                        <label>Min Price</label>
                        <Input type="number" value={newRule.min_price} onChange={e => setNewRule({...newRule, min_price: e.target.value})} placeholder="Optional" />
                    </div>
                    <div className="grid gap-1.5">
                        <label>Max Price</label>
                        <Input type="number" value={newRule.max_price} onChange={e => setNewRule({...newRule, max_price: e.target.value})} placeholder="Optional" />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                        <Checkbox checked={newRule.is_compound} onCheckedChange={c => setNewRule({...newRule, is_compound: c})} id="compound" />
                        <label htmlFor="compound">Compound Tax</label>
                    </div>
                    <div className="pt-6">
                        <Button onClick={handleCreate} className="w-full"><Plus className="mr-2 h-4 w-4" /> Add Rule</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Existing Rules</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Constraints</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules?.map(rule => (
                                <TableRow key={rule.id}>
                                    <TableCell>{rule.category_name || 'All Categories'}</TableCell>
                                    <TableCell>{rule.rate_percent}%</TableCell>
                                    <TableCell>
                                        {rule.is_compound ? <Badge variant="secondary">Compound</Badge> : <Badge variant="outline">Simple</Badge>}
                                        {rule.rule_scope === 'INVOICE' && <Badge className="ml-2">Invoice</Badge>}
                                    </TableCell>
                                    <TableCell>{rule.priority}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {rule.min_price && `Min Price: ${rule.min_price}`}
                                        {rule.max_price && ` Max Price: ${rule.max_price}`}
                                    </TableCell>
                                    <TableCell>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(rule.id)}>
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
