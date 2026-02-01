import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { apiSuccess, apiError, ErrorCodes } from '../../lib/errors'
import { requireAuth } from '../../middleware/auth'
import { createDb } from '../../db'
import { participants, squares, gameConfig } from '../../db/schema'
import { getUploadUrl, getR2EnvFromBindings, getPublicUrl, deleteObject } from '../../lib/r2'
import type { Env, Variables } from '../../types'

const ALLOWED_EMAIL = 'mandrew0987@gmail.com'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  .use('/*', requireAuth)
  .use('/*', async (c, next) => {
    const user = c.get('user')
    if (user?.email !== ALLOWED_EMAIL) {
      return c.json(apiError(ErrorCodes.FORBIDDEN, 'Access denied'), 403)
    }
    await next()
  })
  .get('/data', async (c) => {
    const db = createDb(c.env.DB)
    const allParticipants = await db.select().from(participants)
    const allSquares = await db.select().from(squares)
    const config = await db.select().from(gameConfig).limit(1).then(r => r[0] ?? null)

    const r2Env = getR2EnvFromBindings(c.env)
    const participantsWithImages = allParticipants.map(p => ({
      ...p,
      imageUrl: p.imageKey && r2Env?.R2_PUBLIC_URL
        ? getPublicUrl(r2Env.R2_PUBLIC_URL, p.imageKey)
        : null,
    }))

    return c.json(apiSuccess({
      participants: participantsWithImages,
      squares: allSquares,
      config,
    }))
  })
  .post('/add-participant',
    zValidator('json', z.object({
      name: z.string().min(1).max(100),
      squareCount: z.number().int().min(1).max(100),
      imageKey: z.string().optional(),
    })),
    async (c) => {
      const db = createDb(c.env.DB)
      const body = c.req.valid('json')
      const id = crypto.randomUUID()
      await db.insert(participants).values({
        id,
        name: body.name,
        squareCount: body.squareCount,
        imageKey: body.imageKey ?? null,
      })
      return c.json(apiSuccess({ id }))
    }
  )
  .post('/update-participant-squares',
    zValidator('json', z.object({
      id: z.string(),
      squareCount: z.number().int().min(1).max(100),
    })),
    async (c) => {
      const db = createDb(c.env.DB)
      const { id, squareCount } = c.req.valid('json')
      await db.update(participants).set({ squareCount }).where(eq(participants.id, id))
      return c.json(apiSuccess({ updated: true }))
    }
  )
  .post('/remove-participant',
    zValidator('json', z.object({ id: z.string() })),
    async (c) => {
      const db = createDb(c.env.DB)
      const { id } = c.req.valid('json')
      const [participant] = await db.select({ imageKey: participants.imageKey }).from(participants).where(eq(participants.id, id))
      await db.update(squares).set({ participantId: null }).where(eq(squares.participantId, id))
      await db.delete(participants).where(eq(participants.id, id))
      if (participant?.imageKey) {
        const r2Env = getR2EnvFromBindings(c.env)
        if (r2Env) await deleteObject(r2Env, participant.imageKey)
      }
      return c.json(apiSuccess({ removed: true }))
    }
  )
  .post('/upload-url',
    zValidator('json', z.object({ filename: z.string() })),
    async (c) => {
      const { filename } = c.req.valid('json')
      const key = `participants/${crypto.randomUUID()}-${filename}`
      const r2Env = getR2EnvFromBindings(c.env)
      if (!r2Env) {
        return c.json(
          apiError(ErrorCodes.INTERNAL_ERROR, 'R2 is not configured. Set CF_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.'),
          500
        )
      }
      const url = await getUploadUrl(r2Env, key)
      return c.json(apiSuccess({ url, key }))
    }
  )
  .post('/generate-squares', async (c) => {
    const db = createDb(c.env.DB)
    const allParticipants = await db.select().from(participants)

    // Build pool of participant assignments based on squareCount
    const pool: string[] = []
    for (const p of allParticipants) {
      for (let i = 0; i < p.squareCount; i++) {
        pool.push(p.id)
      }
    }

    if (pool.length !== 100) {
      return c.json(apiError(ErrorCodes.VALIDATION_ERROR, `Need exactly 100 squares, got ${pool.length}`), 400)
    }

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]]
    }

    // Randomize row/col digit assignments
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const rowDigits = [...digits]
    const colDigits = [...digits]
    for (let i = 9; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [rowDigits[i], rowDigits[j]] = [rowDigits[j], rowDigits[i]];
      j = Math.floor(Math.random() * (i + 1));
      [colDigits[i], colDigits[j]] = [colDigits[j], colDigits[i]]
    }

    // Clear existing squares
    await db.delete(squares)

    // Insert new squares
    let idx = 0
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        await db.insert(squares).values({
          id: crypto.randomUUID(),
          row,
          col,
          participantId: pool[idx],
        })
        idx++
      }
    }

    // Save digit assignments to config
    const config = await db.select().from(gameConfig).limit(1).then(r => r[0] ?? null)
    if (config) {
      await db.update(gameConfig).set({
        rowDigits: JSON.stringify(rowDigits),
        colDigits: JSON.stringify(colDigits),
      }).where(eq(gameConfig.id, config.id))
    } else {
      await db.insert(gameConfig).values({
        id: crypto.randomUUID(),
        rowDigits: JSON.stringify(rowDigits),
        colDigits: JSON.stringify(colDigits),
      })
    }

    return c.json(apiSuccess({ generated: true, rowDigits, colDigits }))
  })
  .post('/set-game',
    zValidator('json', z.object({
      espnGameId: z.string(),
      team1Name: z.string(),
      team2Name: z.string(),
    })),
    async (c) => {
      const db = createDb(c.env.DB)
      const body = c.req.valid('json')
      const config = await db.select().from(gameConfig).limit(1).then(r => r[0] ?? null)
      if (config) {
        await db.update(gameConfig).set({
          espnGameId: body.espnGameId,
          team1Name: body.team1Name,
          team2Name: body.team2Name,
        }).where(eq(gameConfig.id, config.id))
      } else {
        await db.insert(gameConfig).values({
          id: crypto.randomUUID(),
          espnGameId: body.espnGameId,
          team1Name: body.team1Name,
          team2Name: body.team2Name,
        })
      }
      return c.json(apiSuccess({ set: true }))
    }
  )
  .post('/record-halftime-winner', async (c) => {
    const db = createDb(c.env.DB)
    const config = await db.select().from(gameConfig).limit(1).then(r => r[0] ?? null)
    if (!config?.espnGameId) {
      return c.json(apiError(ErrorCodes.VALIDATION_ERROR, 'No game configured'), 400)
    }

    // Fetch current score
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard/${config.espnGameId}`)
    if (!res.ok) {
      return c.json(apiError(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch score'), 500)
    }
    const data = await res.json() as any
    const competition = data.competitions?.[0]
    const teams = competition?.competitors || []
    const home = teams.find((t: any) => t.homeAway === 'home')
    const away = teams.find((t: any) => t.homeAway === 'away')

    const awayScore = parseInt(away?.score ?? '0')
    const homeScore = parseInt(home?.score ?? '0')

    const rowDigits: number[] = config.rowDigits ? JSON.parse(config.rowDigits) : [0,1,2,3,4,5,6,7,8,9]
    const colDigits: number[] = config.colDigits ? JSON.parse(config.colDigits) : [0,1,2,3,4,5,6,7,8,9]

    const winRow = rowDigits.indexOf(awayScore % 10)
    const winCol = colDigits.indexOf(homeScore % 10)

    if (winRow === -1 || winCol === -1) {
      return c.json(apiError(ErrorCodes.INTERNAL_ERROR, 'Could not determine winning square'), 500)
    }

    const winningSquare = await db.select().from(squares)
      .where(eq(squares.row, winRow))
      .then(rows => rows.find(r => r.col === winCol))

    if (!winningSquare?.participantId) {
      return c.json(apiError(ErrorCodes.INTERNAL_ERROR, 'No participant in winning square'), 500)
    }

    await db.update(gameConfig).set({
      halftimeWinnerParticipantId: winningSquare.participantId,
    }).where(eq(gameConfig.id, config.id))

    return c.json(apiSuccess({ winnerId: winningSquare.participantId }))
  })
  .get('/espn-games', async (c) => {
    try {
      const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard')
      if (!res.ok) return c.json(apiSuccess({ games: [] }))
      const data = await res.json() as any
      const games = (data.events || []).map((event: any) => {
        const competition = event.competitions?.[0]
        const teams = competition?.competitors || []
        const home = teams.find((t: any) => t.homeAway === 'home')
        const away = teams.find((t: any) => t.homeAway === 'away')
        return {
          id: event.id,
          name: event.name,
          shortName: event.shortName,
          date: event.date,
          status: event.status?.type?.name,
          team1: away?.team?.displayName ?? 'Away',
          team2: home?.team?.displayName ?? 'Home',
        }
      })
      return c.json(apiSuccess({ games }))
    } catch {
      return c.json(apiSuccess({ games: [] }))
    }
  })

export default app
