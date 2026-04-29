export default function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white shadow-sm p-8 space-y-4">
        <h1 className="text-2xl font-bold text-brand-600">SaaS Gestão</h1>
        <p className="text-slate-600">
          Bootstrap concluído. Tailwind v4 ativo. Próximas fases adicionarão autenticação, módulos
          e telas de produto.
        </p>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
            Vite
          </span>
          <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
            React 18
          </span>
          <span className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
            Tailwind v4
          </span>
        </div>
      </div>
    </main>
  )
}
