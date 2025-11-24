/**
 * Color mapping utilities for heatmap visualizations
 * Maps numeric values to colors on a gradient scale
 */

export interface ColorScale {
  value: number;
  color: string;
  opacity: number;
}

/**
 * Get color for a return value on a -30% to +30% scale
 * Green for positive, red for negative, white/neutral for zero
 */
export function getReturnColor(value: number): { color: string; opacity: number } {
  // Clamp value to -30 to +30 range
  const clamped = Math.max(-30, Math.min(30, value));

  // If negative
  if (clamped < 0) {
    // -30% to 0%
    const intensity = (clamped + 30) / 30; // 0 to 1
    // Red intensity: 1 (at -30%) to 0 (at 0%)
    if (intensity > 0.5) {
      // -30% to -15%: dark red (#ef4444)
      return {
        color: '#ef4444',
        opacity: 1
      };
    } else {
      // -15% to 0%: light red (#fca5a5)
      return {
        color: '#fca5a5',
        opacity: 1
      };
    }
  }

  // If positive
  if (clamped > 0) {
    // 0% to +30%
    const intensity = clamped / 30; // 0 to 1
    if (intensity < 0.33) {
      // 0% to +10%: light green (#fef3c7)
      return {
        color: '#fef3c7',
        opacity: 1
      };
    } else if (intensity < 0.66) {
      // +10% to +20%: medium green (#86efac)
      return {
        color: '#86efac',
        opacity: 1
      };
    } else {
      // +20% to +30%: dark green (#22c55e)
      return {
        color: '#22c55e',
        opacity: 1
      };
    }
  }

  // Neutral (0%)
  return {
    color: '#f3f4f6',
    opacity: 1
  };
}

/**
 * Get a continuous color on a gradient
 * More precise than getReturnColor, using interpolation
 */
export function getGradientColor(value: number, min: number, max: number): string {
  // Clamp value to min-max range
  const clamped = Math.max(min, Math.min(max, value));

  // Normalize to 0-1 range
  const normalized = (clamped - min) / (max - min);

  // Color stops: red -> yellow -> green
  if (normalized < 0.5) {
    // Red to yellow: 0 to 0.5
    const ratio = normalized * 2; // 0 to 1
    const red = 255;
    const green = Math.round(165 * ratio); // 0 to 165
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    // Yellow to green: 0.5 to 1
    const ratio = (normalized - 0.5) * 2; // 0 to 1
    const red = Math.round(255 * (1 - ratio)); // 255 to 0
    const green = 165 + Math.round(90 * ratio); // 165 to 255
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  }
}

/**
 * Get background and text color based on return value
 */
export function getCellStyles(value: number): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
} {
  const { color } = getReturnColor(value);

  // Determine if we need dark or light text
  const isDarkBackground = [
    '#ef4444', // red-500
    '#22c55e', // green-500
    '#1f2937' // gray-900
  ].includes(color);

  return {
    backgroundColor: color,
    textColor: isDarkBackground ? '#ffffff' : '#000000',
    borderColor: '#e5e7eb'
  };
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  if (isNaN(value)) return 'N/A';
  return `${(value > 0 ? '+' : '')}${value.toFixed(decimals)}%`;
}

/**
 * Get performance level description
 */
export function getPerformanceLevel(
  value: number
): 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor' {
  if (value >= 20) return 'Excellent';
  if (value >= 10) return 'Good';
  if (value >= 0) return 'Average';
  if (value >= -10) return 'Poor';
  return 'Very Poor';
}
