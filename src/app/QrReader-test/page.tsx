"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScannerComponent() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [Html5QrcodeScanner.SCAN_TYPE_CAMERA]
    });

    scanner.render(
      (decodedText) => {
        console.log("✅ スキャン成功:", decodedText);
        // ここで setCode(decodedText) や handleRead(decodedText) を呼べます
      },
      (errorMessage) => {
        // 検出できなかった場合の軽微なエラー
        console.warn("検出失敗:", errorMessage);
      }
    );

    return () => {
      scanner.clear().catch((err) => console.error("クリア失敗:", err));
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
      <h1 className="text-xl font-bold">QRコードスキャナ</h1>
      <div id="qr-reader" style={{ width: "300px" }} />
    </div>
  );
}
