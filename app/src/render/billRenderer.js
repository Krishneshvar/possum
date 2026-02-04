
export const DEFAULT_BILL_SCHEMA = {
  paperWidth: '80mm', // '58mm' or '80mm'
  dateFormat: 'standard', // 'standard', 'ISO', 'short', 'long'
  timeFormat: '12h', // '12h', '24h'
  sections: [
    {
      id: 'storeHeader',
      type: 'header',
      visible: true,
      options: {
        alignment: 'center',
        fontSize: 'medium',
        showLogo: false,
        logoUrl: '',
        storeName: 'POS Store Demo',
        storeDetails: '123 Main St, Tech City',
        phone: '555-0123',
        gst: '22AAAAA0000A1Z5'
      }
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
  
  .bold { font-weight: bold; }
  
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; vertical-align: top; padding: 2px 0; }
  
  /* Items Table Columns - Order: Item, Qty, Rate, Amount */
  .col-item { width: 40%; }
  .col-qty { width: 15%; text-align: center; }
  .col-rate { width: 20%; text-align: right; }
  .col-amount { width: 25%; text-align: right; }
  
  .divider { border-top: 1px dashed black; margin: 5px 0; }
  .double-divider { border-top: 3px double black; margin: 5px 0; }
  
  .section { margin-bottom: 8px; }
  
  .header-container { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .header-logo { max-width: 50px; max-height: 50px; object-fit: contain; }
  .header-content { flex: 1; }
  
  .footer-text { white-space: pre-wrap; }
`;

export function renderBill(data, schema = DEFAULT_BILL_SCHEMA) {
  const { paperWidth, sections, dateFormat, timeFormat } = schema;

  // Merge schema options into data if they are meant to be editable from schema
  const headerSection = sections.find(s => s.id === 'storeHeader');
  if (headerSection) {
    data.store = { ...data.store, ...headerSection.options };
  }

  const sectionsHtml = sections
    .filter(s => s.visible)
    .map(section => renderSection(section, data, dateFormat, timeFormat))
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

function formatDate(dateStr, dateFormat, timeFormat) {
  const date = dateStr ? new Date(dateStr) : new Date();

  let datePart = '';
  switch (dateFormat) {
    case 'ISO': datePart = date.toISOString().split('T')[0]; break;
    case 'short': datePart = date.toLocaleDateString(); break;
    case 'long': datePart = date.toDateString(); break;
    default: datePart = date.toLocaleDateString(); break; // 'standard' or default
  }

  let timePart = '';
  const hour12 = timeFormat === '12h';
  timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12 });

  return `${datePart} ${timePart}`;
}

function renderSection(section, data, dateFormat, timeFormat) {
  const { options } = section;
  const alignClass = `text-${options.alignment || 'left'}`;
  const sizeClass = `text-${options.fontSize || 'medium'}`;
  const commonClasses = `section ${alignClass} ${sizeClass}`;

  switch (section.type) {
    case 'header':
      const showLogo = options.showLogo && options.logoUrl;
      return `
        <div class="${commonClasses}">
          <div class="header-container" style="justify-content: ${options.alignment === 'center' ? 'center' : options.alignment === 'right' ? 'flex-end' : 'flex-start'}">
            ${showLogo ? `<img src="${options.logoUrl}" class="header-logo" />` : ''}
            <div class="header-content">
              <div class="text-large">${options.storeName || data.store.name || 'Store Name'}</div>
            </div>
          </div>
          <div class="text-small" style="margin-top: 4px;">
            <div style="white-space: pre-wrap;">${options.storeDetails || data.store.address || ''}</div>
            ${options.phone ? `<div><span class="bold">Ph No:</span> ${options.phone}</div>` : ''}
            ${options.gst ? `<div><span class="bold">GSTIN:</span> ${options.gst}</div>` : ''}
          </div>
        </div>
        <div class="divider"></div>
      `;

    case 'meta':
      return `
        <div class="${commonClasses}">
          <div><span class="bold">Bill No:</span> ${data.bill.billNo || '-'}</div>
          <div><span class="bold">Date:</span> ${formatDate(data.bill.date, dateFormat, timeFormat)}</div>
          ${data.bill.cashier ? `<div><span class="bold">Cashier:</span> ${data.bill.cashier}</div>` : ''}
          ${data.bill.customer ? `<div><span class="bold">Customer:</span> ${data.bill.customer}</div>` : ''}
        </div>
        <div class="divider"></div>
      `;

    case 'items':
      const rows = data.items.map(item => `
        <tr>
          <td class="col-item">${item.name}</td>
          <td class="col-qty">${item.qty}</td>
          <td class="col-rate">${formatCurrency(item.price || (item.total / item.qty))}</td>
          <td class="col-amount">${formatCurrency(item.total)}</td>
        </tr>
      `).join('');

      return `
        <div class="${commonClasses}">
          <table>
            <thead>
              <tr class="text-small bold" style="border-bottom: 1px dashed black;">
                <th class="col-item">Item</th>
                <th class="col-qty" style="text-align: center;">Qty</th>
                <th class="col-rate" style="text-align: right;">Rate</th>
                <th class="col-amount" style="text-align: right;">Amt</th>
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
        <div class="${commonClasses} footer-text">
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
