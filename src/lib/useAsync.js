import { useCallback, useEffect, useState } from "react";

// Runs an async loader; returns { data, loading, error, reload }
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: "" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);
  const load = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: "" }));
    run()
      .then((data) => !cancelled && setState({ data, loading: false, error: "" }))
      .catch((e) => !cancelled && setState({ data: null, loading: false, error: e.message }));
    return () => {
      cancelled = true;
    };
  }, [run]);
  useEffect(() => load(), [load]);
  return { ...state, reload: load };
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Shelter of Hope` : "Shelter of Hope | নারী ও শিশু সুরক্ষা ও মানবিক সহায়তা";
  }, [title]);
}
