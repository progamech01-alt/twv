import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runLumi } from "../src/services/ai-service";
const db = {
  from: (table: string) => ({
    select: () => ({
      order: () => ({
        limit: async () => ({
          data:
            table === "tv_facts"
              ? [
                  {
                    id: "fact",
                    key: "relationship_start",
                    value: "2026-08-29",
                    title: "start",
                  },
                ]
              : [],
          error: null,
        }),
      }),
    }),
  }),
} as unknown as SupabaseClient;
test("LUMI missing provider key explicitly falls back without fetching", async () => {
  const old = process.env.DEEPSEEK_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  try {
    const r = await runLumi(db, "viewer", "วันนี้วันที่เท่าไร", "ask");
    assert.equal(r.status, "offline");
    assert.match(r.text, /Offline Assist/);
    assert.match(r.text, /Asia\/Bangkok/);
    assert.equal(r.drafts.length, 0);
  } finally {
    if (old) process.env.DEEPSEEK_API_KEY = old;
  }
});
test("provider failure leaves deterministic website assistance available", async () => {
  const oldKey = process.env.DEEPSEEK_API_KEY,
    oldFetch = globalThis.fetch;
  process.env.DEEPSEEK_API_KEY = "test-not-a-real-key";
  globalThis.fetch = async () => new Response("", { status: 503 });
  try {
    const r = await runLumi(db, "viewer", "hello", "ask");
    assert.equal(r.status, "offline");
    assert.equal(r.drafts.length, 0);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey) process.env.DEEPSEEK_API_KEY = oldKey;
    else delete process.env.DEEPSEEK_API_KEY;
  }
});
test("tool round gets real server time; viewer has no edit tool", async () => {
  const oldKey = process.env.DEEPSEEK_API_KEY,
    oldFetch = globalThis.fetch;
  process.env.DEEPSEEK_API_KEY = "test-not-a-real-key";
  let round = 0;
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(
      body.tools.some(
        (t: { function: { name: string } }) =>
          t.function.name === "proposeChange",
      ),
      false,
    );
    if (round++ === 0)
      return Response.json({
        choices: [
          {
            message: {
              role: "assistant",
              content: null,
              tool_calls: [
                {
                  id: "tool1",
                  type: "function",
                  function: { name: "getCurrentTime", arguments: "{}" },
                },
              ],
            },
          },
        ],
      });
    const tool = body.messages.find((m: { role: string }) => m.role === "tool");
    assert.equal(JSON.parse(tool.content).TIMEZONE, "Asia/Bangkok");
    return Response.json({
      choices: [
        { message: { role: "assistant", content: "เวลาจากเซิร์ฟเวอร์" } },
      ],
      usage: { prompt_tokens: 100, completion_tokens: 10 },
    });
  };
  try {
    const r = await runLumi(db, "viewer", "วันนี้วันที่เท่าไร", "ask");
    assert.equal(r.status, "online");
    assert.deepEqual(r.tools, ["getCurrentTime"]);
    assert.equal(round, 2);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldKey) process.env.DEEPSEEK_API_KEY = oldKey;
    else delete process.env.DEEPSEEK_API_KEY;
  }
});
