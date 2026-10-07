import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

// ─── LOGIN ─────────────────────────────────────────────────────────────────
// Los escenarios y corridas solo se leen con sesión (RLS en Supabase),
// así que la app entera queda detrás del login.

const C = { navy:"#213363", blue:"#235C96", mid:"#6381A7", bg:"#EEF2F7", border:"#D6E0ED", red:"#991B1B" };

const campo = {
  width:"100%", padding:"10px 12px", border:`1px solid ${C.border}`, borderRadius:6,
  fontSize:14, fontFamily:"'Montserrat',sans-serif", color:C.navy, outline:"none",
};

function Login() {
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const ingresar = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (err) setError("Revisá el correo y la contraseña.");
    } catch {
      setError("No se pudo conectar con el servidor. Verificá tu red e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg,padding:16,fontFamily:"'Montserrat',sans-serif"}}>
      <form onSubmit={ingresar} style={{width:"100%",maxWidth:360,background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:28}}>
        <div style={{fontSize:20,fontWeight:800,color:C.navy}}>⛴️ Transporte Arena</div>
        <div style={{fontSize:12,color:C.mid,marginTop:4,marginBottom:22}}>Terra Mare Services · Ingresá con tu cuenta</div>

        {error && (
          <div role="alert" style={{background:"#FEF2F2",border:"1px solid #FCA5A5",color:C.red,fontSize:12,borderRadius:6,padding:"8px 10px",marginBottom:14}}>
            {error}
          </div>
        )}

        <label style={{fontSize:11,fontWeight:600,color:C.mid}}>Correo</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoFocus autoComplete="username"
          disabled={loading} style={{...campo,marginTop:4,marginBottom:12}}/>

        <label style={{fontSize:11,fontWeight:600,color:C.mid}}>Contraseña</label>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} autoComplete="current-password"
          disabled={loading} style={{...campo,marginTop:4}}/>

        <button type="submit" disabled={loading || !email || !pass}
          style={{width:"100%",marginTop:20,height:42,border:"none",borderRadius:6,background:C.navy,color:"#fff",fontWeight:700,fontSize:14,opacity:(loading||!email||!pass)?0.6:1}}>
          {loading ? "Verificando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = todavía cargando

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  return session ? children : <Login />;
}
