import { z } from "zod"

function isValidIsoDateString(value) {
  const date = new Date(value)
  return !Number.isNaN(date.getTime()) && date.toISOString() === value
}

export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
})

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  FINISHED: "finished",
}

export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const createMatchSchema = z
  .object({
    sport: z.string().min(1),
    homeTeam: z.string().min(1),
    awayTeam: z.string().min(1),
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)

    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        message: "endTime must be after startTime",
        path: ["endTime"],
      })
    }
  })

export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
})
