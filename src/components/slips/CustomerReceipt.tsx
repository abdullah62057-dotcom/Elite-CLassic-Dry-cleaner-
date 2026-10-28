import React from 'react';
import { Order, ShopConfig } from '../../types';
import { EliteLogo } from '../common/EliteLogo';

interface CustomerReceiptProps {
  order: Order;
  shopConfig: ShopConfig;
  className?: string;
  isPrintOnly?: boolean;
}

export const CustomerReceipt: React.FC<CustomerReceiptProps> = ({
  order,
  shopConfig,
  className = '',
}) => {
  return (
    <div
      className={`bg-white text-slate-900 border border-[#1450A3] shadow-md rounded-none w-full max-w-[500px] mx-auto p-6 font-sans relative overflow-hidden print:shadow-none print:border print:m-0 print:p-6 print:max-w-none ${className}`}
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

      {/* Customer & Booking Info Box - Under the logo */}
      <div className="border-2 border-[#1450A3] rounded-2xl p-3.5 bg-white text-[12.5px] leading-relaxed space-y-2 mb-2">
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
          <span className="border-b border-[#1450A3] flex-1 font-semibold text-blue-900 px-1 tabular-nums">
            {order.deliveryDate}
          </span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold text-[#0A3275] whitespace-nowrap min-w-[95px]">
            Phone No:
          </span>
          <span className="border-b border-[#1450A3] flex-1 font-medium text-slate-800 px-1 tabular-nums">
            {order.customerPhone}
          </span>
        </div>
      </div>

      {/* Dashed Phone Divider (Exact from PDF) */}
      <div className="text-center my-3 text-[12.5px] font-bold tracking-wider text-[#1450A3]">
        -------------- Phone No: {shopConfig.phone} --------------
      </div>

      {/* Items Table (Exact blue header & clean grid lines from PDF) */}
      <div className="border border-[#1450A3] mt-2 mb-3 bg-white">
        {/* Table Header */}
        <div className="bg-[#1450A3] text-white grid grid-cols-12 text-[12px] font-bold py-1.5 px-1">
          <div className="col-span-2 text-center border-r border-blue-300/40">Qty</div>
          <div className="col-span-7 px-3 border-r border-blue-300/40">Description</div>
          <div className="col-span-3 text-center">Rs</div>
        </div>

        {/* Table Items */}
        <div className="divide-y divide-[#1450A3]">
          {order.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="grid grid-cols-12 text-[12px] min-h-[25px] items-center bg-white"
            >
              <div className="col-span-2 text-center font-bold text-slate-800 tabular-nums border-r border-[#1450A3] py-1">
                {item.quantity}
              </div>
              <div className="col-span-7 px-2.5 py-1 text-slate-800 border-r border-[#1450A3] text-[11.5px] leading-tight truncate">
                <span className="font-medium">{item.description}</span>
                {item.serviceType !== 'Dry Clean' && (
                  <span className="text-[10px] text-blue-700 ml-1.5 font-semibold">
                    ({item.serviceType})
                  </span>
                )}
              </div>
              <div className="col-span-3 text-right pr-3 font-semibold text-slate-900 tabular-nums py-1">
                {item.totalPrice.toLocaleString()}
              </div>
            </div>
          ))}

          {/* TOTAL Row (Exact solid blue bar from PDF) */}
          <div className="bg-[#1450A3] text-white grid grid-cols-12 text-[13px] font-extrabold py-1.5 px-1 items-center">
            <div className="col-span-9 text-right pr-4 tracking-wider">TOTAL</div>
            <div className="col-span-3 text-right pr-3 font-mono text-[14px] tabular-nums">
              {order.total.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Summary & Total Pieces */}
      <div className="my-1.5 px-3 py-1.5 bg-blue-50/90 border border-blue-200 text-[11px] text-slate-800 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#0A3275]">
            Total Pieces: <span className="text-blue-900 font-mono">{order.items.reduce((s, i) => s + i.quantity, 0)} pcs</span> ({order.items.length} items)
          </span>
          <span className="font-medium text-slate-700">
            Payment: <strong className={order.balanceDue > 0 ? 'text-red-700' : 'text-emerald-700'}>{order.paymentStatus} (Bal: Rs {order.balanceDue})</strong>
          </span>
        </div>
      </div>

      {/* Disclaimer (Exact text from PDF - directly below table with no extra boxes) */}
      <div className="text-center text-[11px] leading-snug text-[#0A3275] font-medium my-2.5">
        <p>Please check your clothes, money, and belongings</p>
        <p>before leaving the counter. The shop will not be responsible afterward. Thank you.</p>
      </div>

      {/* Business Hours & Delivery Time (Exact from PDF) */}
      <div className="text-center text-[11.5px] font-bold text-[#0A3275] my-1.5 flex items-center justify-center gap-3">
        <span>Business Hour : {shopConfig.businessHours}</span>
        <span className="text-slate-400">|</span>
        <span>{shopConfig.deliveryHours}</span>
      </div>

      {/* Shop Address (Exact from PDF) */}
      <div className="text-center text-[11.5px] font-bold text-[#0A3275] leading-tight mt-1 mb-2">
        <div>{shopConfig.addressLine1}</div>
        <div>{shopConfig.addressLine2}</div>
      </div>

      {/* Decorative Bottom Diagonal Slash Banner (Exact visual element from PDF) */}
      <div className="mt-3 relative h-3.5 w-full overflow-hidden">
        <div
          className="absolute right-0 bottom-0 h-3.5 w-32 bg-[#1450A3]"
          style={{ clipPath: 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
        />
        <div
          className="absolute right-28 bottom-0 h-3.5 w-8 bg-[#1971C2]"
          style={{ clipPath: 'polygon(30% 0%, 100% 0%, 70% 100%, 0% 100%)' }}
        />
      </div>
    </div>
  );
};
