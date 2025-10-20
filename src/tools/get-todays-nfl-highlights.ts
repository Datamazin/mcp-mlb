/**
 * MCP Tool: get-todays-nfl-highlights
 *
 * Wraps the local espn-highlight-capture.mjs script to fetch ESPN NFL highlights
 * for a given date (defaults to today), computes PPR points, and returns
 * the structured JSON back through MCP.
 */

import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function toYYYYMMDD(dateStr?: string) {
  if (!dateStr) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${da}`;
  }
  // Accept YYYY-MM-DD or YYYYMMDD
  const clean = dateStr.replace(/[^0-9]/g, '');
  if (clean.length !== 8) {
    throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD or YYYYMMDD.`);
  }
  return clean;
}

function toNiceDate(yyyymmdd: string) {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export function registerGetTodaysNFLHighlightsTool(server: any) {
  server.registerTool(
    'get-todays-nfl-highlights',
    {
      title: 'Get Today\'s NFL Highlights (ESPN)',
      description:
        'Fetches ESPN NFL highlights for a date (defaults to today): per-game top fantasy players (PPR), leaders, and scoring plays.',
      inputSchema: {
        date: z
          .string()
          .optional()
          .describe('Date to fetch in YYYY-MM-DD or YYYYMMDD (defaults to today)')
      },
      outputSchema: {
        date: z.string(),
        totalGames: z.number(),
        games: z.array(
          z.object({
            gameId: z.string().nullable().optional(),
            status: z.string().nullable().optional(),
            name: z.string().nullable().optional(),
            shortName: z.string().nullable().optional(),
            venue: z.string().nullable().optional(),
            competitors: z
              .array(
                z.object({
                  id: z.string().nullable().optional(),
                  team: z.string().nullable().optional(),
                  abbreviation: z.string().nullable().optional(),
                  score: z.string().nullable().optional(),
                  homeAway: z.string().nullable().optional()
                })
              )
              .nullable()
              .optional(),
            top5: z
              .array(
                z.object({
                  name: z.string(),
                  team: z.string().nullable().optional(),
                  fantasyPoints: z.number().nullable().optional(),
                  stats: z.record(z.any()).nullable().optional()
                })
              )
              .nullable()
              .optional(),
            qbLeader: z.record(z.any()).nullable().optional(),
            rushLeader: z.record(z.any()).nullable().optional(),
            recLeader: z.record(z.any()).nullable().optional(),
            scoringPlays: z
              .array(
                z.object({
                  clock: z.string().nullable().optional(),
                  period: z.string().nullable().optional(),
                  text: z.string().nullable().optional(),
                  team: z.string().nullable().optional(),
                  score: z.string().nullable().optional()
                })
              )
              .nullable()
              .optional()
          })
        )
      }
    },
    async ({ date }: { date?: string }) => {
      try {
        const yyyymmdd = toYYYYMMDD(date);
        const nice = toNiceDate(yyyymmdd);
        const scriptPath = path.resolve(process.cwd(), 'espn-highlight-capture.mjs');
        const jsonOut = path.resolve(process.cwd(), `espn-highlights-${nice}.json`);

        // Run the capture script (powershell-compatible command)
        const cmd = `node "${scriptPath}" --date=${yyyymmdd}`;
        try {
          execSync(cmd, { stdio: 'inherit' });
        } catch (e: any) {
          // If script fails, bubble a clear error
          throw new Error(`Failed to run highlight capture script: ${e?.message || e}`);
        }

        if (!fs.existsSync(jsonOut)) {
          throw new Error(`Expected JSON output not found: ${jsonOut}`);
        }

        const data = JSON.parse(fs.readFileSync(jsonOut, 'utf-8'));
        const games = Array.isArray(data?.games) ? data.games : [];
        const output = {
          date: nice,
          totalGames: games.length,
          games
        };

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output
        };
      } catch (error: any) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error fetching NFL highlights: ${msg}`
            }
          ],
          isError: true
        } as any;
      }
    }
  );
}
