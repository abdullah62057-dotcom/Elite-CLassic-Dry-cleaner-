import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Customer, ShopConfig } from '../../types';
import { EliteLogo } from '../common/EliteLogo';
import {
  TrendingUp,
  DollarSign,
  Shirt,
  Calendar,
  Users,
  Printer,
  Download,
  Filter,
  FileText,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface DailyReportsProps {
  orders: Order[];
  customers: Customer[];
  shopConfig: ShopConfig;
}

export const DailyReports: React.FC<DailyReportsProps> = ({
  orders,
  customers,
  shopConfig,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [dateMode, setDateMode] = useState<'today' | 'custom' | 'all'>('today');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState('');
  const [pdfErrorMessage, setPdfErrorMessage] = useState('');

  // Filter orders based on date selection
  const filteredOrders = useMemo(() => {
    if (dateMode === 'all') return orders;
    const targetDate = dateMode === 'today' ? todayStr : selectedDate;
    return orders.filter((o) => o.bookingDate === targetDate);
  }, [orders, dateMode, selectedDate, todayStr]);

  // Financial & Operational Metrics
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalAdvancePaid = filteredOrders.reduce((sum, o) => sum + o.advancePaid, 0);
  const totalPendingBalance = filteredOrders.reduce((sum, o) => sum + o.balanceDue, 0);
  const totalGarments = filteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Generate and Download PDF directly using jsPDF + autoTable
  const handleSaveAsPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfErrorMessage('');
      setPdfSuccessMessage('');

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 297;
      const reportDateLabel =
        dateMode === 'all'
          ? 'All-Time Activity Ledger'
          : `Date: ${dateMode === 'today' ? todayStr : selectedDate}`;

      // Official Top Blue Banner
      doc.setFillColor(20, 80, 163); // #1450A3
      doc.rect(0, 0, pageWidth, 18, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('ELITE CLASSIC DRY CLEANER — DAILY OPERATIONS & CUSTOMER REPORT', 14, 12);

      // Header address & phone metadata
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(
        `${shopConfig.addressLine1}, ${shopConfig.addressLine2}  |  Phone: ${shopConfig.phone}  |  Timings: ${shopConfig.businessHours}`,
        14,
        24
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(10, 50, 117);
      doc.text(`Report Period: ${reportDateLabel}`, 14, 30);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Generated: ${new Date().toLocaleString()}  |  Total Slips: ${filteredOrders.length}  |  Total Garments: ${totalGarments} pcs`,
        14,
        35
      );

      // KPI Metric summary blocks
      // Box 1: Total Bookings
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, 38, 62, 16, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('TOTAL BOOKINGS', 18, 43);
      doc.setFontSize(11.5);
      doc.setTextColor(10, 50, 117);
      doc.text(`Rs ${totalRevenue.toLocaleString()}`, 18, 50);

      // Box 2: Advance Collected
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(82, 38, 62, 16, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(6, 95, 70);
      doc.text('ADVANCE COLLECTED', 86, 43);
      doc.setFontSize(11.5);
      doc.setTextColor(4, 120, 87);
      doc.text(`Rs ${totalAdvancePaid.toLocaleString()}`, 86, 50);

      // Box 3: Balance Due
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(150, 38, 62, 16, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(153, 27, 27);
      doc.text('BALANCE DUE AT COUNTER', 154, 43);
      doc.setFontSize(11.5);
      doc.setTextColor(185, 28, 28);
      doc.text(`Rs ${totalPendingBalance.toLocaleString()}`, 154, 50);

      // Box 4: Garments Processed
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(218, 38, 65, 16, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('GARMENTS PROCESSED', 222, 43);
      doc.setFontSize(11.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${totalGarments} pcs (${filteredOrders.length} slips)`, 222, 50);

      // Build table rows
      const tableRows = filteredOrders.map((o) => {
        const garmentsDesc = o.items
          .map((i) => `${i.quantity}x ${i.description} (${i.serviceType})`)
          .join('\n');

        const pref = o.customerPreferencesSnapshot;
        const prefText = pref
          ? `Starch: ${pref.starch || '-'}\nPack: ${pref.packaging || '-'}${pref.specialInstructions ? '\nNote: ' + pref.specialInstructions : ''}`
          : 'Standard';

        return [
          o.id,
          `${o.customerName}\n${o.customerPhone}\n(${o.customerId})`,
          garmentsDesc,
          prefText,
          `Book: ${o.bookingDate}\nDue: ${o.deliveryDate}`,
          `Rs ${o.total.toLocaleString()}`,
          `Rs ${o.advancePaid.toLocaleString()}`,
          `Rs ${o.balanceDue.toLocaleString()}`,
          `${o.paymentStatus}\n(${o.paymentMethod})`,
        ];
      });

      autoTable(doc, {
        startY: 58,
        head: [
          [
            'Slip No',
            'Customer Details',
            'Itemized Garments & Services',
            'Customer Preferences',
            'Dates',
            'Total (Rs)',
            'Advance (Rs)',
            'Balance (Rs)',
            'Status',
          ],
        ],
        body: tableRows.length > 0 ? tableRows : [['-', 'No orders recorded for this period', '', '', '', '-', '-', '-', '-']],
        theme: 'grid',
        headStyles: {
          fillColor: [20, 80, 163],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: 'bold' },
          1: { cellWidth: 42 },
          2: { cellWidth: 62 },
          3: { cellWidth: 35 },
          4: { cellWidth: 28 },
          5: { cellWidth: 22, halign: 'right' },
          6: { cellWidth: 22, halign: 'right' },
          7: { cellWidth: 22, halign: 'right' },
          8: { cellWidth: 20, halign: 'center' },
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          valign: 'middle',
          lineColor: [220, 226, 235],
          lineWidth: 0.2,
        },
        foot: [
          [
            'TOTALS',
            `${filteredOrders.length} Customer Slips`,
            `${totalGarments} Total Pieces`,
            '',
            '',
            `Rs ${totalRevenue.toLocaleString()}`,
            `Rs ${totalAdvancePaid.toLocaleString()}`,
            `Rs ${totalPendingBalance.toLocaleString()}`,
            `${filteredOrders.filter((o) => o.balanceDue === 0).length} Cleared`,
          ],
        ],
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [10, 50, 117],
          fontStyle: 'bold',
          fontSize: 8,
        },
        margin: { left: 14, right: 14 },
      });

      // Pagination & verification footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 140);
        doc.text(
          `Elite Classic Dry Cleaners — Defence Phase 2 Karachi | Certified POS System Ledger | Page ${i} of ${totalPages}`,
          14,
          202
        );
      }

      const filename = `Elite_Daily_Report_${dateMode === 'all' ? 'All_Time' : selectedDate}.pdf`;
      doc.save(filename);

      setPdfSuccessMessage(`✓ Downloaded "${filename}" successfully!`);
      setTimeout(() => setPdfSuccessMessage(''), 4500);
    } catch (err: any) {
      console.error('PDF Generation Error:', err);
      setPdfErrorMessage('PDF creation failed, opening browser print fallback...');
      setTimeout(() => {
        window.print();
        setPdfErrorMessage('');
      }, 500);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Browser Print trigger (for physical paper printing)
  const handlePrint = () => {
    window.print();
  };

  // Export Customer Report to CSV / Excel
  const handleExportCsv = () => {
    const headers = [
      'Slip No',
      'Customer ID',
      'Customer Name',
      'Customer Phone',
      'Booking Date',
      'Delivery Date',
      'Garments Breakdown',
      'Starch Preference',
      'Packaging Preference',
      'Special Notes',
      'Total Amount (Rs)',
      'Advance Paid (Rs)',
      'Balance Due (Rs)',
      'Payment Status',
    ];

    const rows = filteredOrders.map((order) => {
      const garmentsDesc = order.items
        .map((i) => `${i.quantity}x ${i.description} (${i.serviceType})`)
        .join('; ');

      return [
        `"${order.id}"`,
        `"${order.customerId}"`,
        `"${order.customerName}"`,
        `"${order.customerPhone}"`,
        `"${order.bookingDate}"`,
        `"${order.deliveryDate}"`,
        `"${garmentsDesc.replace(/"/g, '""')}"`,
        `"${order.customerPreferencesSnapshot?.starch || 'Standard'}"`,
        `"${order.customerPreferencesSnapshot?.packaging || 'Hanger'}"`,
        `"${(order.customerPreferencesSnapshot?.specialInstructions || '').replace(/"/g, '""')}"`,
        order.total,
        order.advancePaid,
        order.balanceDue,
        `"${order.paymentStatus}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Elite_Daily_Report_${dateMode === 'all' ? 'All_Dates' : selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar & Action Controls (Hidden when printing to PDF) */}
      <div className="bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 print:hidden transition-colors">
        <div>
          <h2 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-[#1450A3] dark:text-cyan-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span>Daily Business & Customer Report</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View financial summaries and detailed customer order ledgers
          </p>
        </div>

        {/* Date Filter & PDF Save Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setDateMode('today')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dateMode === 'today'
                  ? 'bg-white dark:bg-blue-600 text-[#0A3275] dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateMode('custom')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dateMode === 'custom'
                  ? 'bg-white dark:bg-blue-600 text-[#0A3275] dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pick Date
            </button>
            <button
              onClick={() => setDateMode('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                dateMode === 'all'
                  ? 'bg-white dark:bg-blue-600 text-[#0A3275] dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>

          {dateMode === 'custom' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs p-1.5 border border-slate-300 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          )}

          {/* Export CSV button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            title="Download CSV for Excel"
          >
            <Download className="w-3.5 h-3.5 text-blue-700 dark:text-cyan-400" />
            <span>Export CSV</span>
          </button>

          {/* Primary Action: Direct Save as PDF */}
          <button
            type="button"
            onClick={handleSaveAsPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/20 transition-all"
            title="Generate and Download official PDF report"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingPdf ? 'Generating PDF...' : 'Save Report as PDF'}</span>
          </button>

          {/* Secondary Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg shadow-xs transition-colors"
            title="Open browser print preview"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {pdfSuccessMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2 print:hidden shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{pdfSuccessMessage}</span>
        </div>
      )}

      {pdfErrorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 rounded-lg text-xs font-bold flex items-center gap-2 print:hidden shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          <span>{pdfErrorMessage}</span>
        </div>
      )}

      {/* PRINTABLE REPORT DOCUMENT CONTAINER */}
      <div className="report-print-container bg-white dark:bg-[#0D1527] rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5 print:bg-white print:border-none print:shadow-none print:p-0 transition-colors">
        {/* Printable Official Header (Shown in browser & PDF) */}
        <div className="border-b-2 border-[#1450A3] dark:border-cyan-500/60 pb-4 print:border-[#1450A3]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <EliteLogo size="sm" />
              <div>
                <h1 className="text-lg font-black text-[#0A3275] dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-300 dark:via-blue-300 dark:to-indigo-300 print:text-[#0A3275] tracking-tight leading-none">
                  {shopConfig.shopName}
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 print:text-slate-600 font-medium mt-1">
                  {shopConfig.addressLine1}, {shopConfig.addressLine2}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 print:text-slate-500 font-mono">
                  Phone: {shopConfig.phone} · Timings: {shopConfig.businessHours}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[11px] font-bold text-slate-500 dark:text-cyan-400 print:text-slate-500 uppercase tracking-widest">
                Operations & Customer Ledger
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white print:text-slate-900 mt-0.5">
                {dateMode === 'all'
                  ? 'All-Time Activity Report'
                  : `Report Date: ${dateMode === 'today' ? todayStr : selectedDate}`}
              </div>
              <div className="text-[10px] text-slate-400 print:text-slate-400 font-mono mt-0.5">
                Generated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-blue-950/50 dark:to-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-blue-800/40 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 dark:text-blue-300 uppercase block">
              Total Bookings
            </span>
            <div className="text-xl font-mono font-black text-[#0A3275] dark:text-cyan-400 mt-0.5">
              Rs {totalRevenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">
              {filteredOrders.length} customer slips
            </span>
          </div>

          <div className="bg-emerald-50/70 dark:bg-gradient-to-br dark:from-emerald-950/50 dark:to-slate-900 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
              Advance Collected
            </span>
            <div className="text-xl font-mono font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
              Rs {totalAdvancePaid.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">Cash & Wallets</span>
          </div>

          <div className="bg-red-50/70 dark:bg-gradient-to-br dark:from-rose-950/50 dark:to-slate-900 p-3.5 rounded-xl border border-red-200 dark:border-rose-800/40 shadow-xs">
            <span className="text-[10px] font-bold text-red-800 dark:text-rose-300 uppercase block">
              Counter Balance Due
            </span>
            <div className="text-xl font-mono font-black text-red-700 dark:text-rose-400 mt-0.5">
              Rs {totalPendingBalance.toLocaleString()}
            </div>
            <span className="text-[10px] text-red-600 dark:text-rose-400/80 font-medium">Receivable at delivery</span>
          </div>

          <div className="bg-slate-50 dark:bg-gradient-to-br dark:from-purple-950/50 dark:to-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-purple-800/40 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 dark:text-purple-300 uppercase block">
              Garments Processed
            </span>
            <div className="text-xl font-mono font-black text-slate-900 dark:text-purple-300 mt-0.5">
              {totalGarments} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">pcs</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Across active orders</span>
          </div>
        </div>

        {/* DETAILED CUSTOMER ORDERS TABLE WITH FULL CUSTOMER DETAILS & PREFERENCES */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              Customer Orders & Garment Details ({filteredOrders.length} slips)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 print:hidden font-mono">
              All currency in PKR (Rs)
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#1450A3] dark:bg-gradient-to-r dark:from-[#0E2A59] dark:to-[#123E80] text-white uppercase text-[10px] font-bold tracking-wider print:bg-[#1450A3]">
                <tr>
                  <th className="p-2.5">Slip No</th>
                  <th className="p-2.5">Customer Details</th>
                  <th className="p-2.5">Garments Itemized</th>
                  <th className="p-2.5">Customer Preferences</th>
                  <th className="p-2.5">Dates</th>
                  <th className="p-2.5 text-right">Total</th>
                  <th className="p-2.5 text-right">Advance</th>
                  <th className="p-2.5 text-right">Balance</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No customer orders recorded for this date.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const totalPieces = order.items.reduce((s, i) => s + i.quantity, 0);

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Slip ID */}
                        <td className="p-2.5 font-mono font-bold text-[#0A3275] dark:text-cyan-400 whitespace-nowrap">
                          {order.id}
                        </td>

                        {/* Customer Information */}
                        <td className="p-2.5 min-w-[150px]">
                          <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                            {order.customerPhone}
                          </div>
                          <div className="text-[10px] font-mono text-blue-800 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.2 rounded inline-block mt-0.5 border border-blue-200 dark:border-blue-850">
                            {order.customerId}
                          </div>
                        </td>

                        {/* Garments Itemized */}
                        <td className="p-2.5 min-w-[190px]">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {totalPieces} pcs ({order.items.length} items)
                          </div>
                          <ul className="text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside mt-0.5 space-y-0.5">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="truncate">
                                {item.quantity}x {item.description}{' '}
                                <span className="text-[10px] text-blue-700 dark:text-cyan-400 font-medium">
                                  ({item.serviceType})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>

                        {/* Customer Preferences */}
                        <td className="p-2.5 min-w-[140px] text-[10.5px] text-slate-700 dark:text-slate-300">
                          {order.customerPreferencesSnapshot ? (
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-slate-400">Starch:</span>{' '}
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {order.customerPreferencesSnapshot.starch}
                                </strong>
                              </div>
                              <div>
                                <span className="text-slate-400">Pack:</span>{' '}
                                <strong className="text-slate-800 dark:text-slate-200">
                                  {order.customerPreferencesSnapshot.packaging}
                                </strong>
                              </div>
                              {order.customerPreferencesSnapshot.specialInstructions && (
                                <div className="text-[9.5px] text-amber-800 dark:text-amber-400 italic truncate max-w-[150px]">
                                  {order.customerPreferencesSnapshot.specialInstructions}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Standard</span>
                          )}
                        </td>

                        {/* Dates */}
                        <td className="p-2.5 text-[10.5px] font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div>Booked: {order.bookingDate}</div>
                          <div className="font-semibold text-blue-900 dark:text-cyan-300">
                            Due: {order.deliveryDate}
                          </div>
                        </td>

                        {/* Financials */}
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          Rs {order.total.toLocaleString()}
                        </td>

                        <td className="p-2.5 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          Rs {order.advancePaid.toLocaleString()}
                        </td>

                        <td className="p-2.5 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className={
                              order.balanceDue > 0 ? 'text-red-700 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500 font-normal'
                            }
                          >
                            Rs {order.balanceDue.toLocaleString()}
                          </span>
                        </td>

                        {/* Payment & Order Status */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              order.paymentStatus === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border dark:border-emerald-700/50'
                                : order.paymentStatus === 'Partial'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 dark:border dark:border-amber-700/50'
                                : 'bg-red-100 text-red-800 dark:bg-rose-950/80 dark:text-rose-300 dark:border dark:border-rose-700/50'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                          <div className="text-[9.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {order.paymentMethod}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Total Summary Row */}
              {filteredOrders.length > 0 && (
                <tfoot className="bg-slate-100 dark:bg-slate-900/90 font-bold border-t-2 border-[#1450A3] dark:border-cyan-500/60 text-slate-900 dark:text-slate-100 print:bg-slate-100">
                  <tr>
                    <td colSpan={5} className="p-2.5 text-right uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300">
                      Report Grand Totals ({totalGarments} pcs):
                    </td>
                    <td className="p-2.5 text-right font-mono text-[#0A3275] dark:text-cyan-400 text-[13px] font-black">
                      Rs {totalRevenue.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 text-[13px] font-black">
                      Rs {totalAdvancePaid.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-mono text-red-700 dark:text-rose-400 text-[13px] font-black">
                      Rs {totalPendingBalance.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-center text-slate-500 dark:text-slate-400 text-[10px]">
                      {filteredOrders.filter((o) => o.balanceDue === 0).length} Paid
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* PDF Signature & Official Stamp Strip (Visible on print/PDF) */}
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 mt-6 grid grid-cols-2 gap-8 text-xs text-slate-600 dark:text-slate-400 print:border-slate-200">
          <div>
            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Audit & Notes:</div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              This official report verifies all customer garment booking slips, advance deposits, and
              outstanding counter balances recorded at Elite Classic Dry Cleaners Defence Phase 2 Karachi.
            </p>
          </div>

          <div className="flex flex-col items-end justify-end">
            <div className="border-t border-slate-400 dark:border-slate-600 w-48 text-center pt-1 font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
              Authorized Counter Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
