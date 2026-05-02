import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatSum } from './utils';

interface SaleItem {
  receiptNumber: string | number;
  customerName: string;
  customerPhone: string;
  total: string;
  paymentMethod: string;
  createdAt: string;
  saleItems: string;
  notes?: string;
}

export const exportToPDF = (data: SaleItem[], title: string) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more space

  // Add Title
  doc.setFontSize(22);
  doc.setTextColor(33, 33, 33);
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Shtab: APPLE TTT`, 14, 28);
  doc.text(`Sana: ${new Date().toLocaleString('uz-UZ')}`, 14, 33);

  // Prepare table data
  const tableColumn = ["#", "Chek №", "Mijoz", "Tel", "Mahsulotlar & IMEI", "Summa", "To'lov", "Vaqt"];
  const tableRows = data.map((item, index) => [
    index + 1,
    `#${item.receiptNumber}`,
    item.customerName,
    item.customerPhone,
    `${item.saleItems}${item.notes ? `\n[${item.notes}]` : ''}`,
    `${formatSum(item.total, false)}`,
    item.paymentMethod === 'credit' ? 'Nasiya' : item.paymentMethod.toUpperCase(),
    formatDate(item.createdAt)
  ]);

  // Calculate totals
  const totalSum = data.reduce((acc, item) => acc + Number(item.total), 0);

  // Generate Table
  autoTable(doc, {
    startY: 40,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      4: { cellWidth: 60 }, // Products column wider
    },
    styles: { fontSize: 9, cellPadding: 3 },
    foot: [['', '', '', '', 'JAMI:', `${formatSum(totalSum, false)} so'm`, '', '']],
    footStyles: { fillColor: [241, 196, 15], textColor: [0, 0, 0], fontStyle: 'bold' },
  });

  // Save the PDF
  const filename = `sotuvlar_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};

export const exportToCSV = (data: SaleItem[]) => {
  const headers = ['Chek №', 'Mijoz', 'Telefon', 'Mahsulotlar', 'Summa', 'To\'lov turi', 'Sana'];
  const rows = data.map(s => [
    `#${s.receiptNumber}`,
    s.customerName,
    s.customerPhone,
    s.saleItems,
    s.total,
    s.paymentMethod === 'credit' ? 'Nasiya' : s.paymentMethod.toUpperCase(),
    formatDate(s.createdAt)
  ]);

  const csvContent = "\uFEFF" + // UTF-8 BOM for Excel
    headers.join(",") + "\n" +
    rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `sotuvlar_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}-${['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'][d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
