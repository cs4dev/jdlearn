// Max Miles rewards ledger.
// Append-only event log: every balance is derived from immutable entries.
// Earning is idempotent by transactionId so retries never double-credit.

export type EntryType = 'EARN' | 'REDEEM';

export interface LedgerEntry {
  id: string;
  userId: string;
  type: EntryType;
  miles: number; // always positive; type determines direction
  // For EARN, this dedupes external merchant transactions.
  transactionId?: string;
  reason: string;
  createdAt: string;
}

export class InsufficientMilesError extends Error {}
export class ValidationError extends Error {}

function newId(): string {
  return 'e_' + Math.random().toString(36).slice(2, 11);
}

export class MilesLedger {
  private entries: LedgerEntry[] = [];
  // transactionId -> entry, to enforce idempotent earning.
  private seenTransactions = new Map<string, LedgerEntry>();

  /**
   * Credit miles for a merchant transaction. Idempotent: calling twice with the
   * same transactionId returns the original entry instead of double-crediting.
   */
  earn(userId: string, miles: number, transactionId: string, reason = 'merchant purchase'): LedgerEntry {
    this.requireUser(userId);
    this.requirePositiveInt(miles, 'miles');
    if (!transactionId) throw new ValidationError('transactionId is required for earning');

    const existing = this.seenTransactions.get(transactionId);
    if (existing) return existing; // idempotent replay

    const entry: LedgerEntry = {
      id: newId(),
      userId,
      type: 'EARN',
      miles,
      transactionId,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.entries.push(entry);
    this.seenTransactions.set(transactionId, entry);
    return entry;
  }

  /** Redeem miles. Fails atomically if the user lacks balance. */
  redeem(userId: string, miles: number, reason = 'redemption'): LedgerEntry {
    this.requireUser(userId);
    this.requirePositiveInt(miles, 'miles');

    if (this.balanceOf(userId) < miles) {
      throw new InsufficientMilesError('insufficient Max Miles balance');
    }

    const entry: LedgerEntry = {
      id: newId(),
      userId,
      type: 'REDEEM',
      miles,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.entries.push(entry);
    return entry;
  }

  /** Balance is derived from the immutable log, never stored mutably. */
  balanceOf(userId: string): number {
    return this.entries
      .filter((e) => e.userId === userId)
      .reduce((sum, e) => sum + (e.type === 'EARN' ? e.miles : -e.miles), 0);
  }

  history(userId: string): LedgerEntry[] {
    return this.entries.filter((e) => e.userId === userId);
  }

  private requireUser(userId: string): void {
    if (!userId) throw new ValidationError('userId is required');
  }

  private requirePositiveInt(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ValidationError(`${field} must be a positive integer`);
    }
  }
}
