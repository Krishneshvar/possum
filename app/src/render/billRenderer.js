
export const DEFAULT_BILL_SCHEMA = {
    paperWidth: '80mm', // '58mm' or '80mm'
    sections: [
        {
            id: 'storeHeader',
            type: 'header',
            visible: true,
            options: { alignment: 'center', fontSize: 'medium' }
        },
        {
            id: 'billMeta', // Date, Bill No, Cashier
            type: 'meta',
            visible: true,
            options: { alignment: 'left', fontSize: 'small' }
        },
        {
            id: 'itemsTable',
            type: 'items',
            visible: true,
            options: { fontSize: 'medium', showTax: false }
        },
        {
            id: 'totals',
            type: 'totals',
            visible: true,
            options: { alignment: 'right', fontSize: 'medium' }
        },
        {
            id: 'footer',
            type: 'footer',
            visible: true,
            options: { alignment: 'center', fontSize: 'small', text: 'Thank you for your visit!' }
        }
    ]
};

const STYLES = `
  body {
    margin: 0;
    padding: 0;
    font-family: 'Courier New', Courier, monospace;
    color: black;
    background: white;
  }
  .bill-container {
    padding: 5px;
    box-sizing: border-box;
  }
  .w-58mm { width: 58mm; }
  .w-80mm { width: 80mm; }
  
  .text-left { text-align: left; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  
  .text-small { font-size: 12px; }
  .text-medium { font-size: 14px; }
  .text-large { font-size: 18px; font-weight: bold; }
  
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: 2px 0; }
  .qty-col { width: 15%; }
  .item-col { width: 55%; }
  .price-col { width: 30%; text-align: right; }
  
  .divider { border-top: 1px dashed black; margin: 5px 0; }
  .double-divider { border-top: 3px double black; margin: 5px 0; }
  
  .section { margin-bottom: 8px; }
`;

export function renderBill(data, schema = DEFAULT_BILL_SCHEMA) {
    const { paperWidth, sections } = schema;
    const store = data.store || {};
    const bill = data.bill || {};
    const items = data.items || [];

    const sectionsHtml = sections
        .filter(s => s.visible)
        .map(section => renderSection(section, data))
        .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${STYLES}</style>
</head>
<body>
  <div class="bill-container w-${paperWidth}">
    ${sectionsHtml}
  </div>
</body>
</html>
  `;
}

function renderSection(section, data) {
    const { options } = section;
    const alignClass = `text-${options.alignment || 'left'}`;
    const sizeClass = `text-${options.fontSize || 'medium'}`;
    const commonClasses = `section ${alignClass} ${sizeClass}`;

    switch (section.type) {
        case 'header':
            return `
        <div class="${commonClasses}">
          <div class="text-large">${data.store.name || 'Store Name'}</div>
          <div>${data.store.address || ''}</div>
          <div>${data.store.phone || ''}</div>
          ${data.store.gst ? `<div>GSTIN: ${data.store.gst}</div>` : ''}
        </div>
        <div class="divider"></div>
      `;

        case 'meta':
            return `
        <div class="${commonClasses}">
          <div>Bill No: ${data.bill.billNo || '-'}</div>
          <div>Date: ${data.bill.date || new Date().toLocaleString()}</div>
          ${data.bill.cashier ? `<div>Cashier: ${data.bill.cashier}</div>` : ''}
          ${data.bill.customer ? `<div>Customer: ${data.bill.customer}</div>` : ''}
        </div>
        <div class="divider"></div>
      `;

        case 'items':
            const rows = data.items.map(item => `
        <tr>
          <td class="qty-col">${item.qty}</td>
          <td class="item-col">${item.name}</td>
          <td class="price-col">${formatCurrency(item.total)}</td>
        </tr>
      `).join('');

            return `
        <div class="${commonClasses}">
          <table>
            <thead>
              <tr class="text-small" style="border-bottom: 1px dashed black;">
                <th class="qty-col">Qty</th>
                <th class="item-col">Item</th>
                <th class="price-col">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
        <div class="divider"></div>
      `;

        case 'totals':
            return `
        <div class="${commonClasses}">
          <table style="width: 100%">
            <tr><td>Subtotal:</td><td class="text-right">${formatCurrency(data.bill.subtotal)}</td></tr>
            ${data.bill.tax ? `<tr><td>Tax:</td><td class="text-right">${formatCurrency(data.bill.tax)}</td></tr>` : ''}
            ${data.bill.discount ? `<tr><td>Discount:</td><td class="text-right">-${formatCurrency(data.bill.discount)}</td></tr>` : ''}
            <tr class="text-large" style="border-top: 1px dashed black;">
              <td style="padding-top: 5px;">Total:</td>
              <td class="text-right" style="padding-top: 5px;">${formatCurrency(data.bill.total)}</td>
            </tr>
          </table>
          <div class="text-small text-left" style="margin-top: 5px;">Items: ${data.bill.totalItems}</div>
        </div>
        <div class="divider"></div>
      `;

        case 'footer':
            return `
        <div class="${commonClasses}">
          ${options.text || 'Thank you!'}
        </div>
      `;

        default:
            return '';
    }
}

function formatCurrency(amount) {
    if (amount === undefined || amount === null) return '0.00';
    return Number(amount).toFixed(2);
}
