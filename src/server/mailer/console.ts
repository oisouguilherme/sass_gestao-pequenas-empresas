import type { AssignedToOSPayload, Mailer, UserCreatedPayload } from "./types";

export class ConsoleMailer implements Mailer {
  async sendAssignedToOS(payload: AssignedToOSPayload): Promise<void> {
    console.log("[mailer] OS assignada", {
      to: payload.to,
      subject: `Você foi atribuído à OS ${payload.osNome}`,
      body: `Olá ${payload.nomeUsuario}, você foi atribuído à OS "${payload.osNome}" (#${payload.osId}) na empresa ${payload.empresaNome}.`,
    });
  }

  async sendUserCreated(payload: UserCreatedPayload): Promise<void> {
    console.log("[mailer] Usuário criado", {
      to: payload.to,
      subject: `Sua conta em ${payload.empresaNome} foi criada`,
      body: `Olá ${payload.nomeUsuario}, sua senha temporária é: ${payload.senhaTemporaria}`,
    });
  }
}
