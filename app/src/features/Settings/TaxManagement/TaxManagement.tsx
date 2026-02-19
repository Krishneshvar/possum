import TaxProfiles from './TaxProfiles';
import TaxCategories from './TaxCategories';
import TaxRules from './TaxRules';
import TaxSimulator from './TaxSimulator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function TaxManagement() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Tax Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure tax profiles, categories, rules, and test calculations</p>
            </div>

            <Separator />

            <Tabs defaultValue="profiles" className="w-full">
                <TabsList>
                    <TabsTrigger value="profiles">Profiles</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="simulator">Simulator</TabsTrigger>
                </TabsList>
                <TabsContent value="profiles" className="pt-6">
                    <TaxProfiles />
                </TabsContent>
                <TabsContent value="categories" className="pt-6">
                    <TaxCategories />
                </TabsContent>
                <TabsContent value="rules" className="pt-6">
                    <TaxRules />
                </TabsContent>
                <TabsContent value="simulator" className="pt-6">
                    <TaxSimulator />
                </TabsContent>
            </Tabs>
        </div>
    );
}
