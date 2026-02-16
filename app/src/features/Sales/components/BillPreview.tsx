import { useRef, useEffect } from 'react';
import { renderBill, BillSchema } from '@/render/billRenderer';

interface BillPreviewProps {
    data: any;
    schema: BillSchema;
}

export default function BillPreview({ data, schema }: BillPreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (iframeRef.current && data) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
                doc.open();
                doc.write(renderBill(data, schema));
                doc.close();
            }
        }
    }, [data, schema]);

    if (!data) return null;

    return (
        <div className="border shadow-lg bg-white overflow-hidden rounded-md h-full" style={{ width: schema.paperWidth === '58mm' ? '58mm' : '100%', maxWidth: '400px', margin: '0 auto' }}>
            <iframe
                ref={iframeRef}
                title="Bill Preview"
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '500px',
                    background: 'white',
                    border: 'none',
                }}
            />
        </div>
    );
}
