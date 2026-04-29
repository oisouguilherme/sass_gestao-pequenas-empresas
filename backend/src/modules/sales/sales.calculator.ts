import { Prisma } from "@prisma/client";

export interface SaleItem {
  precoUnitario: Prisma.Decimal | number | string;
  quantidade: number;
}

export interface SaleTotals {
  valorTotal: Prisma.Decimal;
  desconto: Prisma.Decimal;
  valorFinal: Prisma.Decimal;
}

const D = Prisma.Decimal;

export function lineSubtotal(item: SaleItem): Prisma.Decimal {
  return new D(item.precoUnitario).mul(item.quantidade);
}

export function calculateTotals(
  items: SaleItem[],
  desconto: Prisma.Decimal | number | string = 0,
): SaleTotals {
  const valorTotal = items.reduce(
    (acc, it) => acc.add(lineSubtotal(it)),
    new D(0),
  );
  const descontoDec = new D(desconto);
  const valorFinal = valorTotal.sub(descontoDec);
  return {
    valorTotal,
    desconto: descontoDec,
    // não permite valor final negativo
    valorFinal: valorFinal.lt(0) ? new D(0) : valorFinal,
  };
}
