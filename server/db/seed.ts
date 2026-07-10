import 'dotenv/config'
import { loadConfig } from '../config.js'
import { hashPassword } from '../auth.js'
import { createPool } from './pool.js'

async function seed() {
  const config = loadConfig()
  if (!config.BOOTSTRAP_EMAIL || !config.BOOTSTRAP_PASSWORD) {
    throw new Error('BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD are required to seed an owner account')
  }

  const pool = createPool(config)
  try {
    const passwordHash = await hashPassword(config.BOOTSTRAP_PASSWORD)
    await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'owner')
       ON CONFLICT (email) DO NOTHING`,
      [config.BOOTSTRAP_EMAIL.toLowerCase(), passwordHash],
    )
    console.info(`Owner account ready: ${config.BOOTSTRAP_EMAIL}`)
  } finally {
    await pool.end()
  }
}

seed().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
