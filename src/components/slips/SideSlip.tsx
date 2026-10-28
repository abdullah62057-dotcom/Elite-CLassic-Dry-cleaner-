import React from 'react';
import { Order, ShopConfig } from '../../types';
import { EliteLogo } from '../common/EliteLogo';

interface SideSlipProps {
  order: Order;
  shopConfig: ShopConfig;
  className?: string;
  showGarmentTags?: boolean;
}

export const SideSlip: React.FC<SideSlipProps> = ({
  order,
  shopConfig,
  className = '',
}) => {
  const totalPieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={`bg-white text-slate-900 border border-[#1450A3] shadow-md p-5 w-full max-w-[620px] mx-auto font-sans relative print:shadow-none print:border print:m-0 print:p-5 print:max-w-none ${className}`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Upper Right Slip & Customer ID */}
      <div className="absolute top-4 right-5 text-right select-none font-mono">
        <div className="text-[13px] font-black text-[#0A3275] tracking-wide">{order.id}</div>
        <div className="text-[10px] text-slate-500 font-medium">Cust ID: {order.customerId}</div>
      </div>

      {/* Top Logo - Upper side centered */}
      <div className="flex justify-center mb-3">
        <EliteLogo size="lg" />
      </div>

      {/* Details Box - Under the logo */}
      <div className="border-2 border-[#1450A3] rounded-2xl p-3.5 bg-white text-[12.5px] leading-relaxed space-y-2 mb-2 shadow-2xs">
        <div className="flex items-baseline">
          <span className="font-bold text-[#0A3275] whitespace-nowrap min-w-[95px]">
            Name:
          </span>
          <span className="border-b border-[#1450A3] flex-1 font-semibold text-slate-900 px-1 truncate">
            {order.customerName}
          </span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold text-[#0A3275] whitespace-nowrap min-w-[95px]">
            Booking Date:
          </span>
          <span className="border-b border-[#1450A3] flex-1 font-medium text-slate-800 px-1 tabular-nums">
            {order.bookingDate}
          </span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold text-[#0A3275] whitespace-nowrap min-w-[95px]">
            Delivery Date:
          </span>
          <span className="border-b border-[#1450A3] flex-1 font-bold text-blue-900 px-1 tabular-nums">
            {order.deliveryDate}
          </span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold text-[#0A3275] whitespace-nowrap min-w-[95px]">
            Slip No:
          </span>
          <span className="border-b-2 border-[#0A3275] flex-1 font-mono font-black text-blue-950 px-1 text-[14px] tracking-wide whitespace-nowrap">
            {order.id.replace(/^SLIP-?/i, '') || order.id}
          </span>
        </div>
      </div>

      {/* Middle Phone Line */}
      <div className="text-center my-3 text-[12.5px] font-bold tracking-wider text-[#1450A3]">
        -------------- Phone No: {shopConfig.phone} --------------
      </div>

      {/* Workshop Summary & Total Pieces */}
      <div className="my-1.5 px-3 py-1.5 bg-blue-50/90 border border-blue-200 text-[11px] text-slate-800 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#0A3275]">
            Total Pieces: <span className="text-blue-900 font-mono">{totalPieces} pcs</span> ({order.items.length} items)
          </span>
          <span className="font-medium text-slate-700">
            Payment: <strong className={order.balanceDue > 0 ? 'text-red-700' : 'text-emerald-700'}>{order.paymentStatus} (Bal: Rs {order.balanceDue})</strong>
          </span>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-[10.5px] leading-snug text-[#0A3275] font-medium my-1.5">
        <p>Please check your clothes, money, and belongings</p>
        <p>before leaving the counter. The shop will not be responsible afterward. Thank you.</p>
      </div>

      {/* Business Hours & Delivery Time */}
      <div className="text-center text-[11px] font-bold text-[#0A3275] my-1 flex items-center justify-center gap-2">
        <span>Business Hour : {shopConfig.businessHours}</span>
        <span className="text-slate-400">|</span>
        <span>{shopConfig.deliveryHours}</span>
      </div>

      {/* Shop Address */}
      <div className="text-center text-[11px] font-bold text-[#0A3275] leading-tight mt-1">
        <div>{shopConfig.addressLine1}</div>
        <div>{shopConfig.addressLine2}</div>
      </div>
    </div>
  );
};

