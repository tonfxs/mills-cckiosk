"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { OrderResult } from "@/app/types/neto-lookup";
import { Section } from "./Section";
import { Grid } from "./Grid";
import { Field } from "./Field";
import { ErrorBox } from "./ErrorBox";
import { OrderResults } from "./OrderResults";

type PartsLookupForm = {
  orderNumbersCsv: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
};

const INITIAL_FORM: PartsLookupForm = {
  orderNumbersCsv: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
};

function normalizeCsv(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/,\s+/g, ", ")
    .trim()
    .replace(/^,|,$/g, "");
}

function splitCsv(csv: string) {
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Lookup failed.";
}

export function PartsForm() {
  const [form, setForm] = useState<PartsLookupForm>(INITIAL_FORM);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OrderResult[] | null>(null);

  // Prevent race conditions if user clicks Search multiple times quickly
  const abortRef = useRef<AbortController | null>(null);

  const orderNumbers = useMemo(() => splitCsv(form.orderNumbersCsv), [form.orderNumbersCsv]);

  const canSearch = useMemo(() => {
    return (
      orderNumbers.length > 0 &&
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      form.phoneNumber.trim().length > 0 &&
      !loading
    );
  }, [orderNumbers.length, form.firstName, form.lastName, form.phoneNumber, loading]);

  const payload = useMemo(() => {
    return {
      orderNumbersCsv: form.orderNumbersCsv,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: form.phoneNumber.trim(),
    };
  }, [form]);

  const setField = useCallback(<K extends keyof PartsLookupForm>(key: K, value: PartsLookupForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  const onSearch = useCallback(async () => {
    if (!canSearch) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch("/api/admin/neto/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      // handle non-json responses gracefully
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore
      }

      if (!res.ok || !json?.ok) {
        const msg = json?.error || `Lookup failed (HTTP ${res.status}).`;
        throw new Error(msg);
      }

      setResults(json.results as OrderResult[]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [canSearch, payload]);

  return (
    <Section title="Parts Assistance Lookup" subtitle="Order Number(s) can be comma-separated.">
      <Grid>
        <Field
          label="Order Number(s) (comma-separated)"
          value={form.orderNumbersCsv}
          onChange={(v) => setField("orderNumbersCsv", normalizeCsv(v))}
          placeholder="N001001, N001002"
        />

        <Field
          label="First Name"
          value={form.firstName}
          onChange={(v) => setField("firstName", v)}
          placeholder="Juan"
        />

        <Field
          label="Last Name"
          value={form.lastName}
          onChange={(v) => setField("lastName", v)}
          placeholder="Dela Cruz"
        />

        <Field
          label="Phone Number"
          value={form.phoneNumber}
          onChange={(v) => setField("phoneNumber", v)}
          placeholder="+63..."
        />
      </Grid>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          disabled={!canSearch}
          onClick={onSearch}
          className={`px-5 py-3 rounded-xl text-sm font-bold transition ${
            canSearch
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-200 text-slate-500 cursor-not-allowed"
          }`}
        >
          {loading ? "Searching..." : "Search Neto"}
        </button>

        <button
          type="button"
          onClick={clearResults}
          disabled={loading}
          className={`px-5 py-3 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 transition ${
            loading ? "opacity-60 cursor-not-allowed" : "hover:bg-slate-50"
          }`}
        >
          Clear Results
        </button>
      </div>

      {error && <ErrorBox text={error} />}
      {results && <OrderResults results={results} />}
    </Section>
  );
}
