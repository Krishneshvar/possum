
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useMemo } from 'react';
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { flattenCategories } from '@/utils/categories.utils.js';

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Category name must be at least 2 characters.",
    }),
    parentId: z.string().optional(),
});

export function CategoryForm({ defaultValues, categories, onSave, isLoading }) {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            parentId: "none",
        },
    });

    useEffect(() => {
        if (defaultValues) {
            form.reset({
                name: defaultValues.name || "",
                parentId: defaultValues.parent_id ? String(defaultValues.parent_id) : "none",
            });
        } else {
            form.reset({
                name: "",
                parentId: "none",
            });
        }
    }, [defaultValues, form]);

    const flatCategories = useMemo(() => {
        return flattenCategories(categories).filter(c => c.id !== defaultValues?.id);
    }, [categories, defaultValues]);

    function onSubmit(values) {
        const payload = {
            name: values.name,
            parentId: values.parentId === "none" ? null : Number(values.parentId)
        };
        onSave(payload);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Beverages" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Parent Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a parent category" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">None (Root Category)</SelectItem>
                                    {flatCategories.map((category) => (
                                        <SelectItem key={category.id} value={String(category.id)}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {defaultValues ? "Update Category" : "Add Category"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
