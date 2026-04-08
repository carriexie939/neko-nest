import { Router } from 'express'
import { ObjectId } from 'mongodb'
import { getDB } from '../db.js'

export const transactionsRouter = Router()

function col() {
  return getDB().collection('transactions')
}

transactionsRouter.get('/', async (_req, res) => {
  try {
    const docs = await col().find().sort({ date: -1 }).toArray()
    res.json(docs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

transactionsRouter.post('/', async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [req.body]
    const docs = items.map((item) => ({
      title: String(item.title || ''),
      description: String(item.description || ''),
      type: item.type === 'income' ? 'income' : 'expense',
      category: String(item.category || 'others'),
      amount: Number(item.amount) || 0,
      date: new Date(item.date || Date.now()),
      source: item.source || 'manual',
    }))
    const result = await col().insertMany(docs)
    const inserted = await col()
      .find({ _id: { $in: Object.values(result.insertedIds) } })
      .toArray()
    res.status(201).json(inserted)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

transactionsRouter.put('/:id', async (req, res) => {
  try {
    const id = req.params.id
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const update = {}
    const allowed = ['title', 'description', 'type', 'category', 'amount', 'date', 'source']
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'amount') update[key] = Number(req.body[key]) || 0
        else if (key === 'date') update[key] = new Date(req.body[key])
        else update[key] = String(req.body[key])
      }
    }

    const result = await col().findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' },
    )
    if (!result) return res.status(404).json({ error: 'Not found' })
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

transactionsRouter.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const result = await col().deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ deleted: id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

transactionsRouter.get('/monthly-trends', async (_req, res) => {
  try {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const pipeline = [
      { $match: { type: 'expense', date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]
    const results = await col().aggregate(pipeline).toArray()
    const trends = results.map((r) => ({
      year: r._id.year,
      month: r._id.month,
      total: r.total,
      count: r.count,
    }))
    res.json(trends)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
