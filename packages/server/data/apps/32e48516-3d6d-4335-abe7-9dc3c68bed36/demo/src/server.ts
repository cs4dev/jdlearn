import express, { Request, Response, NextFunction } from 'express';
import { MilesLedger, InsufficientMilesError, ValidationError } from './ledger.js';

const app = express();
app.use(express.json());

const ledger = new MilesLedger();

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'heymax-miles-ledger' });
});

// Earn miles from a merchant transaction (idempotent by transactionId).
app.post('/users/:userId/earn', (req: Request, res: Response) => {
  const { miles, transactionId, reason } = req.body ?? {};
  const entry = ledger.earn(req.params.userId, miles, transactionId, reason);
  res.status(201).json({ entry, balance: ledger.balanceOf(req.params.userId) });
});

// Redeem miles.
app.post('/users/:userId/redeem', (req: Request, res: Response) => {
  const { miles, reason } = req.body ?? {};
  const entry = ledger.redeem(req.params.userId, miles, reason);
  res.status(201).json({ entry, balance: ledger.balanceOf(req.params.userId) });
});

app.get('/users/:userId/balance', (req: Request, res: Response) => {
  res.json({ userId: req.params.userId, balance: ledger.balanceOf(req.params.userId) });
});

app.get('/users/:userId/history', (req: Request, res: Response) => {
  res.json({ userId: req.params.userId, entries: ledger.history(req.params.userId) });
});

// Structured error handling: validation -> 400, business rule -> 409.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  if (err instanceof InsufficientMilesError) return res.status(409).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: 'internal error' });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => console.log(`Max Miles ledger listening on http://localhost:${PORT}`));
