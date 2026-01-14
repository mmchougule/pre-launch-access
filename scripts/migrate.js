const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

async function runMigrations() {
  const pool = new Pool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'prelaunch',
    user: process.env.DATABASE_USER || 'user',
    password: process.env.DATABASE_PASSWORD || 'password',
  })

  try {
    console.log('Running database migrations...')

    const migrationsDir = path.join(__dirname, '..', 'migrations')
    const files = fs.readdirSync(migrationsDir).sort()

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`)
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
        await pool.query(sql)
        console.log(`Completed migration: ${file}`)
      }
    }

    console.log('All migrations completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigrations()
