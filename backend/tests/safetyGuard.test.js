import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { verifyDestructiveSafety, assertSafeDatabase } from '../src/db/safetyGuard.js';

describe('Database Safety Guard Unit Tests', () => {
  const dummyUri = 'mongodb+srv://testuser:secret@cluster0.abc.mongodb.net/?retryWrites=true&appName=MarketLink';

  it('allows destructive operations when database ends with _test', () => {
    const res = verifyDestructiveSafety('marketlink_test', dummyUri, { nodeEnv: 'test' });
    assert.equal(res.safe, true);
    assert.ok(res.maskedHost.includes('cluster0.abc.mongodb.net'));
    assert.doesNotThrow(() => {
      assertSafeDatabase('marketlink_test', dummyUri, 'test run', { nodeEnv: 'test' });
    });
  });

  it('allows explicit dev seed when nodeEnv is development and isExplicitDevSeed is true', () => {
    const res = verifyDestructiveSafety('marketlink', dummyUri, {
      isExplicitDevSeed: true,
      nodeEnv: 'development',
    });
    assert.equal(res.safe, true);
    assert.doesNotThrow(() => {
      assertSafeDatabase('marketlink', dummyUri, 'dev seed', {
        isExplicitDevSeed: true,
        nodeEnv: 'development',
      });
    });
  });

  it('allows any database when force is true', () => {
    const res = verifyDestructiveSafety('marketlink_production', dummyUri, {
      force: true,
      nodeEnv: 'production',
    });
    assert.equal(res.safe, true);
    assert.doesNotThrow(() => {
      assertSafeDatabase('marketlink_production', dummyUri, 'forced op', { force: true });
    });
  });

  it('strictly rejects non-test database in test environment', () => {
    const res = verifyDestructiveSafety('marketlink', dummyUri, { nodeEnv: 'test' });
    assert.equal(res.safe, false);
    assert.ok(res.error.includes('Refusing destructive operation'));
    assert.throws(
      () => assertSafeDatabase('marketlink', dummyUri, 'test run', { nodeEnv: 'test' }),
      /Refusing destructive operation/
    );
  });

  it('strictly rejects non-test database when not explicit dev seed', () => {
    const res = verifyDestructiveSafety('marketlink_prod', dummyUri, {
      isExplicitDevSeed: false,
      nodeEnv: 'production',
    });
    assert.equal(res.safe, false);
    assert.throws(
      () => assertSafeDatabase('marketlink_prod', dummyUri, 'clean', { isExplicitDevSeed: false }),
      /Refusing destructive operation/
    );
  });
});
