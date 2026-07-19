// app/dashboard/(protected)/items/loading.tsx
export default function ItemsLoading() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: 'var(--spacing-xl)',
        color: 'var(--color-text-muted)',
      }}
    >
      Loading...
    </div>
  );
}
