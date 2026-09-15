import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resources,
  type State,
  type Row,
  type Resource,
  type Change,
} from "@/lib/model";
export class UniverseRepository {
  constructor(readonly db: SupabaseClient) {}
  async list(resource: Resource, limit = 500) {
    const { data, error } = await this.db
      .from(`tv_${resource}`)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return data as Row[];
  }
  async one(resource: Resource, id: string) {
    const { data, error } = await this.db
      .from(`tv_${resource}`)
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return data as Row;
  }
  async state(role: "admin" | "viewer") {
    const pairs = await Promise.all(
      resources.map(async (r) => [r, await this.list(r)] as const),
    );
    const result = Object.fromEntries(pairs);
    for (const r of ["versions", "changes"]) {
      if (role === "admin") {
        const { data, error } = await this.db
          .from(`tv_${r}`)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw new Error(error.message);
        result[r] = data as Row[];
      } else result[r] = [];
    }
    return { ...result, role, serverTime: new Date().toISOString() } as State;
  }
  async mutate(change: Change) {
    return this.rpc("tv_mutate", {
      p_resource: change.resource,
      p_id: change.id,
      p_expected: change.expected_revision,
      p_patch: change.patch,
      p_action: change.action,
    });
  }
  async rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await this.db.rpc(name, args);
    if (error) throw new Error(error.message);
    return data;
  }
  async draft(change: Change, title: string) {
    const { data, error } = await this.db
      .from("tv_changes")
      .insert({
        title,
        resource: change.resource,
        entity_id: change.id,
        expected_revision: change.expected_revision,
        patch: change.patch,
        action: change.action,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Row;
  }
}
