import { useEffect, useRef } from 'react';

/**
 * usePolling: runs a callback on an interval and cleans up automatically
 */
export function usePolling(callback, intervalMs = 30000, enabled = true) {
	const savedCallback = useRef(callback);

	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	useEffect(() => {
		if (!enabled || typeof window === 'undefined') return;
		const id = setInterval(() => {
			try {
				savedCallback.current?.();
			} catch (e) {
				// swallow errors to avoid breaking interval
			}
		}, intervalMs);
		return () => clearInterval(id);
	}, [intervalMs, enabled]);
}

/**
 * Placeholder for Echo/WebSocket channel subscription
 * Example usage to be implemented when backend broadcasting is configured
 */
export function subscribeChannel(/* channelName, eventName, handler */) {
	// no-op for now; implement Laravel Echo here when available
	return () => {};
}
