import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB, getDB } from './db.js'
import { authRouter } from './routes/auth.js'
import { oauthRouter } from './routes/oauth.js'
import { receiptsRouter } from './routes/receipts.js'
import { transactionsRouter } from './routes/transactions.js'
import { settingsRouter } from './routes/settings.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '12mb' }))

app.use('/api/auth', authRouter)
app.use('/api/auth/oauth', oauthRouter)
app.use('/api/receipts', receiptsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/settings', settingsRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

async function start() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cookienotes'
  await connectDB(uri)
  const users = getDB().collection('users')
  await users.createIndex({ username: 1 }, { unique: true })
  await users.createIndex({ email: 1 }, { unique: true, sparse: true })
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
