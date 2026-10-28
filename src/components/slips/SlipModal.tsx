import React, { useState } from 'react';
import { Order, ShopConfig } from '../../types';
import { CustomerReceipt } from './CustomerReceipt';
import { SideSlip } from './SideSlip';
import {
  Printer,
  X,
  Copy,
  Check,
  MessageSquare,
  Tag,
  FileText,
  Layers,
  Download,
  CheckCircle2,
} from 'lucide-react';
import {
  downloadCustomerReceiptPdf,
  downloadSideSlipPdf,
  downloadDualSlipsPdf,
} from '../../utils/slipPdfExport';

interface SlipModalProps {
  order: Order | null;
  shopConfig: ShopConfig;
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'customer' | 'side' | 'both';
}

export const SlipModal: React.FC<SlipModalProps> = ({
  order,
  shopConfig,
  isOpen,
  onClose,
  defaultView = 'both',
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'side' | 'both'>(defaultView);
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !order) return null;

  const handlePrint = (viewType: 'customer' | 'side' | 'both') => {
    setActiveTab(viewType);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleDownloadPdf = async (type: 'customer' | 'side' | 'both') => {
    try {
      setIsDownloading(true);
      if (type === 'customer') {
        await downloadCustomerReceiptPdf(order, shopConfig);
        setDownloadSuccess('Customer Slip PDF Downloaded!');
      } else if (type === 'side') {
        await downloadSideSlipPdf(order, shopConfig);
        setDownloadSuccess('Side Slip PDF Downloaded!');
      } else {
        await downloadDualSlipsPdf(order, shopConfig);
        setDownloadSuccess('Both Slips Downloaded!');
      }
      setTimeout(() => setDownloadSuccess(''), 3500);
    } catch (err) {
      console.error('Error generating slip PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
  const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.substring(1) : cleanPhone;
  const whatsAppText = `*ELITE CLASSIC DRY CLEANER*
Salam ${order.customerName}, your dry cleaning booking is confirmed!
----------------------------------
*Order Slip No:* ${order.id}
*Customer ID:* ${order.customerId}
*Items:* ${order.items.length} items (${order.items.reduce((s, i) => s + i.quantity, 0)} pcs)
*Booking Date:* ${order.bookingDate}
*Delivery Ready:* ${order.deliveryDate} (${shopConfig.deliveryHours})
*Total Amount:* Rs ${order.total.toLocaleString()}
*Advance Paid:* Rs ${order.advancePaid.toLocaleString()}
*Balance Due:* Rs ${order.balanceDue.toLocaleString()}
*Pickup Location:* ${shopConfig.addressLine1}, ${shopConfig.addressLine2}
*Shop Phone:* ${shopConfig.phone}
----------------------------------
Thank you for trusting Elite Classic Dry Cleaner!`;

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto slip-print-backdrop">
      <div className="bg-white dark:bg-[#0D1527] rounded-xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090F1C] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-[#1450A3] dark:text-cyan-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Slips & Printing Terminal</h3>
                <span className="font-mono text-xs font-bold bg-[#1450A3] dark:bg-blue-600 text-white px-2 py-0.5 rounded shadow-xs">
                  {order.id}
                </span>
                <span className="text-xs font-bold text-blue-900 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/80 border border-blue-200 dark:border-cyan-700/60 px-1.5 py-0.5 rounded font-mono">
                  {order.customerId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Customer: <strong className="text-slate-800 dark:text-slate-200">{order.customerName}</strong> · Phone: {order.customerPhone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Selector Tabs */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800/90 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveTab('both')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'both'
                    ? 'bg-white dark:bg-blue-600 text-[#0A3275] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Dual View
              </button>
              <button
                onClick={() => setActiveTab('customer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'customer'
                    ? 'bg-white dark:bg-blue-600 text-[#0A3275] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Customer Receipt
              </button>
              <button
                onClick={() => setActiveTab('side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeTab === 'side'
                    ? 'bg-white dark:bg-blue-600 text-[#0A3275] dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                Side Slip (Tags)
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-2"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Action Bar with Direct PDF Download & Printing Options */}
        <div className="px-5 py-2.5 bg-blue-50/80 dark:bg-[#0C1424] border-b border-blue-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs print:hidden">
          <div className="flex items-center gap-2">
            {downloadSuccess ? (
              <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                {downloadSuccess}
              </span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px]">
                Save as official PDF file or send to thermal / laser printer.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Link button */}
            <a
              href={`https://wa.me/${intlPhone}?text=${encodeURIComponent(whatsAppText)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCopyWhatsApp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors shadow-xs"
              title="Open WhatsApp with receipt message"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'WhatsApp Slip'}</span>
            </a>

            {/* Direct PDF Download Buttons */}
            <button
              onClick={() => handleDownloadPdf('customer')}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1450A3] dark:text-cyan-300 font-bold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Download Customer Slip as standalone PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Customer PDF</span>
            </button>

            <button
              onClick={() => handleDownloadPdf('side')}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#1450A3] dark:text-cyan-300 font-bold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-xs"
              title="Download Side Slip as standalone PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Side Slip PDF</span>
            </button>

            <button
              onClick={() => handleDownloadPdf('both')}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-[#1450A3] to-cyan-600 hover:from-[#0A3275] hover:to-cyan-500 text-white font-bold transition-all shadow-md shadow-blue-500/20"
              title="Download Both Slips as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Both PDFs</span>
            </button>

            {/* Quick Print Button */}
            <button
              onClick={() => handlePrint('both')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors shadow-xs"
              title="Print via browser dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Slip Preview Area (Scrollable on screen, optimized for print) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/90 dark:bg-[#060A12] flex justify-center items-start print:bg-white print:p-0 print:overflow-visible transition-colors">
          {activeTab === 'customer' && (
            <div className="slip-print-container">
              <CustomerReceipt order={order} shopConfig={shopConfig} />
            </div>
          )}

          {activeTab === 'side' && (
            <div className="slip-print-container">
              <SideSlip order={order} shopConfig={shopConfig} />
            </div>
          )}

          {activeTab === 'both' && (
            <div className="slip-print-container w-full max-w-5xl flex flex-col md:flex-row gap-6 justify-center items-start print:flex-col print:gap-8">
              <div className="w-full md:w-1/2 flex flex-col items-center">
                <div className="text-xs font-bold text-slate-500 dark:text-cyan-400 mb-2 uppercase tracking-wide print:hidden">
                  1. Customer Copy (Official Receipt)
                </div>
                <CustomerReceipt order={order} shopConfig={shopConfig} />
              </div>

              <div className="w-full md:w-1/2 flex flex-col items-center">
                <div className="text-xs font-bold text-slate-500 dark:text-cyan-400 mb-2 uppercase tracking-wide print:hidden">
                  2. Side Slip (Shop & Garment Tags)
                </div>
                <SideSlip order={order} shopConfig={shopConfig} />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-slate-50 dark:bg-[#090F1C] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 print:hidden transition-colors">
          <span>
            Slip ID: <strong className="font-mono text-slate-800 dark:text-cyan-400">{order.id}</strong> | Customer:{' '}
            <strong className="font-mono text-slate-800 dark:text-slate-200">{order.customerId}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
