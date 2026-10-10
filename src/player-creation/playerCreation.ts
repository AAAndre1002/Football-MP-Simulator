

/** Validate and hand a committed creator result to the next flow stage. Returns a user-facing validation error, or null on success. */
export function submitPlayerCreation(input: PlayerCreationInput, onComplete: (created: CreatedPlayer) => void): string | null {
  const issue = validateCreation(input)[0];
  if (issue) return issue;
  onComplete(createPlayer(input));
  return null;
}
