"use client";

import { ReactLenis } from "lenis/react";
import { ReactNode, useEffect } from "react";

interface SmoothScrollProviderProps {
	children: ReactNode;
}

// Extracted to module level to avoid recreating the options object on every render,
// which would cause ReactLenis to reinitialize unnecessarily.
const LENIS_OPTIONS = {
	duration: 1.2,
	// Exponential ease-out: fast start, smooth deceleration
	easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
	orientation: "vertical" as const,
	gestureOrientation: "vertical" as const,
	smoothWheel: true,
	wheelMultiplier: 1.0,
	infinite: false,
};

/**
 * Walks up the DOM from `target` and returns the first ancestor element
 * that can scroll in the given direction, or null if none is found.
 *
 * Avoids calling getComputedStyle more than once per ancestor by reading
 * both overflow axes in a single call and branching based on scroll direction.
 */
function findScrollableAncestor(
	target: HTMLElement | null,
	isVertical: boolean
): HTMLElement | null {
	while (target && target !== document.body && target !== document.documentElement) {
		const style = window.getComputedStyle(target);

		if (isVertical) {
			const overflowY = style.overflowY;
			if (
				(overflowY === "auto" || overflowY === "scroll") &&
				target.scrollHeight > target.clientHeight
			) {
				return target;
			}
		} else {
			const overflowX = style.overflowX;
			if (
				(overflowX === "auto" || overflowX === "scroll") &&
				target.scrollWidth > target.clientWidth
			) {
				return target;
			}
		}

		target = target.parentElement;
	}
	return null;
}

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
	useEffect(() => {
		// Use capture phase so we intercept the event before it reaches Lenis
		// (which listens on `window`). stopPropagation in the bubble phase on
		// `document` would NOT prevent window listeners from firing.
		const handleWheel = (e: WheelEvent) => {
			const isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
			const scrollable = findScrollableAncestor(e.target as HTMLElement, isVertical);
			if (scrollable) {
				e.stopPropagation();
			}
		};

		let touchStartPageX = 0;
		let touchStartPageY = 0;

		const handleTouchStart = (e: TouchEvent) => {
			const touch = e.touches[0];
			if (touch) {
				touchStartPageX = touch.pageX;
				touchStartPageY = touch.pageY;
			}
		};

		const handleTouchMove = (e: TouchEvent) => {
			const touch = e.touches[0];
			if (!touch) return;

			const deltaX = touch.pageX - touchStartPageX;
			const deltaY = touch.pageY - touchStartPageY;
			const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

			const scrollable = findScrollableAncestor(e.target as HTMLElement, isVertical);
			if (scrollable) {
				e.stopPropagation();
			}
		};

		// `capture: true` ensures we intercept events in the capture phase,
		// before they reach Lenis listeners attached on `window`.
		document.addEventListener("wheel", handleWheel, { capture: true, passive: true });
		document.addEventListener("touchstart", handleTouchStart, { passive: true });
		document.addEventListener("touchmove", handleTouchMove, { capture: true, passive: true });

		return () => {
			document.removeEventListener("wheel", handleWheel, { capture: true });
			document.removeEventListener("touchstart", handleTouchStart);
			document.removeEventListener("touchmove", handleTouchMove, { capture: true });
		};
	}, []);

	return (
		<ReactLenis root options={LENIS_OPTIONS}>
			{children}
		</ReactLenis>
	);
}
