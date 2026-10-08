'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface QRCodeDisplayProps {
  batchId: string;
  productName: string;
  farmName?: string;
  harvestDate?: string;
  freshnessScore?: number;
  size?: number;
  showCard?: boolean;
}

export function QRCodeDisplay({
  batchId,
  productName,
  farmName = 'Green Valley Farm',
  harvestDate = 'Sept 24, 2026',
  freshnessScore = 95,
  size = 220,
  showCard = true,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [traceUrl, setTraceUrl] = useState<string>(`/trace/${batchId}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}/trace/${encodeURIComponent(batchId)}`;
      setTraceUrl(fullUrl);

      if (canvasRef.current) {
        QRCode.toCanvas(
          canvasRef.current,
          fullUrl,
          {
            width: size,
            margin: 2,
            color: {
              dark: '#143621', // Forest dark
              light: '#FFFFFF',
            },
            errorCorrectionLevel: 'H',
          },
          (err) => {
            if (err) {
              console.error('QR code generation error:', err);
            } else if (canvasRef.current) {
              setDataUrl(canvasRef.current.toDataURL('image/png'));
            }
          }
        );
      }
    }
  }, [batchId, size]);

  const handleDownload = () => {
    if (!dataUrl && canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `KrishiMarket-Trace-QR-${batchId}.png`;
      a.click();
      return;
    }

    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `KrishiMarket-Trace-QR-${batchId}.png`;
      a.click();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(traceUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const qrCanvasElement = (
    <div className="relative flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-dashed border-forest-300 shadow-sm print:shadow-none print:border-black">
      <canvas ref={canvasRef} className="rounded-xl shadow-xs print:shadow-none" />
      <div className="mt-2 text-center">
        <div className="font-mono text-xs font-extrabold text-forest-900 tracking-wider">
          BATCH #{batchId}
        </div>
        <div className="text-[10px] text-slate-500 font-medium">Scan with camera to verify origin</div>
      </div>
    </div>
  );

  if (!showCard) {
    return (
      <div className="flex flex-col items-center gap-3">
        {qrCanvasElement}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            type="button"
            className="px-3 py-1.5 rounded-xl bg-forest-800 text-white text-xs font-semibold hover:bg-forest-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={handlePrint}
            type="button"
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-earth-200/90 shadow-sm p-6 print:border-0 print:p-0">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Left: QR Canvas */}
        <div className="shrink-0">{qrCanvasElement}</div>

        {/* Right: Batch Trace Details and Action Controls */}
        <div className="flex-1 space-y-4 w-full">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-forest-800 bg-forest-50 px-2.5 py-0.5 rounded-full border border-forest-200">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-700" />
                <span>Krishi Farm-to-Consumer Verified</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{freshnessScore}% Freshness Index</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-2 font-serif">{productName}</h3>
            <p className="text-xs text-slate-500">
              Assigned to farm batch <span className="font-mono font-bold text-slate-700">{batchId}</span> harvested on{' '}
              <span className="font-medium text-slate-700">{harvestDate}</span> at {farmName}.
            </p>
          </div>

          <div className="p-3 bg-earth-50 rounded-2xl border border-earth-200/70 text-xs space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Consumer Verification URL
            </div>
            <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-forest-900 bg-white px-3 py-2 rounded-xl border border-earth-200 overflow-hidden">
              <span className="truncate">{traceUrl}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="shrink-0 p-1 hover:text-forest-700 text-slate-400 transition-colors"
                title="Copy trace link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-800 hover:bg-forest-900 active:scale-98 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download High-Res QR</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-earth-300 hover:bg-earth-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Crate Label</span>
            </button>

            <Link
              href={`/trace/${encodeURIComponent(batchId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-900 text-xs font-semibold border border-forest-200 transition-all cursor-pointer"
            >
              <span>View Consumer Page</span>
              <ExternalLink className="w-3 h-3 text-forest-700" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
