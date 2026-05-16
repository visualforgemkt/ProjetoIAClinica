import { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mocked login for frontend architecture demonstration. 
      // Real API call should use src/services/authService.js
      setTimeout(() => {
        setAuth({
          user: { id: 1, name: 'Dr. Teste' },
          clinic: { id: 1, name: 'Clínica Demo' },
          token: 'mock-jwt-token'
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    } finally {
      // setLoading(false) em caso de erro. O mock redireciona pelo AuthLayout
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <Input 
        label="E-mail" 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="medico@clinica.com"
        required 
      />
      <Input 
        label="Senha" 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="••••••••"
        required 
      />
      <Button type="submit" variant="primary" style={{ marginTop: 'var(--space-2)' }}>
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
}
