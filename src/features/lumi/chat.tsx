"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useUniverse } from "@/components/universe-provider";
import { api } from "@/services/client";
import type { Row } from "@/lib/model";
import { PageFrame } from "@/features/visitor/pages";
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  tools?: string[];
  drafts?: Row[];
  usage?: { inputTokens: number; outputTokens: number };
};
export function LumiChat({ studio = false }: { studio?: boolean }) {
  const u = useUniverse();
  const [mode, setMode] = useState<"ask" | "create" | "edit">(
      studio ? "edit" : "ask",
    ),
    [input, setInput] = useState(""),
    [messages, setMessages] = useState<ChatMessage[]>([]),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("ยังไม่ได้เชื่อมต่อ AI");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);
  const submit = async () => {
    const command = input.trim();
    if (!command || busy) return;
    if (u.demo) {
      u.notify("ตัวอย่างหน้าตาเท่านั้น · เข้าสู่ระบบเพื่อใช้ DeepSeek");
      return;
    }
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: command }]);
    try {
      const r = await api<{
        status: string;
        text: string;
        drafts: Row[];
        tools: string[];
        usage?: { inputTokens: number; outputTokens: number };
      }>("lumi", {
        command,
        mode,
        history: messages
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
      });
      setStatus(
        r.status === "online"
          ? "AI Online"
          : "AI Temporarily Offline · Offline Assist",
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: r.text,
          drafts: r.drafts,
          tools: r.tools,
          usage: r.usage,
        },
      ]);
      if (r.drafts.length) await u.refresh();
    } catch (e) {
      setStatus("เชื่อมต่อไม่สำเร็จ");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "ลองใหม่อีกครั้ง",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };
  const chat = (
    <div className={`lumi-workspace ${studio ? "studio-chat" : ""}`}>
      <div className="lumi-status">
        <span className="lumi-gem">✦</span>
        <div>
          <h2>LUMI</h2>
          <span>{status}</span>
        </div>
        {u.state?.role === "admin" && (
          <select
            aria-label="โหมด LUMI"
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="ask">ASK · ถามเรื่องของเรา</option>
            <option value="create">CREATE · สร้างร่าง</option>
            <option value="edit">EDIT SITE · ออกแบบเว็บ</option>
          </select>
        )}
      </div>
      <div className="chat-log" aria-live="polite">
        {!messages.length && (
          <div className="chat-welcome">
            <div className="lumi-gem big">✦</div>
            <h2>
              {studio
                ? "อยากให้จักรวาลของเราเป็นแบบไหน"
                : "มีเรื่องไหนให้ช่วยจำไหม"}
            </h2>
            <p className="muted">
              {studio
                ? "บอกสิ่งที่ต้องการ แล้วตรวจ Preview ก่อน Apply ได้เลย"
                : "ค้นหาข้อมูลที่บันทึกไว้ หรือชวนกันคิดถึงวันข้างหน้า"}
            </p>
            <div className="prompt-chips">
              {(studio
                ? [
                    "ทำหน้าแรกให้หวานขึ้น ใช้ฟ้าอ่อน ตัวอักษรใหญ่ขึ้น และลดการเคลื่อนไหว",
                    "เปลี่ยนคำโปรยหน้าความทรงจำให้อบอุ่น",
                    "ตะวันชอบอะไรบ้างจากข้อมูลที่บันทึกไว้",
                  ]
                : [
                    "วันนี้เราคบกันมากี่วันแล้ว",
                    "วันสำคัญถัดไปคือวันไหน",
                    "ตะวันชอบสีอะไร",
                  ]
              ).map((t) => (
                <button key={t} onClick={() => setInput(t)}>
                  {t}
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <article className={`message ${m.role}`} key={i}>
            <span className="eyebrow">
              {m.role === "user" ? "YOU" : "LUMI ✦"}
            </span>
            <p className="prose">{m.content}</p>
            {m.usage && (
              <p className="tiny muted">
                Tokens รวมคำสั่งนี้: เข้า {m.usage.inputTokens.toLocaleString()}{" "}
                · ออก {m.usage.outputTokens.toLocaleString()}
              </p>
            )}
            {!!m.tools?.length && (
              <details>
                <summary>ข้อมูลที่ LUMI ใช้ ({m.tools.length})</summary>
                <p className="tiny">
                  {Array.from(new Set(m.tools)).join(" · ")}
                </p>
              </details>
            )}
            {!!m.drafts?.length && (
              <div className="draft-links">
                <p>บันทึก {m.drafts.length} ร่าง · ยังไม่เผยแพร่</p>
                <Link href="/studio?tab=changes">
                  ตรวจ Preview / Apply ใน Studio →
                </Link>
              </div>
            )}
          </article>
        ))}
        {busy && (
          <p className="thinking">✦ LUMI กำลังค้นข้อมูลและเตรียมคำตอบ…</p>
        )}
        <div ref={bottom} />
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <textarea
          aria-label="คำสั่งถึง LUMI"
          placeholder={
            studio
              ? "บอก LUMI ว่าอยากได้หน้าเว็บแบบไหน…"
              : "ถาม LUMI หรือเล่าไอเดียใหม่…"
          }
          value={input}
          maxLength={3000}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <button
          className="primary"
          disabled={busy || !input.trim()}
          aria-label="ส่งคำสั่ง"
        >
          <Send size={18} />
        </button>
      </form>
      <p className="tiny muted chat-disclosure">
        ใช้ DeepSeek · ส่งเฉพาะคำสั่งและข้อมูลที่เกี่ยวข้อง · AI อาจผิดพลาด
        ควรตรวจข้อเสนอก่อนใช้
      </p>
    </div>
  );
  return studio ? chat : <PageFrame slug="lumi">{chat}</PageFrame>;
}
