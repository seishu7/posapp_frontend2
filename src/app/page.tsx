"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Html5QrcodeScanner,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScanType,
} from "html5-qrcode";


type Product = {
  CODE: string;
  NAME: string;
  PRICE: number;
};

export default function POSPage() {
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [list, setList] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<{ [code: string]: number }>({});
  const [readerVisible, setReaderVisible] = useState(false);

  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstance = useRef<Html5QrcodeScanner | null>(null);

  const handleRead = useCallback(async (inputCode?: string) => {
    const targetCode = inputCode?.trim().replace(/\r|\n/g, "") || code.trim();
    if (!targetCode) return;
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product?code=${targetCode}`);
      if (!res.ok) throw new Error("商品が見つかりません");
      const data = await res.json();
      setProduct(data);
      setError("");
    } catch (err) {
      console.error("❌ 検索エラー:", err);
      setProduct(null);
      setError("商品マスタ未登録です");
    }
  }, [code]);  // ここが依存配列。codeが変わったら再生成

  useEffect(() => {
    if (readerVisible && scannerRef.current) {
      if (!scannerInstance.current) {
        scannerInstance.current = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 300, height: 150 },
            aspectRatio: 1.5,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13], // ← 追加
          },
          false
        );
        
        let hasScanned = false;

        scannerInstance.current.render(
          (decodedText) => {
            const cleaned = decodedText.trim().replace(/\r|\n/g, "");
        
            if (!/^49\d{11}$/.test(cleaned)) {
              console.warn("❌ 無効なバーコード:", cleaned);
              return;
            }
        
            if (hasScanned) return;
            hasScanned = true;
        
            console.log("✅ 読み取り:", cleaned);
            setCode(cleaned);
            handleRead(cleaned);
        
            setTimeout(() => {
              hasScanned = false;
            }, 3000); // 3秒間スキャン停止
          },
          (err) => {
            console.warn("スキャンエラー:", err);
          }
        );
        
      }
    }

    return () => {
      if (scannerInstance.current) {
        scannerInstance.current.clear().catch(console.error);
        scannerInstance.current = null;
      }
    };
  }, [readerVisible, handleRead]);  // ← ここに handleRead を追加

  

  const handleAdd = () => {
    if (!product) return;
    const existing = list.find((p) => p.CODE === product.CODE);
    if (!existing) {
      setList([...list, product]);
      setQuantities({ ...quantities, [product.CODE]: 1 });
    } else {
      setQuantities({
        ...quantities,
        [product.CODE]: quantities[product.CODE] + 1,
      });
    }
    setProduct(null);
    setCode("");
  };

  const handleQuantity = (code: string, delta: number) => {
    const newQty = (quantities[code] || 0) + delta;
    if (newQty <= 0) {
      setList(list.filter((item) => item.CODE !== code));
      const { [code]: __unused, ...rest } = quantities;
      console.log(__unused);
      setQuantities(rest);
    } else {
      setQuantities({ ...quantities, [code]: newQty });
    }
  };

  const handleRemove = (code: string) => {
    setList(list.filter((item) => item.CODE !== code));
    const { [code]: __unused, ...rest } = quantities;
    console.log(__unused);
    setQuantities(rest);
  };

  const handlePurchase = async () => {
    const payload = list.flatMap((item) =>
      Array(quantities[item.CODE]).fill({
        CODE: item.CODE,
        NAME: item.NAME,
        PRICE: item.PRICE,
      })
    );

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/purchase?emp_cd=9999999999&store_cd=001&pos_no=001`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) throw new Error("購入登録に失敗しました");
      const data = await res.json();
      alert(`\uD83D\uDCDD ご注文ありがとうございました！\n合計金額: ￥${data.total_amount} 円`);
      setList([]);
      setQuantities({});
    } catch (err) {
      alert("❌ 購入処理中にエラーが発生しました");
      console.error(err);
    }
  };

  const total = list.reduce(
    (sum, item) => sum + item.PRICE * (quantities[item.CODE] || 0),
    0
  );

  console.log("📦 API URL:", process.env.NEXT_PUBLIC_API_BASE_URL);


  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">POSレジシステム</h1>

      <div className="bg-gray-800 p-4 rounded shadow space-y-3">
        <button
          onClick={() => setReaderVisible(!readerVisible)}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full"
        >
          スキャン（カメラ）
        </button>
        {readerVisible && (
          <div
            id="reader"
            ref={scannerRef}
            className="w-full h-[300px] bg-black rounded overflow-hidden"
          />
        )}
      </div>

      {product && (
        <div className="bg-gray-800 p-4 rounded shadow space-y-2">
          <div className="text-sm">コード: {product.CODE}</div>
          <div className="text-sm">名称: {product.NAME}</div>
          <div className="text-sm">単価: ￥{product.PRICE}</div>
          <button
            onClick={handleAdd}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded w-full"
          >
            追加
          </button>
        </div>
      )}

      {error && <p className="text-red-400">{error}</p>}

      <div className="bg-gray-800 p-4 rounded shadow space-y-4">
        <h2 className="font-bold text-lg">購入リスト</h2>
        {list.map((item) => (
          <div key={item.CODE} className="bg-gray-700 p-3 rounded space-y-2 text-sm">
            <div className="font-semibold text-base">{item.NAME}</div>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span>数量:</span>
                <button
                  onClick={() => handleQuantity(item.CODE, -1)}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6"
                >
                  −
                </button>
                <span className="font-bold">{quantities[item.CODE] || 0}</span>
                <button
                  onClick={() => handleQuantity(item.CODE, 1)}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-full w-6 h-6"
                >
                  ＋
                </button>
              </div>
              <div>単価: ￥{item.PRICE}</div>
              <button
                onClick={() => handleRemove(item.CODE)}
                className="text-red-500 font-bold text-sm ml-2"
              >
                削除
              </button>
            </div>
            <div className="text-right font-semibold">
              小計: ￥{item.PRICE * (quantities[item.CODE] || 0)}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-800 p-4 rounded shadow text-center">
        <h2 className="text-lg font-bold mb-2">お支払額</h2>
        <p className="text-2xl text-red-500">￥{total}</p>
      </div>

      <button
        onClick={handlePurchase}
        disabled={list.length === 0}
        className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded w-full text-lg font-bold"
      >
        購入
      </button>
    </div>
  );
}
