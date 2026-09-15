import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>ยังไม่มีดาวดวงนี้</h1>
      <Link href="/">กลับหน้าแรก →</Link>
    </div>
  );
}
