"use client";

import { FormEvent, useState } from "react";

import { usePortfolioStore } from "@/hooks/usePortfolioStore";
import type { PortfolioHolding } from "@/lib/types";

import styles from "./PortfolioWidget.module.css";

type DraftHolding = Omit<PortfolioHolding, "id" | "createdAt" | "updatedAt">;

const EMPTY_FORM: DraftHolding = {
  schemeCode: "",
  schemeName: "",
  units: 0,
  avgNav: 0,
  notes: ""
};

const NUMERIC_FIELDS = new Set<keyof DraftHolding>(["units", "avgNav"]);

export function PortfolioWidget() {
  const { holdings, summary, addOrUpdate, remove, loading, error } = usePortfolioStore();
  const [form, setForm] = useState<DraftHolding>(EMPTY_FORM);
  const [clientError, setClientError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate(form);
    if (validation) {
      setClientError(validation);
      return;
    }
    setClientError(undefined);
    await addOrUpdate(form);
    setForm(EMPTY_FORM);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: NUMERIC_FIELDS.has(name as keyof DraftHolding) ? Number(value) : value
    }));
  }

  return (
    <div className={styles.card}>
      <header>
        <p className={styles.eyebrow}>Offline portfolio</p>
        <h1>Client-side holdings vault</h1>
        <p>
          Everything you track here stays on this device via IndexedDB. Export/import wiring will land once CAS parsing
          ships; for now you can add SIPs and monitor contributions instantly even when Render is asleep.
        </p>
      </header>
      <section className={styles.summary} aria-live="polite">
        <div>
          <p>Total schemes</p>
          <strong data-testid="total-holdings">{summary.totalHoldings}</strong>
        </div>
        <div>
          <p>Total units</p>
          <strong>{summary.totalUnits.toFixed(2)}</strong>
        </div>
        <div>
          <p>Total invested (₹)</p>
          <strong data-testid="total-invested">{summary.totalInvested.toFixed(2)}</strong>
        </div>
        <div>
          <p>Avg. cost (₹)</p>
          <strong>{summary.averageCost.toFixed(2)}</strong>
        </div>
      </section>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Scheme code
          <input
            name="schemeCode"
            value={form.schemeCode}
            onChange={handleChange}
            placeholder="e.g. 118834"
            required
          />
        </label>
        <label>
          Scheme name
          <input
            name="schemeName"
            value={form.schemeName}
            onChange={handleChange}
            placeholder="Fund name"
            required
          />
        </label>
        <label>
          Units held
          <input
            name="units"
            type="number"
            step="0.01"
            min="0"
            value={form.units}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Avg NAV (₹)
          <input
            name="avgNav"
            type="number"
            step="0.01"
            min="0"
            value={form.avgNav}
            onChange={handleChange}
            required
          />
        </label>
        <label className={styles.notesField}>
          Notes
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} placeholder="Optional" />
        </label>
        {clientError && <p className={styles.error}>{clientError}</p>}
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={loading}>
          {loading ? "Saving…" : "Save holding"}
        </button>
      </form>
      <section className={styles.list}>
        <header>
          <h2>Your holdings</h2>
          <p>Everything stays offline; removing rows deletes from IndexedDB instantly.</p>
        </header>
        {!holdings.length && <p>No holdings yet. Add your first SIP above.</p>}
        <ul>
          {holdings.map((holding) => (
            <li key={holding.schemeCode}>
              <div>
                <strong>{holding.schemeName}</strong>
                <p>
                  {holding.schemeCode} · {holding.units} units @ ₹{holding.avgNav}
                </p>
                {holding.notes && <p className={styles.notes}>{holding.notes}</p>}
              </div>
              <button type="button" onClick={() => remove(holding.schemeCode)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function validate(values: DraftHolding) {
  if (!values.schemeCode.trim()) {
    return "Scheme code is required";
  }
  if (!values.schemeName.trim()) {
    return "Scheme name is required";
  }
  if (values.units <= 0) {
    return "Units must be greater than zero.";
  }
  if (values.avgNav <= 0) {
    return "Average NAV must be greater than zero.";
  }
  return undefined;
}
