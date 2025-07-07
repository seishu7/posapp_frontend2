"use client";

import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function QRScannerComponent() {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", {  // ← IDを一致させた
      fps: 10,
      qrbox: { width: 300, height: 100 },
      rememberLastUsedCamera: true,
    }, false); // ← 3つ目の引数を明示

    scanner.render(
      (decodedText) => {
        console.log("✅ スキャン成功:", decodedText);
        // setCode(decodedText) などに処理をつなげてもOK
      },
      (errorMessage) => {
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
      <div id="qr-reader" style={{ width: "300px" }} /> {/* ← IDが "qr-reader" */}
    </div>
  );
}
