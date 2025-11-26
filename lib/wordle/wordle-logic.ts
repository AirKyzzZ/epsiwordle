export type LetterStatus = "correct" | "present" | "absent" | "empty";

export const MAX_CHALLENGES = 6;

export function getGuessStatuses(solution: string, guess: string): LetterStatus[] {
  const solutionChars = solution.split("");
  const guessChars = guess.split("");
  const wordLength = solution.length;
  const statuses: LetterStatus[] = Array(wordLength).fill("absent");

  // First pass: mark correct (green) letters
  guessChars.forEach((char, i) => {
    if (char === solutionChars[i]) {
      statuses[i] = "correct";
      solutionChars[i] = null as any; // Mark as used
      guessChars[i] = null as any; // Mark as used
    }
  });

  // Second pass: mark present (yellow) letters
  guessChars.forEach((char, i) => {
    if (char && solutionChars.includes(char)) {
      statuses[i] = "present";
      // Remove the first occurrence of this letter from solution to handle duplicates
      const solutionIndex = solutionChars.indexOf(char);
      solutionChars[solutionIndex] = null as any;
    }
  });

  return statuses;
}

export function isWinningGuess(statuses: LetterStatus[]) {
  return statuses.every((status) => status === "correct");
}
