import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { apiSuccess } from '../lib/errors'
import { createDb } from '../db'
import { participants, squares, gameConfig } from '../db/schema'
import { getDownloadUrl, getPublicUrl, getR2EnvFromBindings } from '../lib/r2'
import type { Env, Variables } from '../types'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()
  .get('/data', async (c) => {
    const db = createDb(c.env.DB)

    // Get game config
    const config = await db.select().from(gameConfig).limit(1).then(r => r[0] ?? null)

    // Get all squares with participants
    const allSquares = await db.select().from(squares)
    const allParticipants = await db.select().from(participants)
    const participantMap = new Map(allParticipants.map(p => [p.id, p]))

    // Build grid with image URLs
    const r2Env = getR2EnvFromBindings(c.env)
    const publicBaseUrl = c.env.R2_PUBLIC_URL?.trim()

    // Build participant image URL map
    const imageUrls: Record<string, string> = {}
    if (publicBaseUrl) {
      for (const p of allParticipants) {
        if (p.imageKey) {
          imageUrls[p.id] = getPublicUrl(publicBaseUrl, p.imageKey)
        }
      }
    } else if (r2Env) {
      for (const p of allParticipants) {
        if (p.imageKey) {
          imageUrls[p.id] = await getDownloadUrl(r2Env, p.imageKey, 3600)
        }
      }
    }

    type GridCell = { participantId: string; name: string; imageUrl: string | null } | null
    const grid: GridCell[][] = Array.from({ length: 10 }, () => Array(10).fill(null))

    for (const sq of allSquares) {
      if (sq.participantId) {
        const p = participantMap.get(sq.participantId)
        if (p) {
          grid[sq.row][sq.col] = {
            participantId: p.id,
            name: p.name,
            imageUrl: imageUrls[p.id] ?? null,
          }
        }
      }
    }

    // Fetch ESPN score if game configured
    let score: { team1: { name: string; score: number; shortName: string }; team2: { name: string; score: number; shortName: string }; status: string; detail: string; quarter: number; clock: string } | null = null

    if (config?.espnGameId) {
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard/${config.espnGameId}`)
        if (res.ok) {
          const data = await res.json() as any
          const competition = data.competitions?.[0]
          if (competition) {
            const teams = competition.competitors || []
            const home = teams.find((t: any) => t.homeAway === 'home')
            const away = teams.find((t: any) => t.homeAway === 'away')
            score = {
              team1: { name: away?.team?.displayName ?? config.team1Name ?? 'Away', score: parseInt(away?.score ?? '0'), shortName: away?.team?.shortDisplayName ?? '' },
              team2: { name: home?.team?.displayName ?? config.team2Name ?? 'Home', score: parseInt(home?.score ?? '0'), shortName: home?.team?.shortDisplayName ?? '' },
              status: data.status?.type?.name ?? 'STATUS_SCHEDULED',
              detail: data.status?.type?.shortDetail ?? '',
              quarter: data.status?.period ?? 0,
              clock: data.status?.displayClock ?? '',
            }
          }
        }
      } catch {
        // ESPN fetch failed, continue without score
      }
    }

    // Determine current winning square
    const rowDigits: number[] = config?.rowDigits ? JSON.parse(config.rowDigits) : [0,1,2,3,4,5,6,7,8,9]
    const colDigits: number[] = config?.colDigits ? JSON.parse(config.colDigits) : [0,1,2,3,4,5,6,7,8,9]

    let winningCell: { row: number; col: number } | null = null
    if (score) {
      const team1LastDigit = score.team1.score % 10
      const team2LastDigit = score.team2.score % 10
      const winRow = rowDigits.indexOf(team1LastDigit)
      const winCol = colDigits.indexOf(team2LastDigit)
      if (winRow !== -1 && winCol !== -1) {
        winningCell = { row: winRow, col: winCol }
      }
    }

    // Get halftime winner info
    let halftimeWinner: { name: string; imageUrl: string | null } | null = null
    if (config?.halftimeWinnerParticipantId) {
      const p = participantMap.get(config.halftimeWinnerParticipantId)
      if (p) {
        halftimeWinner = { name: p.name, imageUrl: imageUrls[p.id] ?? null }
      }
    }

    let finalWinner: { name: string; imageUrl: string | null } | null = null
    if (config?.finalWinnerParticipantId) {
      const p = participantMap.get(config.finalWinnerParticipantId)
      if (p) {
        finalWinner = { name: p.name, imageUrl: imageUrls[p.id] ?? null }
      }
    }

    return c.json(apiSuccess({
      grid,
      rowDigits,
      colDigits,
      score,
      winningCell,
      halftimeWinner,
      finalWinner,
      gameConfigured: !!config?.espnGameId,
    }))
  })

export default app
