export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ash-300 bg-white px-6 py-12 text-center">
      <h2 className="font-display text-base font-bold text-navy-800">{title}</h2>
      {body && <p className="mt-1 text-sm text-ash-500">{body}</p>}
    </div>
  );
}
