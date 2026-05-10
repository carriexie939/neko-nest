import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const settingsRouter = Router()
settingsRouter.use(requireAuth)

function col() {
  return getDB().collection('settings')
}

const DEFAULT_SETTINGS = { weeklyBudget: 300 }

function userId(req) {
  return new ObjectId(req.user.id)
}

settingsRouter.get('/', async (req, res) => {
  try {
    const doc = await col().findOne({ userId: userId(req) })
    res.json(doc ? { weeklyBudget: doc.weeklyBudget } : DEFAULT_SETTINGS)
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
    const uid = userId(req)
    const result = await col().findOneAndUpdate(
      { userId: uid },
      { $set: { weeklyBudget }, $setOnInsert: { userId: uid } },
      { upsert: true, returnDocument: 'after' },
    )
    res.json({ weeklyBudget: result.weeklyBudget })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
