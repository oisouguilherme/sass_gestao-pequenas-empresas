export interface AssignedToOSPayload {
  to: string;
  nomeUsuario: string;
  osNome: string;
  osId: string;
  empresaNome: string;
}

export interface UserCreatedPayload {
  to: string;
  nomeUsuario: string;
  senhaTemporaria: string;
  empresaNome: string;
}

export interface Mailer {
  sendAssignedToOS(payload: AssignedToOSPayload): Promise<void>;
  sendUserCreated(payload: UserCreatedPayload): Promise<void>;
}
