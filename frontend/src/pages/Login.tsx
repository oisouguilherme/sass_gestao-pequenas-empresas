import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { extractErrorMessage } from "@/lib/api";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@demo.com");
  const [senha, setSenha] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, senha);
      toast.success("Bem-vindo de volta!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err, "Falha ao entrar"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-600">SaaS Gestão</h1>
          <p className="mt-2 text-sm text-slate-600">
            Acesse sua conta para continuar
          </p>
        </div>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <Input
            label="E-mail"
            type="email"
            name="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Senha"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full"
            loading={submitting}
            size="lg"
          >
            Entrar
          </Button>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700">Credenciais demo:</p>
            <p>admin@demo.com / admin123</p>
            <p>vendedor@demo.com / vendedor123</p>
            <p>operador@demo.com / operador123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
