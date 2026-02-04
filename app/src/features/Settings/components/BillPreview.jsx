import React, { useEffect, useRef } from 'react';
import { renderBill } from '../../../render/billRenderer';

const MOCK_DATA = {
    store: {
        name: 'POS Store Demo',
        address: '123 Main St, Tech City',
        phone: '555-0123',
        gst: '22AAAAA0000A1Z5'
    },
    bill: {
        billNo: 'INV-001',
        date: '2023-10-27 10:30 AM',
        cashier: 'John Doe',
        customer: 'Jane Smith',
        subtotal: 120.00,
        tax: 12.00,
        discount: 5.00,
        total: 127.00,
        totalItems: 3
    },
    items: [
        { qty: 2, name: 'Burger', total: 20.00 },
        { qty: 1, name: 'Fries', total: 5.00 },
        { qty: 1, name: 'Soda', total: 3.00 },
        { qty: 1, name: 'Ice Cream', total: 92.00 } // Expensive ice cream!
    ]
};

export default function BillPreview({ schema }) {
    const iframeRef = useRef(null);

    useEffect(() => {
        if (iframeRef.current && schema) {
            const htmlContent = renderBill(MOCK_DATA, schema);
            const doc = iframeRef.current.contentDocument;
            doc.open();
            doc.write(htmlContent);
            doc.close();
        }
    }, [schema]);

    return (
        <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            <div className="p-2 border-b bg-gray-200 dark:bg-gray-700 font-semibold text-sm">
                Live Preview ({schema.paperWidth})
            </div>
            <div className="flex-1 overflow-auto flex justify-center p-4">
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
