import { useRef, useEffect } from 'react';
import { renderBill, BillSchema } from '@/render/billRenderer';

interface BillPreviewProps {
    schema: BillSchema;
}

export default function BillPreview({ schema }: BillPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Mock Data for Preview
    const mockData = {
        store: {
            name: 'My Store',
            address: '123, Market Street, City',
            phone: '9876543210',
            gst: '22AAAAA0000A1Z5'
        },
        bill: {
            billNo: 'INV-001',
            date: new Date().toISOString(),
            cashier: 'John Doe',
            customer: 'Jane Smith',
            items: [
                { name: 'Product A', qty: 2, price: 50, total: 100 },
                { name: 'Product B', qty: 1, price: 150, total: 150 },
                { name: 'Product C - Large', qty: 3, price: 20, total: 60 }
            ],
            subtotal: 310,
            tax: 15.50,
            discount: 10,
            total: 315.50,
            totalItems: 3
        },
        currency: schema.currency || '₹'
    };

    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(renderBill(mockData, schema));
                doc.close();
            }
        }
    }, [schema]);

    return (
        <div className="flex flex-col items-center gap-4 w-full h-full">
            <div className="border shadow-lg bg-white overflow-hidden" style={{ width: schema.paperWidth === '58mm' ? '58mm' : '80mm' }}>
                <iframe
                    ref={iframeRef}
                    title="Bill Preview"
                    style={{
                        width: schema.paperWidth === '58mm' ? '58mm' : '80mm',
                        height: '100%',
                        minHeight: '500px',
                        background: 'white',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                />
            </div>
        </div>
    );
}
