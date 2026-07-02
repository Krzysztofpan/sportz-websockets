import { Router } from "express"
import { desc, eq } from "drizzle-orm"
import { db } from "../db/db.js"
import { commentary, matches } from "../db/schema.js"
import { matchIdParamSchema } from "../validation/matches.js"
import { createCommentarySchema, listCommentaryQuerySchema } from "../validation/commentary.js"

export const commentaryRouter = Router({ mergeParams: true })

const MAX_LIMIT = 100

commentaryRouter.get("/", async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params)
  if (!paramsParsed.success) {
    return res.status(400).json({ error: "Invalid params", details: paramsParsed.error.issues })
  }

  const queryParsed = listCommentaryQuerySchema.safeParse(req.query)
  if (!queryParsed.success) {
    return res.status(400).json({ error: "Invalid query", details: queryParsed.error.issues })
  }

  const matchId = paramsParsed.data.id
  const limit = Math.min(queryParsed.data.limit ?? 100, MAX_LIMIT)

  try {
    const events = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, matchId))
      .orderBy(desc(commentary.createdAt))
      .limit(limit)

    res.status(200).json({ data: events })
  } catch (error) {
    res.status(500).json({ error: "Failed to list commentary." })
  }
})

commentaryRouter.post("/", async (req, res) => {
  const paramsParsed = matchIdParamSchema.safeParse(req.params)
  if (!paramsParsed.success) {
    return res.status(400).json({ error: "Invalid params", details: paramsParsed.error.issues })
  }

  const bodyParsed = createCommentarySchema.safeParse(req.body)
  if (!bodyParsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: bodyParsed.error.issues })
  }

  const matchId = Number(req.params.id)

  try {
    const [match] = await db
      .select({ id: matches.id })
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1)

    if (!match) {
      return res.status(404).json({ error: "Match not found." })
    }

    const [result] = await db
      .insert(commentary)
      .values({
        matchId,
        ...bodyParsed.data,
      })
      .returning()

      if(res.app.locals.broadcastCommentary) {
        res.app.locals.broadcastCommentary(result.matchId, result)
      }

    res.status(201).json({ data: result })
  } catch (error) {
    res.status(500).json({ error: "Failed to create commentary." })
  }
})
