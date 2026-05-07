"use client";

import { useEffect, useRef, useState } from "react";
import { idbGet, idbSet } from "./idbCache";

export interface CachedFetchOptions {
  /** Treat cached data as fresh for this many ms — within window we skip the network entirely. */
  freshFor?: number;
  /** Discard cache older than this. Default: 24h. */
  maxAge?: number;
}

interface State<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** True when `data` was hydrated from IDB and a network refresh is in progress. */
  stale: boolean;
}

const DEFAULTS = { freshFor: 0, maxAge: 24 * 60 * 60 * 1000 };

/**
 * Stale-while-revalidate fetch backed by IndexedDB.
 *
 * - First render: returns cached data instantly if present, then revalidates from network.
 * - Subsequent visits: same — instant paint from cache, fresh data swaps in.
 * - Pass `null` as the URL to skip the fetch (e.g. when query params aren't ready yet).
 */
export function useCachedFetch<T = unknown>(
  url: string | null,
  options: CachedFetchOptions = {}
): State<T> & { refetch: () => Promise<void> } {
  const { freshFor, maxAge } = { ...DEFAULTS, ...options };
  const [state, setState] = useState<State<T>>({
    data: null,
    loading: !!url,
    error: null,
    stale: false,
  });
  const urlRef = useRef(url);
  urlRef.current = url;

  const run = async (force: boolean) => {
    const currentUrl = urlRef.current;
    if (!currentUrl) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }

    let hydrated = false;
    if (!force) {
      const cached = await idbGet<T>(currentUrl);
      if (cached && Date.now() - cached.storedAt < maxAge) {
        if (urlRef.current !== currentUrl) return;
        setState({ data: cached.data, loading: false, error: null, stale: true });
        hydrated = true;
        if (Date.now() - cached.storedAt < freshFor) return;
      }
    }

    if (!hydrated) setState((s) => ({ ...s, loading: true }));

    try {
      const res = await fetch(currentUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as T;
      if (urlRef.current !== currentUrl) return;
      setState({ data, loading: false, error: null, stale: false });
      idbSet(currentUrl, data);
    } catch (err) {
      if (urlRef.current !== currentUrl) return;
      setState((s) => ({
        data: s.data,
        loading: false,
        error: err as Error,
        stale: s.stale,
      }));
    }
  };

  useEffect(() => {
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return { ...state, refetch: () => run(true) };
}
