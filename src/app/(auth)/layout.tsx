export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--shell-bg)" }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden w-105 shrink-0 flex-col justify-between p-10 lg:flex"
        style={{ borderRight: "1px solid var(--shell-border)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-xl font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            G
          </span>
          <span
            className="text-lg font-semibold"
            style={{ color: "var(--shell-text)" }}
          >
            Gestão
          </span>
        </div>
        <div>
          <blockquote
            className="text-2xl font-semibold leading-snug"
            style={{ color: "var(--shell-text)" }}
          >
            &ldquo;Controle total do seu negócio, em um só lugar.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm" style={{ color: "var(--shell-muted)" }}>
            Gestão de vendas, ordens de serviço, clientes e produtos para
            pequenas empresas.
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--shell-muted)" }}>
          © 2026 Gestão. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel — form */}
      <div
        className="flex flex-1 items-center justify-center p-6"
        style={{ background: "var(--body-bg)" }}
      >
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
