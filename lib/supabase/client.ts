"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  browserClient ??= createBrowserClient(config.url, config.anonKey);
  return browserClient;
}
