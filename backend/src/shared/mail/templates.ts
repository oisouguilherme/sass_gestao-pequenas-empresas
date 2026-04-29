import { env } from "@/shared/config/env.js";
import { sendMail } from "./mailer.js";

interface OSAssignedArgs {
  to: string;
  usuarioNome: string;
  os: {
    id: string;
    nome: string;
    descricao?: string | null;
    deadlineAt?: Date | null;
  };
}

export function sendOSAssignedEmail({ to, usuarioNome, os }: OSAssignedArgs) {
  const link = `${env.APP_URL}/orders/${os.id}`;
  const deadline = os.deadlineAt
    ? new Date(os.deadlineAt).toLocaleDateString("pt-BR")
    : "sem prazo definido";

  const html = `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; color:#0f172a; line-height:1.5;">
      <h2 style="color:#2563eb;">Nova Ordem de Serviço atribuída</h2>
      <p>Olá <strong>${escapeHtml(usuarioNome)}</strong>,</p>
      <p>Você foi atribuído à OS <strong>${escapeHtml(os.nome)}</strong>.</p>
      ${os.descricao ? `<p>${escapeHtml(os.descricao)}</p>` : ""}
      <p><strong>Prazo:</strong> ${deadline}</p>
      <p>
        <a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
          Abrir ordem de serviço
        </a>
      </p>
      <p style="font-size:12px;color:#64748b;">SaaS Gestão — notificação automática.</p>
    </div>
  `.trim();

  const text = `Você foi atribuído à OS "${os.nome}". Prazo: ${deadline}. Acesse: ${link}`;

  return sendMail({
    to,
    subject: `[OS] ${os.nome} foi atribuída a você`,
    html,
    text,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
