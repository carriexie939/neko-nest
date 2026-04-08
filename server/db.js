import { MongoClient } from 'mongodb'

let db = null

export async function connectDB(uri) {
  const client = new MongoClient(uri, {
    tls: true,
    tlsAllowInvalidCertificates: false,
    minPoolSize: 1,
    maxPoolSize: 10,
  })
  await client.connect()
  db = client.db()
  console.log('Connected to MongoDB:', db.databaseName)
  return db
}

export function getDB() {
  if (!db) throw new Error('Database not connected. Call connectDB first.')
  return db
}
