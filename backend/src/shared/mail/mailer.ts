import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '@/shared/config/env.js'

let cachedTransporter: Transporter | null = null

export async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter

  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    })
    return cachedTransporter
  }

  // Dev fallback: Ethereal
  const testAccount = await nodemailer.createTestAccount()
  // eslint-disable-next-line no-console
  console.log('[mail] Ethereal account criada:', testAccount.user)

  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  })
  return cachedTransporter
}

interface SendArgs {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendMail({ to, subject, html, text }: SendArgs) {
  try {
    const transporter = await getTransporter()
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
      text,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      // eslint-disable-next-line no-console
      console.log(`[mail] preview: ${previewUrl}`)
    }
    return info
  } catch (err) {
    // E-mail não pode derrubar a request; apenas loga.
    // eslint-disable-next-line no-console
    console.error('[mail] erro ao enviar:', err)
    return null
  }
}
