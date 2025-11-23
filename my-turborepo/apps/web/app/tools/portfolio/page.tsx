import type { Metadata } from "next";

import { PortfolioWidget } from "@/components/portfolio/PortfolioWidget";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Offline Portfolio · India MF Data",
  description: "Client-side holdings tracker powered by IndexedDB + Dexie."
};

export default function PortfolioPage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <PortfolioWidget />
      </div>
    </div>
  );
}
