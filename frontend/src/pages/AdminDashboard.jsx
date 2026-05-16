import { useState, useEffect } from 'react';
import { Activity, Server, AlertTriangle, Users, Database } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    // Busca dados reais do endpoint de health criado no backend
    api.get('/health').then(setHealth).catch(console.error);
  }, []);

  return (
    <div style={{ padding: 'var(--space-8)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Internal Operations Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Status da Plataforma e Observabilidade</p>
      </header>

      {/* Health & Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
            <Activity size={24} /> <span style={{ fontSize: '0.875rem' }}>API Status</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 'var(--space-4)' }}>
            {health ? health.status.toUpperCase() : 'LOADING'}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-accent)' }}>
            <Server size={24} /> <span style={{ fontSize: '0.875rem' }}>Uptime</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 'var(--space-4)' }}>
            {health ? `${(health.uptime / 3600).toFixed(1)}h` : '--'}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)' }}>
            <Database size={24} /> <span style={{ fontSize: '0.875rem' }}>Memória (RSS)</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 'var(--space-4)' }}>
            {health ? `${(health.memory.rss / 1024 / 1024).toFixed(0)} MB` : '--'}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-warning)' }}>
            <AlertTriangle size={24} /> <span style={{ fontSize: '0.875rem' }}>Errors (1h)</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 'var(--space-4)' }}>0</div>
        </div>
      </div>

      {/* AI Metrics & Billing Mock */}
      <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-4)' }}>AI & Billing Metrics</h2>
      <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: 'var(--space-2)' }}>Tenant ID</th>
              <th style={{ padding: 'var(--space-2)' }}>Requests</th>
              <th style={{ padding: 'var(--space-2)' }}>Tokens</th>
              <th style={{ padding: 'var(--space-2)' }}>Estimated Cost</th>
              <th style={{ padding: 'var(--space-2)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 'var(--space-2)' }}>Clínica Demo</td>
              <td style={{ padding: 'var(--space-2)' }}>420 / 500</td>
              <td style={{ padding: 'var(--space-2)' }}>145,000</td>
              <td style={{ padding: 'var(--space-2)' }}>$0.43</td>
              <td style={{ padding: 'var(--space-2)' }}><span style={{ color: 'var(--color-success)' }}>Healthy</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-6)',
};
