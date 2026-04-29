export type Role = "ADMIN" | "VENDEDOR" | "OPERADOR";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: Role;
  empresaId: string;
  empresa?: { id: string; nome: string };
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number; lastPage: number };
}

export interface Produto {
  id: string;
  nome: string;
  preco: string;
  codigo: string;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  endereco: string | null;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: Role;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export type OSStatus = "ABERTA" | "EM_ANDAMENTO" | "CONCLUIDA" | "CANCELADA";

export interface OrdemServico {
  id: string;
  nome: string;
  descricao: string | null;
  status: OSStatus;
  pago: boolean;
  deadlineAt: string | null;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  usuarios: Array<{
    ordemServicoId: string;
    usuarioId: string;
    atribuidoEm: string;
    usuario: { id: string; nome: string; email: string };
  }>;
  produtos: Array<{
    ordemServicoId: string;
    produtoId: string;
    quantidade: number;
    produto: Produto;
  }>;
}

export type TipoPagamento = "DINHEIRO" | "CARTAO" | "PIX" | "BOLETO";
export type VendaStatus = "ABERTA" | "FINALIZADA" | "CANCELADA";

export interface Venda {
  id: string;
  tipoPagamento: TipoPagamento | null;
  valorTotal: string;
  desconto: string;
  valorFinal: string;
  status: VendaStatus;
  usuarioId: string;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
  cancelAt: string | null;
  produtos: Array<{
    vendaId: string;
    produtoId: string;
    quantidade: number;
    precoUnitario: string;
    subtotal: string;
    produto: Produto;
  }>;
}

export interface ReportSales {
  filtros: {
    from: string | null;
    to: string | null;
    usuarioId: string | null;
    status: string;
  };
  totais: {
    totalVendido: string;
    numeroVendas: number;
    ticketMedio: string;
  };
  porUsuario: Array<{
    usuarioId: string;
    usuarioNome: string;
    totalVendido: string;
    numeroVendas: number;
  }>;
}
