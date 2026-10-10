

describe('player creator completion handoff', () => {
  it('calls the parent completion callback with the validated new player', () => {
    const completed: ReturnType<typeof createPlayer>[] = [];
    const issue = submitPlayerCreation(validInput({ name: 'Teste Carreira' }), created => completed.push(created));

    expect(issue).toBeNull();
    expect(completed).toHaveLength(1);
    expect(completed[0].player.name).toBe('Teste Carreira');
    expect(completed[0].player.birthCity).toBe('Feira');
  });

  it('does not call the parent completion callback when creator validation fails', () => {
    const completed: ReturnType<typeof createPlayer>[] = [];
    const issue = submitPlayerCreation(validInput({ name: ' ' }), created => completed.push(created));

    expect(issue).toBe('Indica um nome com 1 a 60 caracteres.');
    expect(completed).toHaveLength(0);
  });
});
