import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const settingsRouter = Router()
settingsRouter.use(requireAuth)

function col() {
  return getDB().collection('settings')
}

const DEFAULT_SETTINGS = { weeklyBudget: 300, petName: 'Neko' }

function userId(req) {
  return new ObjectId(req.user.id)
}

settingsRouter.get('/', async (req, res) => {
  try {
    const doc = await col().findOne({ userId: userId(req) })
    res.json({
      ...DEFAULT_SETTINGS,
      ...(doc || {}),
      userId: undefined,
      _id: undefined,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

settingsRouter.put('/', async (req, res) => {
  try {
    const update = {}

    if (Object.prototype.hasOwnProperty.call(req.body, 'weeklyBudget')) {
      const weeklyBudget = Number(req.body.weeklyBudget)
      if (!Number.isFinite(weeklyBudget) || weeklyBudget <= 0) {
        return res.status(400).json({ error: 'weeklyBudget must be a positive number' })
      }
      update.weeklyBudget = weeklyBudget
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'petName')) {
      const petName = String(req.body.petName || '').trim()
      if (petName.length < 1 || petName.length > 32) {
        return res.status(400).json({ error: 'Pet name must be 1-32 characters.' })
      }
      update.petName = petName
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No settings fields provided.' })
    }

    const uid = userId(req)
    const result = await col().findOneAndUpdate(
      { userId: uid },
      { $set: update, $setOnInsert: { userId: uid } },
      { upsert: true, returnDocument: 'after' },
    )
    res.json({ ...DEFAULT_SETTINGS, ...result, userId: undefined, _id: undefined })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
