import 'dotenv/config'
import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

export function createApp(): Express {
  const app = express()

  app.use(helmet())
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
      credentials: true,
    }),
  )
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'saas-gestao-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    })
  })

  // TODO: montar rotas dos módulos aqui (Fase 3+)

  // Fallback 404
  app.use((_req, res) => {
    res.status(404).json({ message: 'Rota não encontrada' })
  })

  return app
}
