'use client';

import React, { useState } from 'react';
import { IndianRupee, CheckCircle2, Building, X } from 'lucide-react';

interface AdminPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleCode: string;
  farmerName: string;
  farmName: string;
  amount: number;
  productName: string;
  orderNumber: string;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
    beneficiary: string;
  };
  onMarkPaid: (reference: string) => void;
  isProcessing?: boolean;
}

export function AdminPayoutModal({
  isOpen,
  onClose,
  saleCode,
  farmerName,
  farmName,
  amount,
  productName,
  orderNumber,
  bankDetails = {
    accountNumber: '••••••••8912',
    ifsc: 'ICIC0001892',
    bankName: 'ICICI Bank Agri Branch',
    beneficiary: farmerName,
  },
  onMarkPaid,
  isProcessing = false,
}: AdminPayoutModalProps) {
  const [transactionRef, setTransactionRef] = useState('NEFT-KRISHI-928471');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 font-serif">
                Farmer Payout Settlement
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {saleCode} • Order {orderNumber}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3 mb-4 text-xs text-slate-700">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
              <span className="text-slate-500">Farmer Direct Share (75%):</span>
              <span className="text-base font-extrabold text-forest-800">₹{amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Recipient:</span>
              <span className="font-semibold text-slate-900">
                {farmerName} ({farmName})
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Product:</span>
              <span className="font-semibold text-slate-900">{productName}</span>
            </div>
          </div>

          {/* Bank Details Card */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 mb-4 text-xs text-emerald-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>Verified Bank Account</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div>
                <span className="text-emerald-700">Bank:</span> {bankDetails.bankName}
              </div>
              <div>
                <span className="text-emerald-700">IFSC:</span> {bankDetails.ifsc}
              </div>
              <div>
                <span className="text-emerald-700">Account:</span> {bankDetails.accountNumber}
              </div>
              <div>
                <span className="text-emerald-700">Name:</span> {bankDetails.beneficiary}
              </div>
            </div>
          </div>

          {/* Reference Input */}
          <div className="space-y-1.5 mb-5">
            <label className="block text-xs font-bold text-slate-700">
              Bank Transaction / UTR Reference
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-slate-900"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onMarkPaid(transactionRef)}
              disabled={isProcessing}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Processing...' : 'Confirm Payout Transfer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPayoutModal;
