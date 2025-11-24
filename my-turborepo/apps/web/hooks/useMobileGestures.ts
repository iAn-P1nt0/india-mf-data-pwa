import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for handling mobile touch gestures
 * Supports: swipe (left/right/up/down), pull-to-refresh, pinch zoom
 */

interface GestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPullToRefresh?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number; // minimum distance in pixels
  velocityThreshold?: number; // minimum velocity
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export function useMobileGestures(
  elementRef: React.RefObject<HTMLElement>,
  config: GestureConfig
) {
  const startPointRef = useRef<TouchPoint | null>(null);
  const lastPointRef = useRef<TouchPoint | null>(null);
  const distanceRef = useRef(0);
  const refreshTriggeredRef = useRef(false);

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullToRefresh,
    onPinch,
    threshold = 50,
    velocityThreshold = 0.5
  } = config;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (!touch) return;
      startPointRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now()
      };
      lastPointRef.current = startPointRef.current;
      refreshTriggeredRef.current = false;
    } else if (e.touches.length === 2) {
      // Calculate initial distance between two fingers for pinch
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      if (!touch1 || !touch2) return;
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      distanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!startPointRef.current) return;

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (!touch) return;
        lastPointRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          timestamp: Date.now()
        };

        const deltaY = touch.clientY - startPointRef.current.y;

        // Pull to refresh detection - only at top of page
        if (window.scrollY === 0 && deltaY > 50) {
          if (!refreshTriggeredRef.current) {
            refreshTriggeredRef.current = true;
            onPullToRefresh?.();
          }
        }
      } else if (e.touches.length === 2) {
        // Pinch zoom gesture
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        if (!touch1 || !touch2) return;
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);

        if (distanceRef.current > 0) {
          const scale = newDistance / distanceRef.current;
          onPinch?.(scale);
        }
      }
    },
    [onPullToRefresh, onPinch]
  );

  const handleTouchEnd = useCallback(() => {
    if (!startPointRef.current || !lastPointRef.current) return;

    const deltaX = lastPointRef.current.x - startPointRef.current.x;
    const deltaY = lastPointRef.current.y - startPointRef.current.y;
    const deltaTime = lastPointRef.current.timestamp - startPointRef.current.timestamp;
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / (deltaTime || 1);

    // Only trigger swipe if threshold met and velocity sufficient
    const distance = Math.abs(deltaX) + Math.abs(deltaY);
    const isFastSwipe = velocity >= velocityThreshold;
    const isSignificantMovement = distance >= threshold;

    if (isSignificantMovement || isFastSwipe) {
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontal) {
        if (deltaX > 0) {
          // Swiped right
          onSwipeRight?.();
        } else {
          // Swiped left
          onSwipeLeft?.();
        }
      } else {
        if (deltaY > 0) {
          // Swiped down
          onSwipeDown?.();
        } else {
          // Swiped up
          onSwipeUp?.();
        }
      }
    }

    startPointRef.current = null;
    lastPointRef.current = null;
    refreshTriggeredRef.current = false;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, elementRef]);
}

/**
 * Hook for handling scroll-to-refresh on mobile
 */
export function useScrollRefresh(onRefresh: () => void, triggerDistance = 100) {
  useEffect(() => {
    let startY = 0;
    let isRefreshing = false;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startY = touch?.clientY || 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY !== 0) return;

      const touch = e.touches[0];
      const currentY = touch?.clientY || 0;
      const diff = currentY - startY;

      if (diff > triggerDistance && !isRefreshing) {
        isRefreshing = true;
        onRefresh();
      }
    };

    const handleTouchEnd = () => {
      isRefreshing = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, triggerDistance]);
}

/**
 * Hook for detecting swipe on a specific element
 */
export function useSwipe(
  elementRef: React.RefObject<HTMLElement>,
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  threshold = 50
) {
  const touchStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;

      const touchEnd = {
        x: touch.clientX,
        y: touch.clientY
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          onSwipe(deltaX > 0 ? 'right' : 'left');
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          onSwipe(deltaY > 0 ? 'down' : 'up');
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipe, threshold]);
}

/**
 * Hook for long-press gesture (press and hold)
 */
export function useLongPress(
  elementRef: React.RefObject<HTMLElement>,
  onLongPress: () => void,
  duration = 500
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = () => {
      timerRef.current = setTimeout(() => {
        onLongPress();
      }, duration);
    };

    const handleTouchEnd = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [elementRef, onLongPress, duration]);
}
