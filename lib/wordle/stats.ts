import { createClient } from "@/lib/supabase/server";

export interface UserStats {
  played: number;
  winRate: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();
  
  const { data: attempts } = await supabase
    .from("game_attempts")
    .select("attempts, guesses, completed_at, word_id")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true });

  if (!attempts || attempts.length === 0) {
    return {
      played: 0,
      winRate: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
    };
  }

  let played = 0;
  let wins = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  const distribution = [0, 0, 0, 0, 0, 0];
  
  // Logic to calculate streak requires checking consecutive dates.
  // For simplicity, assuming 1 word per day and using indices or dates.
  // Let's rely on checking wins.

  let lastWinDate: Date | null = null;

  attempts.forEach((attempt) => {
    played++;
    const isWin = attempt.guesses[attempt.guesses.length - 1].statuses.every((s: any) => s === "correct");
    
    if (isWin) {
      wins++;
      distribution[attempt.attempts - 1]++;
      
      const attemptDate = new Date(attempt.completed_at);
      // Strip time
      attemptDate.setHours(0, 0, 0, 0);

      if (lastWinDate) {
        const diffTime = Math.abs(attemptDate.getTime() - lastWinDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays === 1) {
          currentStreak++;
        } else if (diffDays > 1) {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      lastWinDate = attemptDate;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
        // Streak resets on loss? Wordle usually maintains streak if you don't play, but resets if you lose.
        // If you lose, streak is 0.
        currentStreak = 0;
        lastWinDate = null;
    }
  });

  return {
    played,
    winRate: Math.round((wins / played) * 100),
    currentStreak,
    maxStreak,
    distribution,
  };
}

