"use client";

import { useState, useMemo } from "react";
import type { FundPreview } from "@/lib/types";
import styles from "./FundSelector.module.css";

interface FundSelectorProps {
  funds: FundPreview[];
  selectedFund: FundPreview | null;
  onSelectFund: (fund: FundPreview) => void;
  isLoading?: boolean;
}

export function FundSelector({ funds, selectedFund, onSelectFund, isLoading }: FundSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredFunds = useMemo(() => {
    if (!searchTerm.trim()) return funds;

    const term = searchTerm.toLowerCase();
    return funds.filter(
      (fund) =>
        fund.schemeName.toLowerCase().includes(term) ||
        fund.schemeCode.toString().includes(term) ||
        fund.fundHouse?.toLowerCase().includes(term) ||
        fund.schemeCategory?.toLowerCase().includes(term)
    );
  }, [funds, searchTerm]);

  const handleSelect = (fund: FundPreview) => {
    onSelectFund(fund);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={styles.container}>
      <div className={styles.selected} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.selectedContent}>
          {selectedFund ? (
            <>
              <div className={styles.selectedName}>{selectedFund.schemeName}</div>
              <div className={styles.selectedMeta}>
                {selectedFund.schemeCode} · {selectedFund.schemeCategory ?? "N/A"}
              </div>
            </>
          ) : (
            <div className={styles.placeholder}>Select a fund...</div>
          )}
        </div>
        <svg
          className={styles.chevron}
          data-open={isOpen}
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="2" />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, code, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>

          <div className={styles.fundList}>
            {isLoading ? (
              <div className={styles.loading}>Loading funds...</div>
            ) : filteredFunds.length === 0 ? (
              <div className={styles.noResults}>No funds found</div>
            ) : (
              filteredFunds.map((fund) => (
                <button
                  key={fund.schemeCode}
                  className={styles.fundItem}
                  data-selected={selectedFund?.schemeCode === fund.schemeCode}
                  onClick={() => handleSelect(fund)}
                >
                  <div className={styles.fundItemName}>{fund.schemeName}</div>
                  <div className={styles.fundItemMeta}>
                    <span>{fund.schemeCode}</span>
                    {fund.schemeCategory && <span> · {fund.schemeCategory}</span>}
                    {fund.fundHouse && <span> · {fund.fundHouse}</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
    </div>
  );
}
