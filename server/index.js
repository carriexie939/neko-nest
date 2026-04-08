import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './db.js'
import { transactionsRouter } from './routes/transactions.js'
import { settingsRouter } from './routes/settings.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/transactions', transactionsRouter)
app.use('/api/settings', settingsRouter)

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

async function start() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cookienotes'
  await connectDB(uri)
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
