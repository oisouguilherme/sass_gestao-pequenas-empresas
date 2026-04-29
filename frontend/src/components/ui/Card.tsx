import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      {...rest}
      className={`border-b border-slate-200 px-6 py-4 ${className}`}
    >
      {children}
    </div>
  )
}

export function CardBody({ className = '', children, ...rest }: CardProps) {
  return (
    <div {...rest} className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  )
}
