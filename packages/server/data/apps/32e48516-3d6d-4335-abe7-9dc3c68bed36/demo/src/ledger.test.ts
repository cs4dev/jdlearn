import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MilesLedger, InsufficientMilesError, ValidationError } from './ledger.js';

test('earning credits miles to balance', () => {
  const l = new MilesLedger();
  l.earn('u1', 500, 'txn_1');
  assert.equal(l.balanceOf('u1'), 500);
});

test('earning is idempotent by transactionId (no double credit on retry)', () => {
  const l = new MilesLedger();
  const a = l.earn('u1', 500, 'txn_1');
  const b = l.earn('u1', 500, 'txn_1'); // retry
  assert.equal(a.id, b.id);
  assert.equal(l.balanceOf('u1'), 500);
});

test('redeeming subtracts miles', () => {
  const l = new MilesLedger();
  l.earn('u1', 500, 'txn_1');
  l.redeem('u1', 200);
  assert.equal(l.balanceOf('u1'), 300);
});

test('redeeming more than balance fails atomically', () => {
  const l = new MilesLedger();
  l.earn('u1', 100, 'txn_1');
  assert.throws(() => l.redeem('u1', 200), InsufficientMilesError);
  assert.equal(l.balanceOf('u1'), 100); // unchanged
});

test('validates positive integer miles', () => {
  const l = new MilesLedger();
  assert.throws(() => l.earn('u1', -5, 'txn_x'), ValidationError);
  assert.throws(() => l.earn('u1', 1.5, 'txn_y'), ValidationError);
});

test('history is append-only and ordered', () => {
  const l = new MilesLedger();
  l.earn('u1', 500, 'txn_1');
  l.redeem('u1', 100);
  const h = l.history('u1');
  assert.equal(h.length, 2);
  assert.equal(h[0].type, 'EARN');
  assert.equal(h[1].type, 'REDEEM');
});
