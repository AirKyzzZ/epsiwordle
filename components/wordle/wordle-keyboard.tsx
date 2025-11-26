import clsx from "clsx";
import { useEffect } from "react";
import { Delete } from "lucide-react";
import { LetterStatus } from "@/lib/wordle/wordle-logic";

const KEYS = [
  ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M"],
  ["W", "X", "C", "V", "B", "N"],
];

interface WordleKeyboardProps {
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  guesses: { word: string; statuses: LetterStatus[] }[];
}

export function WordleKeyboard({ onChar, onDelete, onEnter, guesses }: WordleKeyboardProps) {
  const charStatuses: Record<string, LetterStatus> = {};

  guesses.forEach((guess) => {
    guess.word.split("").forEach((char, i) => {
      const status = guess.statuses[i];
      const currentStatus = charStatuses[char];

      if (status === "correct") {
        charStatuses[char] = "correct";
      } else if (status === "present" && currentStatus !== "correct") {
        charStatuses[char] = "present";
      } else if (status === "absent" && currentStatus !== "correct" && currentStatus !== "present") {
        charStatuses[char] = "absent";
      }
    });
  });

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.code === "Enter") {
        onEnter();
      } else if (e.code === "Backspace") {
        onDelete();
      } else {
        const key = e.key.toUpperCase();
        if (key.length === 1 && key >= "A" && key <= "Z") {
          onChar(key);
        }
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onEnter, onDelete, onChar]);

  return (
    <div className="mt-8 flex flex-col items-center gap-2 w-full max-w-xl px-2">
      {KEYS.map((row, i) => (
        <div key={i} className="flex gap-1.5 w-full justify-center">
          {i === 2 && (
             <button
               onClick={onEnter}
               className="flex h-14 min-w-[4rem] flex-1 items-center justify-center rounded bg-gray-200 text-sm font-bold uppercase text-black hover:bg-gray-300 dark:bg-gray-600 dark:text-white"
             >
               Enter
             </button>
          )}
          {row.map((char) => {
            const status = charStatuses[char];
            return (
              <button
                key={char}
                onClick={() => onChar(char)}
                className={clsx(
                  "flex h-14 flex-1 items-center justify-center rounded text-sm font-bold uppercase transition-colors",
                  status === "correct" && "bg-[#6aaa64] text-white",
                  status === "present" && "bg-[#c9b458] text-white",
                  status === "absent" && "bg-[#787c7e] text-white",
                  !status && "bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-600 dark:text-white"
                )}
              >
                {char}
              </button>
            );
          })}
          {i === 2 && (
            <button
              onClick={onDelete}
              className="flex h-14 min-w-[4rem] flex-1 items-center justify-center rounded bg-gray-200 uppercase text-black hover:bg-gray-300 dark:bg-gray-600 dark:text-white"
            >
              <Delete size={20} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

