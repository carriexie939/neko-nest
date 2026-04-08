import { Router } from 'express'
import { getDB } from '../db.js'

export const settingsRouter = Router()

function col() {
  return getDB().collection('settings')
}

const DEFAULT_SETTINGS = { weeklyBudget: 300 }

settingsRouter.get('/', async (_req, res) => {
  try {
    const doc = await col().findOne({})
    res.json(doc || DEFAULT_SETTINGS)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

settingsRouter.put('/', async (req, res) => {
  try {
    const weeklyBudget = Number(req.body.weeklyBudget)
    if (!Number.isFinite(weeklyBudget) || weeklyBudget <= 0) {
      return res.status(400).json({ error: 'weeklyBudget must be a positive number' })
    }
    const result = await col().findOneAndUpdate(
      {},
      { $set: { weeklyBudget } },
      { upsert: true, returnDocument: 'after' },
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
