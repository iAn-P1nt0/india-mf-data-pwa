import type { Metadata } from "next";

import { SipCalculator } from "@/components/sip/SipCalculator";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "SIP Calculator · India MF Data",
  description: "SEBI-compliant SIP calculator with backend parity and offline fallbacks."
};

export default function SipPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <SipCalculator />
        <section className={styles.copyCard}>
          <h2>How the math works</h2>
          <ul>
            <li>Formula: FV = P × [((1 + r)^n − 1) ÷ r] × (1 + r), where r is monthly rate and n is number of months.</li>
            <li>The UI calls `/api/portfolio/sip-calculator` for parity and only falls back to the audited client formula if the API is unreachable.</li>
            <li>Outputs are purely educational — historical or projected returns never guarantee future performance.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
