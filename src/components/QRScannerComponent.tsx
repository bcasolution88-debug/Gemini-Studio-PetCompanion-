import React from 'react';
import { QrReader } from 'react-qr-reader';

interface QRScannerComponentProps {
  onScan: (data: string | null) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onScan, onClose }: QRScannerComponentProps) {
  
  const handleResult = (result: any, error: any) => {
    if (result) {
      onScan(result.getText());
    }
  };

  return (
    <div className="absolute inset-0 z-[1000] bg-black/80 p-4 flex flex-col items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white p-2">Close</button>
      <div className="w-full max-w-sm aspect-square overflow-hidden rounded-2xl">
        <QrReader
          onResult={handleResult}
          constraints={{ facingMode: 'environment' }}
        />
      </div>
      <p className="text-white mt-4 text-sm">Scan the QR code on the collar tag</p>
    </div>
  );
}
