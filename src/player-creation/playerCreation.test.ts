

describe('player ID fallback', () => {
  it('uses a timestamp ID when crypto.randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {});
    try {
      const created = createPlayer(validInput());
      expect(created.player.id).toMatch(/^player-\d+$/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
