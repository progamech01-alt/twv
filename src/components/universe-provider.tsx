"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { State } from "@/lib/model";
import { browserDB, configured } from "@/lib/supabase";
import { demoState } from "@/lib/demo";
import { api } from "@/services/client";
type Context = {
  state: State | null;
  session: Session | null;
  demo: boolean;
  loading: boolean;
  error: string;
  offline: boolean;
  refresh: () => Promise<void>;
  enterDemo: () => void;
  exit: () => Promise<void>;
  notify: (text: string) => void;
};
const C = createContext<Context | null>(null);
export function useUniverse() {
  const value = useContext(C);
  if (!value) throw new Error("Provider missing");
  return value;
}
export function UniverseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null),
    [session, setSession] = useState<Session | null>(null),
    [demo, setDemo] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [offline, setOffline] = useState(false),
    [toast, setToast] = useState("");
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (demo) return;
    const request = ++generation.current;
    try {
      const data = await api<State>("state");
      if (request === generation.current) {
        setState(data);
        setError("");
      }
    } catch (e) {
      if (request === generation.current)
        setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [demo]);
  useEffect(() => {
    const db = browserDB();
    if (!db) {
      setLoading(false);
      return;
    }
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        generation.current++;
        setState(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!session || demo) return;
    void refresh();
    const db = browserDB()!;
    let debounce: ReturnType<typeof setTimeout>;
    const channel = db
      .channel("universe")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => void refresh(), 180);
      })
      .subscribe();
    const timer = setInterval(() => void refresh(), 60000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => {
      clearTimeout(debounce);
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      void db.removeChannel(channel);
    };
  }, [session, demo, refresh]);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  const exit = async () => {
    generation.current++;
    setDemo(false);
    setState(null);
    setSession(null);
    setLoading(false);
    await browserDB()?.auth.signOut();
  };
  return (
    <C.Provider
      value={{
        state,
        session,
        demo,
        loading,
        error,
        offline,
        refresh,
        enterDemo: () => {
          generation.current++;
          setDemo(true);
          setState(demoState());
          setLoading(false);
        },
        exit,
        notify: setToast,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </C.Provider>
  );
}
export function Login() {
  const { enterDemo } = useUniverse();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="login-scene">
      <div className="orb login-orb" aria-hidden="true" />
      <div className="login-panel">
        <div className="brand">
          <span className="brand-star">✦</span> TAWANVERSE <small>02</small>
        </div>
        <p className="eyebrow">A LITTLE UNIVERSE, JUST FOR US</p>
        <h1>
          เรื่องราวของเรา
          <br />
          <em>อยู่ที่นี่เสมอ</em>
        </h1>
        <p className="muted">
          เข้าสู่พื้นที่ส่วนตัว เพื่อเก็บความทรงจำ
          <br />
          และเขียนวันพรุ่งนี้ไปด้วยกัน
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const db = browserDB();
            if (!db) {
              setError(
                "ตั้งค่า .env.local ตามคู่มือ DEPLOY_TH.md ก่อนเข้าสู่ระบบ",
              );
              return;
            }
            setBusy(true);
            const f = new FormData(e.currentTarget);
            const { error } = await db.auth.signInWithPassword({
              email: String(f.get("email")),
              password: String(f.get("password")),
            });
            if (error) setError("เข้าสู่ระบบไม่สำเร็จ ตรวจอีเมลและรหัสผ่าน");
            setBusy(false);
          }}
        >
          <label>
            อีเมล
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            รหัสผ่าน
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={6}
            />
          </label>
          <button className="primary" disabled={busy}>
            {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่จักรวาลของเรา →"}
          </button>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </form>
        <button className="text-button" onClick={enterDemo}>
          ดูตัวอย่างหน้าตาเว็บ ↗
        </button>
        {!configured() && (
          <p className="tiny muted">
            ยังไม่ได้เชื่อมต่อฐานข้อมูล · ตัวอย่างไม่มีข้อมูลส่วนตัว
          </p>
        )}
      </div>
      <p className="login-footer">PRIVATE BY DESIGN · MADE OF LITTLE MOMENTS</p>
    </main>
  );
}
