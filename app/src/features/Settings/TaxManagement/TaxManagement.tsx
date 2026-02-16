import TaxProfiles from './TaxProfiles';
import TaxCategories from './TaxCategories';
import TaxRules from './TaxRules';
import TaxSimulator from './TaxSimulator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TaxManagement() {
    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Tax Management</h2>
            <Tabs defaultValue="profiles">
                <TabsList>
                    <TabsTrigger value="profiles">Profiles</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="rules">Rules</TabsTrigger>
                    <TabsTrigger value="simulator">Simulator</TabsTrigger>
                </TabsList>
                <TabsContent value="profiles" className="pt-4">
                    <TaxProfiles />
                </TabsContent>
                <TabsContent value="categories" className="pt-4">
                    <TaxCategories />
                </TabsContent>
                <TabsContent value="rules" className="pt-4">
                    <TaxRules />
                </TabsContent>
                <TabsContent value="simulator" className="pt-4">
                    <TaxSimulator />
                </TabsContent>
            </Tabs>
        </div>
    );
}
