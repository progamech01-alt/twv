"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef, type ReactNode } from "react";
import {
  House,
  Route,
  Images,
  CalendarDays,
  Mail,
  Sparkles,
  SlidersHorizontal,
  LogOut,
  Volume2,
  VolumeX,
  Settings,
} from "lucide-react";
import { useUniverse, Login } from "./universe-provider";
import { Modal } from "./primitives";
import { api } from "@/services/client";
const links = [
  ["home", "Home", House],
  ["journey", "Journey", Route],
  ["memories", "Memories", Images],
  ["time", "Time", CalendarDays],
  ["letters", "Letters", Mail],
  ["lumi", "LUMI", Sparkles],
] as const;
export function Shell({ children }: { children: ReactNode }) {
  const u = useUniverse(),
    path = usePathname(),
    page = path.split("/")[1] || "home";
  const [settings, setSettings] = useState(false),
    [reduce, setReduce] = useState(false),
    [intro, setIntro] = useState(false),
    [quality, setQuality] = useState("balanced"),
    [playing, setPlaying] = useState(false),
    [volume, setVolume] = useState(0.3);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    setReduce(
      localStorage.getItem("tv-reduced") === "true" ||
        matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setQuality(localStorage.getItem("tv-quality") || "balanced");
    setVolume(Number(localStorage.getItem("tv-volume") || 0.3));
  }, []);
  useEffect(() => {
    document.documentElement.dataset.motion = reduce ? "none" : "on";
    document.documentElement.dataset.quality = quality;
    localStorage.setItem("tv-reduced", String(reduce));
    localStorage.setItem("tv-quality", quality);
  }, [reduce, quality]);
  useEffect(() => {
    if (u.state && !u.demo && !localStorage.getItem("tv-intro")) setIntro(true);
  }, [u.state, u.demo]);
  const tracks = u.state?.music || [],
    track =
      tracks.find((t) => t.scene === page) ||
      tracks.find((t) => t.scene === "all");
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    let active = true;
    el.pause();
    const url = String(track?.url || "");
    if (!url) {
      setPlaying(false);
      return;
    }
    const load = async () => {
      try {
        const source = url.startsWith("storage://")
          ? (
              await api<{ signedUrl: string }>(
                `media?path=${encodeURIComponent(url.slice(10))}`,
              )
            ).signedUrl
          : url;
        if (!active) return;
        el.src = source;
        el.volume = Math.min(1, volume * Number(track?.volume ?? 1));
        if (playing) await el.play();
      } catch {
        if (active) {
          setPlaying(false);
          u.notify("เปิดเพลงไม่ได้ ตรวจลิงก์หรือแตะปุ่มเสียงอีกครั้ง");
        }
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [track?.url]);
  useEffect(() => {
    if (audio.current)
      audio.current.volume = Math.min(1, volume * Number(track?.volume ?? 1));
    localStorage.setItem("tv-volume", String(volume));
  }, [volume, track?.volume]);
  if (u.loading && !u.state)
    return (
      <main className="loading">
        <span className="brand-star">✦</span>
        <p>กำลังเปิดจักรวาล…</p>
      </main>
    );
  if (!u.state) {
    if (u.session && u.error)
      return (
        <main className="loading">
          <h1>ยังเปิดข้อมูลไม่ได้</h1>
          <p>{u.error}</p>
          <button onClick={() => void u.refresh()}>ลองอีกครั้ง</button>
          <button onClick={() => void u.exit()}>ออกจากระบบ</button>
        </main>
      );
    return <Login />;
  }
  const toggleAudio = () => {
    const el = audio.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else if (track?.url) {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => u.notify("เปิดเพลงไม่ได้ ตรวจลิงก์หรือเลือกไฟล์ใหม่"));
    } else u.notify("ยังไม่มีเพลง เพิ่มเพลงใน Studio ได้เลย");
  };
  return (
    <div className="universe-shell">
      <div className="starfield" aria-hidden="true" />
      {u.demo && (
        <div className="demo-banner">
          โหมดดูตัวอย่าง · ข้อมูลสมมติ · บันทึกและ AI ไม่ทำงาน{" "}
          <button onClick={() => void u.exit()}>กลับไปเข้าสู่ระบบ</button>
        </div>
      )}
      {u.offline && (
        <div className="notice" role="status">
          ออฟไลน์ · ข้อมูลอาจไม่ล่าสุด การบันทึกต้องเชื่อมต่ออินเทอร์เน็ต
        </div>
      )}
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-star">✦</span> TAWANVERSE <small>02</small>
        </Link>
        <nav aria-label="เมนูหลัก">
          {links.map(([key, label, Icon]) => (
            <Link
              key={key}
              href={key === "home" ? "/" : `/${key}`}
              className={page === key ? "active" : ""}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            aria-label={playing ? "ปิดเพลง" : "เปิดเพลง"}
            className="icon-button"
            onClick={toggleAudio}
          >
            {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            aria-label="การตั้งค่า"
            className="icon-button"
            onClick={() => setSettings(true)}
          >
            <Settings size={18} />
          </button>
          {u.state.role === "admin" && (
            <Link href="/studio" className="studio-link" aria-label="Studio">
              <SlidersHorizontal size={16} />
              <span>Studio</span>
            </Link>
          )}
        </div>
      </header>
      {u.error && (
        <div className="notice" role="alert">
          {u.error} <button onClick={() => void u.refresh()}>โหลดใหม่</button>
        </div>
      )}
      <main className="main-content" key={page}>
        {children}
      </main>
      <footer className="footer">
        <span>
          TAWANVERSE <i>✦</i> OUR LITTLE INFINITY
        </span>
        <span>ทุกช่วงเวลา มีความหมายเสมอ</span>
      </footer>
      <audio
        ref={audio}
        loop
        preload="none"
        onError={() => {
          setPlaying(false);
          u.notify("โหลดเพลงไม่ได้");
        }}
      />
      {settings && (
        <Modal title="ปรับบรรยากาศของคุณ" onClose={() => setSettings(false)}>
          <div className="form-grid">
            <label className="check">
              <input
                type="checkbox"
                checked={reduce}
                onChange={(e) => setReduce(e.target.checked)}
              />
              ลดการเคลื่อนไหว
            </label>
            <label>
              คุณภาพภาพ
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
              >
                <option value="high">High</option>
                <option value="balanced">Balanced</option>
                <option value="lite">Lite</option>
              </select>
            </label>
            <label>
              ระดับเสียง
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
              />
            </label>
            <button
              onClick={() => {
                setSettings(false);
                setIntro(true);
              }}
            >
              ดูฉากเปิดอีกครั้ง
            </button>
            <button onClick={() => void u.exit()}>
              <LogOut size={16} /> ออกจากระบบ
            </button>
          </div>
        </Modal>
      )}
      {intro && (
        <div
          className="intro"
          role="dialog"
          aria-modal="true"
          aria-label="ยินดีต้อนรับ"
        >
          <div className="orb" />
          <p className="eyebrow">TWO LIGHTS. ONE UNIVERSE.</p>
          <h1>TAWANVERSE</h1>
          <p>จากวันแรก สู่ทุกวันที่มีเรา</p>
          <button
            className="primary"
            onClick={() => {
              localStorage.setItem("tv-intro", "done");
              setIntro(false);
              if (track?.url) toggleAudio();
            }}
          >
            เข้าสู่จักรวาลของเรา
          </button>
          <button
            className="text-button"
            onClick={() => {
              localStorage.setItem("tv-intro", "done");
              setIntro(false);
            }}
          >
            ข้าม
          </button>
        </div>
      )}
    </div>
  );
}
