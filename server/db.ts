import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'scores.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

export interface ScoreRow {
  id: number;
  name: string;
  score: number;
  created_at: string;
}

const insertScore = db.prepare(
  'INSERT INTO scores (name, score) VALUES (?, ?)'
);

const getTopScores = db.prepare(
  'SELECT id, name, score, created_at FROM scores ORDER BY score DESC LIMIT 10'
);

export function addScore(name: string, score: number): void {
  insertScore.run(name, score);
}

export function getLeaderboard(): ScoreRow[] {
  return getTopScores.all() as ScoreRow[];
}

export default db;
