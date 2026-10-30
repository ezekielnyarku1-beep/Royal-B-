/** Recognise existing Supabase email-return links without reading or storing tokens. */
export function isLegacyAuthReturn(search: string, hash: string): boolean {
  const query = new URLSearchParams(search);
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  return ["code", "token_hash", "error", "error_code"].some(key => query.has(key))
    || ["access_token", "refresh_token", "error", "error_description"].some(key => fragment.has(key))
    || fragment.get("type") === "recovery";
}
