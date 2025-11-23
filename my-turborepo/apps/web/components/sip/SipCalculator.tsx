"use client";

import { FormEvent, useState } from "react";

import { useSipCalculator } from "@/hooks/useSipCalculator";
import type { SipInput } from "@/lib/types";

import styles from "./SipCalculator.module.css";

const DEFAULT_VALUES: SipInput = {
  monthlyContribution: 5000,
  durationYears: 10,
  expectedRate: 12
};

export function SipCalculator() {
  const [form, setForm] = useState<SipInput>(DEFAULT_VALUES);
  const [clientError, setClientError] = useState<string>();
  const { calculateAsync, projection, status, source, disclaimer, usedServerResult } = useSipCalculator();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validate(form);
    if (validation) {
      setClientError(validation);
      return;
    }
    setClientError(undefined);
    await calculateAsync(form);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: Number(value)
    }));
  }

  return (
    <div className={styles.card}>
      <header>
        <p className={styles.eyebrow}>Tools</p>
        <h1>SIP calculator</h1>
        <p>
          Mirrors the backend formula for parity. When the API is reachable we use its response; otherwise we predict via
          the audited client formula noted in Technical FAQ.
        </p>
      </header>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Monthly contribution (₹)
          <input
            name="monthlyContribution"
            type="number"
            min={100}
            step={100}
            value={form.monthlyContribution}
            onChange={handleChange}
            aria-label="Monthly contribution"
            required
          />
        </label>
        <label>
          Duration (years)
          <input
            name="durationYears"
            type="number"
            min={1}
            max={40}
            value={form.durationYears}
            onChange={handleChange}
            aria-label="Duration in years"
            required
          />
        </label>
        <label>
          Expected annual return (%)
          <input
            name="expectedRate"
            type="number"
            min={1}
            max={20}
            step={0.1}
            value={form.expectedRate}
            onChange={handleChange}
            aria-label="Expected annual return"
            required
          />
        </label>
        {clientError && <p className={styles.error}>{clientError}</p>}
        <button type="submit" className={styles.submit} disabled={status === "pending"}>
          {status === "pending" ? "Calculating…" : "Calculate"}
        </button>
      </form>
      <section className={styles.results} aria-live="polite">
        <div>
          <p className={styles.metricLabel}>Total invested</p>
          <p className={styles.metricValue} data-testid="total">
            {projection ? `₹${projection.totalInvestment.toLocaleString("en-IN")}` : "--"}
          </p>
        </div>
        <div>
          <p className={styles.metricLabel}>Maturity value</p>
          <p className={styles.metricValue} data-testid="maturity">
            {projection ? `₹${projection.maturityValue.toFixed(2)}` : "--"}
          </p>
        </div>
        <div>
          <p className={styles.metricLabel}>Gains</p>
          <p className={styles.metricValue} data-testid="gains">
            {projection ? `₹${projection.gains.toFixed(2)}` : "--"}
          </p>
        </div>
      </section>
      <section className={styles.meta}>
        <p>
          Source: <strong>{source ?? "client-fallback"}</strong> · {usedServerResult ? "Server" : "Client"} formula used
        </p>
        <p className={styles.disclaimer}>{disclaimer}</p>
      </section>
    </div>
  );
}

function validate(values: SipInput) {
  if (values.monthlyContribution <= 0) {
    return "Contribution must be positive.";
  }
  if (values.durationYears <= 0) {
    return "Duration must be at least one year.";
  }
  if (values.expectedRate <= 0) {
    return "Expected return must be positive.";
  }
  return undefined;
}
