import { useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowUpRight, Box, Layers3, LockKeyhole, Mail, Package, ShieldCheck, User, Warehouse } from 'lucide-react';

export default function Auth() {
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pending = useRef(false);
  const submit = async (event) => {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setLoading(true); setError(''); setSuccess('');
    try {
      if (registering) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
        if (error) throw error;
        setSuccess(data.session ? '¡Cuenta creada correctamente!' : 'Revisa tu correo y confirma tu cuenta antes de iniciar sesión.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) { setError(error.message); }
    finally { pending.current = false; setLoading(false); }
  };
  const switchTab = (value) => { setRegistering(value); setError(''); setSuccess(''); };
  return <div className="auth-layout">
    <section className="auth-story" aria-label="Plataforma de operaciones"><div className="brand"><span className="brand-mark"><Layers3 size={24} /></span><div><strong>Adventure<span>Works</span></strong><small>OPERATIONS PLATFORM</small></div></div><div className="auth-story-content"><span className="banner-label"><span className="live-dot" /> CONECTA TU OPERACIÓN</span><h2>Grandes productos.<br /><em>Mejores decisiones.</em></h2><p>Un espacio para conectar tu catálogo, consultar el inventario y planificar lo que viene.</p><div className="auth-flow"><span><Package size={15} /> Productos</span><span><Warehouse size={15} /> Inventario</span><span><Box size={15} /> Producción</span></div></div><p className="auth-story-footer">ADVENTUREWORKS / CONTROL DE PRODUCCIÓN</p></section>
    <main className="auth-form-side"><div className="auth-card"><span className="eyebrow">TU ESPACIO DE TRABAJO</span><h1>AdventureWorks</h1><p className="subtitle">{registering ? 'Crea tu cuenta para acceder a la operación.' : 'Bienvenido de nuevo. Tu operación te espera.'}</p><div className="auth-tabs"><button disabled={loading} className={!registering ? 'active' : ''} onClick={() => switchTab(false)}>Iniciar Sesión</button><button disabled={loading} className={registering ? 'active' : ''} onClick={() => switchTab(true)}>Registrarse</button></div>
      {error && <p role="alert" className="error-banner">{error}</p>}{success && <p role="status" className="auth-success">{success}</p>}
      <form onSubmit={submit}>
        {registering && <label className="auth-field"><span>Nombre Completo</span><div><User size={17} /><input required autoComplete="name" disabled={loading} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" /></div></label>}
        <label className="auth-field"><span>Correo Electrónico</span><div><Mail size={17} /><input type="email" autoComplete="email" required disabled={loading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.com" /></div></label>
        <label className="auth-field"><span>Contraseña</span><div><LockKeyhole size={17} /><input type="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 6 : undefined} disabled={loading} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={registering ? 'Al menos 6 caracteres' : 'Ingresa tu contraseña'} /></div></label>
        <button className="button primary" disabled={loading} type="submit">{loading ? 'Procesando…' : registering ? 'Crear Cuenta' : 'Entrar al Sistema'}<ArrowUpRight size={17} /></button>
      </form><p className="auth-footnote"><ShieldCheck size={14} /> Acceso protegido con autenticación</p></div></main>
  </div>;
}
