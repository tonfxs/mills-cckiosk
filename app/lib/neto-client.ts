// ✅ neto-client.ts

export type NetoError = {
  Ack?: "Error" | "Warning" | "Success";
  Errors?: Array<{ ErrorCode?: string; Description?: string }>;
  Warnings?: Array<{ WarningCode?: string; Description?: string }>;
  Messages?: { Error?: { Message?: string } };
};

/**
 * ✅ KIOSK-STRICT PARSER
 * - NO comma   -> single token only (reject spaces/newlines)
 * - WITH comma -> multiple allowed; split/trim/filter
 *               reject whitespace inside any entry (prevents "E1, M2 M3")
 */
export function parseOrderNumbersKioskStrict(raw: string) {
  const input = (raw ?? "").trim();

  if (!input) return { list: [] as string[], error: "Order number is required" };

  const hasComma = input.includes(",");

  // ✅ single entry mode (no commas)
  if (!hasComma) {
    const tokens = input.split(/\s+/).filter(Boolean);
    if (tokens.length > 1) {
      return {
        list: [],
        error: "If entering multiple order numbers, please separate them with a comma (,).",
      };
    }
    return { list: [input], error: null as string | null };
  }

  // ✅ multiple entry mode (commas)
  const list = input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (list.length === 0) return { list: [], error: "Order number is required" };

  // ✅ STRICT: no whitespace inside each entry
  for (const v of list) {
    if (/\s/.test(v)) {
      return {
        list: [],
        error: "Each order number must not contain spaces. Use commas only (e.g., E123, M456).",
      };
    }
  }

  return { list, error: null as string | null };
}

/**
 * ✅ Use this for routes that should accept SINGLE OR MULTIPLE (comma-separated)
 * Returns: string[] (1..n)
 */
export function requireOrderNumbersKioskStrict(raw: string) {
  const parsed = parseOrderNumbersKioskStrict(raw);
  if (parsed.error) throw new Error(parsed.error);

  const unique = new Set(parsed.list);
  if (unique.size !== parsed.list.length) {
    throw new Error("Duplicate order numbers detected. Each order number must be unique.");
  }

  return parsed.list; // ✅ can be multiple
}

/**
 * ✅ Use this ONLY for routes that must accept ONE order number only
 */
export function requireSingleOrderNumberKioskStrict(raw: string) {
  const list = requireOrderNumbersKioskStrict(raw);
  if (list.length !== 1) {
    throw new Error("Please enter only one order number for this action.");
  }
  return list[0];
}

export async function netoRequest<TResponse>(
  action: string,
  body: unknown,
  opts?: { timeoutMs?: number }
): Promise<TResponse> {
  const endpoint = process.env.NETO_API_URL?.trim();
  const username = process.env.NETO_API_USERNAME?.trim();
  const apiKey = process.env.NETO_API_KEY?.trim();

  if (!endpoint || !username || !apiKey) {
    console.error("[NETO ENV CHECK]", {
      NETO_API_URL: !!endpoint,
      NETO_API_USERNAME: !!username,
      NETO_API_KEY: !!apiKey,
    });
    throw new Error("Missing NETO env vars (NETO_API_URL, NETO_API_USERNAME, NETO_API_KEY).");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 12000);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        NETOAPI_ACTION: action,
        NETOAPI_USERNAME: username,
        NETOAPI_KEY: apiKey,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await res.text();

    let json: any;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Neto returned non-JSON response (HTTP ${res.status}). First chars: ${text.slice(0, 160)}`);
    }

    if (!res.ok) {
      const err = json as NetoError;
      throw new Error(err?.Errors?.[0]?.Description || err?.Messages?.Error?.Message || `Neto request failed (HTTP ${res.status}).`);
    }

    if (String(json?.Ack ?? "").toLowerCase() === "error") {
      const err = json as NetoError;
      throw new Error(err?.Errors?.[0]?.Description || err?.Messages?.Error?.Message || "Neto returned Ack=Error.");
    }

    return json as TResponse;
  } catch (e: any) {
    if (e?.name === "AbortError") throw new Error("Neto request timed out.");
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
