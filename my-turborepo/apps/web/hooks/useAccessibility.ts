import { useEffect, useCallback } from 'react';

/**
 * Hook for enhancing accessibility features
 * Provides ARIA utilities, screen reader support, and focus management
 */

interface AccessibilityOptions {
  announceChanges?: boolean;
  manageFocus?: boolean;
  enableLiveRegion?: boolean;
}

/**
 * Announce content changes to screen readers
 */
export function useAriaLive(message: string, priority: 'polite' | 'assertive' = 'polite') {
  useEffect(() => {
    if (!message) return;

    // Find or create live region
    let liveRegion = document.getElementById('aria-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    } else {
      liveRegion.setAttribute('aria-live', priority);
    }

    // Announce message
    liveRegion.textContent = message;

    // Clear after announcement
    const timeout = setTimeout(() => {
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [message, priority]);
}

/**
 * Manage focus for modal dialogs, popovers, etc.
 */
export function useFocusTrap(elementRef: React.RefObject<HTMLDivElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !elementRef.current) return;

    const element = elementRef.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab on first element
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab on last element
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstElement.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [elementRef, isActive]);
}

/**
 * Announce page transitions to screen readers
 */
export function usePageAnnouncedTransition(title: string) {
  useEffect(() => {
    // Update page title for screen readers
    document.title = title;

    // Announce to screen readers
    const announcement = `Page loaded: ${title}`;
    useAriaLive(announcement, 'assertive');

    // Focus on main content
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainContent instanceof HTMLElement) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      mainContent.removeAttribute('tabindex');
    }
  }, [title]);
}

/**
 * Hook for accessible form validation
 */
export function useAccessibleFormValidation(
  fieldName: string,
  isValid: boolean,
  errorMessage?: string
) {
  const errorId = `${fieldName}-error`;

  const attributes = {
    'aria-invalid': !isValid,
    'aria-describedby': isValid ? undefined : errorId
  };

  return { attributes, errorId, ariaDescription: errorMessage };
}

/**
 * Hook for managing accessible lists
 */
export function useAccessibleList(
  itemCount: number,
  activeIndex: number,
  onSelect: (index: number) => void
) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      let newIndex = activeIndex;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (activeIndex + 1) % itemCount;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = (activeIndex - 1 + itemCount) % itemCount;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = itemCount - 1;
          break;
        default:
          return;
      }

      onSelect(newIndex);
    },
    [activeIndex, itemCount, onSelect]
  );

  return {
    handleKeyDown,
    role: 'listbox',
    'aria-label': 'Selectable list'
  };
}

/**
 * Hook for accessible expandable content
 */
export function useAccessibleExpandable(isExpanded: boolean, onChange: (expanded: boolean) => void) {
  const handleToggle = useCallback(() => {
    onChange(!isExpanded);
  }, [isExpanded, onChange]);

  return {
    triggerProps: {
      'aria-expanded': isExpanded,
      onClick: handleToggle
    },
    contentProps: {
      'aria-hidden': !isExpanded
    }
  };
}

/**
 * Enhance all buttons with proper ARIA labels
 */
export function useButtonAccessibility(label?: string, isDisabled?: boolean) {
  return {
    'aria-label': label,
    'aria-disabled': isDisabled
  };
}

/**
 * Announce successful actions to screen readers
 */
export function useSuccessAnnouncement(message: string, trigger: boolean) {
  useEffect(() => {
    if (trigger) {
      useAriaLive(message, 'assertive');
    }
  }, [trigger, message]);
}

/**
 * Skip link component helper
 */
export function useSkipLink(targetId: string) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target instanceof HTMLElement) {
        target.setAttribute('tabindex', '-1');
        target.focus();
      }
    },
    [targetId]
  );

  return {
    href: `#${targetId}`,
    onClick: handleClick,
    className: 'sr-only focus:not-sr-only'
  };
}

/**
 * Main accessibility hook for enhanced support
 */
export function useAccessibility(options: AccessibilityOptions = {}) {
  const { announceChanges = true, manageFocus = true, enableLiveRegion = true } = options;

  useEffect(() => {
    // Ensure live region exists
    if (enableLiveRegion) {
      const liveRegion = document.getElementById('aria-live-region');
      if (!liveRegion) {
        const div = document.createElement('div');
        div.id = 'aria-live-region';
        div.setAttribute('aria-live', 'polite');
        div.setAttribute('aria-atomic', 'true');
        div.className = 'sr-only';
        document.body.appendChild(div);
      }
    }

    // Enhance all images without alt text
    const images = document.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      if (img.classList.contains('decorative')) {
        img.setAttribute('aria-hidden', 'true');
      } else {
        img.setAttribute('alt', 'Image');
      }
    });

    // Add labels to form inputs without them
    const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
    inputs.forEach((input, index) => {
      const label = input.getAttribute('placeholder') || 'Input field';
      input.setAttribute('aria-label', label);
    });
  }, [announceChanges, enableLiveRegion]);

  return {
    ariaLive: useAriaLive,
    focusTrap: useFocusTrap,
    formValidation: useAccessibleFormValidation,
    list: useAccessibleList,
    expandable: useAccessibleExpandable,
    button: useButtonAccessibility
  };
}
