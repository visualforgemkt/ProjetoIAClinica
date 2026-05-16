export default function Dashboard() {
  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>Dashboard</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>Visão geral da sua clínica</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
        <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>Consultas de IA</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>128</div>
        </div>
        
        <div style={{ padding: 'var(--space-6)', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>Campanhas Geradas</div>
          <div style={{ fontSize: '2rem', fontWeight: 700 }}>12</div>
        </div>
      </div>
    </div>
  );
}
