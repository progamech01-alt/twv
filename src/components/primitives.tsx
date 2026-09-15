"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, ImageIcon } from "lucide-react";
import { api } from "@/services/client";
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="ปิด">
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  text = "ยังไม่มีเรื่องราวตรงนี้",
  detail = "เพิ่มข้อมูลได้จาก Studio",
}: {
  text?: string;
  detail?: string;
}) {
  return (
    <div className="empty">
      <span>✦</span>
      <h3>{text}</h3>
      <p>{detail}</p>
    </div>
  );
}
export function MediaImage({
  url,
  alt,
  path,
}: {
  url?: string;
  alt: string;
  path?: string;
}) {
  const [src, setSrc] = useState(url || ""),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    const assetPath =
      path || (url?.startsWith("storage://") ? url.slice(10) : "");
    if (assetPath) {
      api<{ signedUrl: string }>(`media?path=${encodeURIComponent(assetPath)}`)
        .then((r) => setSrc(r.signedUrl))
        .catch(() => setFailed(true));
    } else setSrc(url || "");
  }, [path, url]);
  return src && !failed ? (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className="media-placeholder">
      <ImageIcon size={24} />
      <span>{failed ? "รูปนี้ยังเปิดไม่ได้" : "ช่วงเวลาที่รอเติมภาพ"}</span>
    </div>
  );
}
