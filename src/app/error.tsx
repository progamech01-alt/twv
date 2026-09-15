"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h2>เปิดหน้านี้ไม่สำเร็จ</h2>
      <p>ข้อมูลของคุณไม่ได้ถูกลบ ลองโหลดใหม่อีกครั้ง</p>
      <button onClick={reset}>ลองอีกครั้ง</button>
    </div>
  );
}
