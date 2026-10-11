import { Loading, ErrorState } from "../components/Feedback";

export const Table = ({ head, children, empty, isEmpty }) => (
  <div className="card overflow-x-auto">
    <table className="min-w-full divide-y divide-line">
      <thead><tr>{head.map((h) => <th key={h} className="th" scope="col">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-line">{isEmpty ? <tr><td colSpan={head.length} className="td py-10 text-center text-muted">{empty}</td></tr> : children}</tbody>
    </table>
  </div>
);

export const AsyncView = ({ state, children }) =>
  state.loading ? <Loading /> : state.error ? <ErrorState message={state.error} onRetry={state.reload} /> : children;

export const Title = ({ children, action }) => (
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
    <h1 className="text-2xl">{children}</h1>
    {action}
  </div>
);
