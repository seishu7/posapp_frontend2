"use client";

import { useEffect, useRef } from "react";

export default function CameraTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function enableCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" }, // "environment" に変えるとアウトカメラ
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("📷 カメラの使用に失敗しました:", err);
        alert("カメラへのアクセスが拒否されたか、利用できません。");
      }
    }

    enableCamera();
  }, []);

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">カメラ確認ページ</h1>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "auto", backgroundColor: "black" }}
      />
    </div>
  );
}
