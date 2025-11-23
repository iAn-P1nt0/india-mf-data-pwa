"use client";

import { useState } from "react";
import styles from "./DateRangePicker.module.css";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
  minDate?: string;
  maxDate?: string;
}

const PRESET_RANGES = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "3Y", days: 1095 },
  { label: "5Y", days: 1825 },
];

export function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  minDate,
  maxDate = new Date().toISOString().split("T")[0],
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetClick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    const startDateStr = start.toISOString().split("T")[0];
    const endDateStr = end.toISOString().split("T")[0];

    onDateChange(startDateStr, endDateStr);
    setShowCustom(false);
  };

  const handleCustomDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      onDateChange(value, endDate);
    } else {
      onDateChange(startDate, value);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.presets}>
        {PRESET_RANGES.map((range) => (
          <button
            key={range.label}
            className={styles.presetButton}
            onClick={() => handlePresetClick(range.days)}
          >
            {range.label}
          </button>
        ))}
        <button
          className={styles.presetButton}
          data-active={showCustom}
          onClick={() => setShowCustom(!showCustom)}
        >
          Custom
        </button>
      </div>

      {showCustom && (
        <div className={styles.customRange}>
          <div className={styles.dateInput}>
            <label htmlFor="start-date">From</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              max={endDate}
              min={minDate}
              onChange={(e) => handleCustomDateChange("start", e.target.value)}
            />
          </div>
          <div className={styles.dateInput}>
            <label htmlFor="end-date">To</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              min={startDate}
              max={maxDate}
              onChange={(e) => handleCustomDateChange("end", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
