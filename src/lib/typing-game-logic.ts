/**
 * @fileoverview Pure logic functions for the Typing Game.
 * Extracts complexity from the React hook to testable, stateless functions.
 */

// Calculate WPM: (Total Characters / 5) / Time (min)
export function calculateWPM(startTime: number | null, endTime: number | null, charCount: number): number {
  if (!startTime) return 0;
  const end = endTime || Date.now();
  const timeInMinutes = (end - startTime) / 60000;
  if (timeInMinutes <= 0) return 0;
  return Math.round((charCount / 5) / timeInMinutes);
}

// Calculate Accuracy: (Correct Chars / Total Chars) * 100
export function calculateAccuracy(userInput: string, code: string): number {
  if (userInput.length === 0) return 100;

  let correctChars = 0;
  for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === code[i]) {
          correctChars++;
      }
  }
  return Math.round((correctChars / userInput.length) * 100);
}

// Check if the latest input introduced a mistake
export function checkMistake(newValue: string, prevValue: string, code: string): boolean {
  // Only check if we added characters
  if (newValue.length <= prevValue.length) return false;

  const newCharIndex = newValue.length - 1;
  // Mistake if overtyping beyond code length or wrong character
  if (newCharIndex >= code.length) return true;

  return newValue[newCharIndex] !== code[newCharIndex];
}

interface TextChangeResult {
  newValue: string;
  newCursorPos: number;
}

// Handle Tab Key: Insert 2 spaces
export function processTabKey(value: string, selectionStart: number, selectionEnd: number): TextChangeResult {
  const newValue = value.substring(0, selectionStart) + "  " + value.substring(selectionEnd);
  const newCursorPos = selectionStart + 2;
  return { newValue, newCursorPos };
}

// Handle Enter Key: Smart indentation
export function processEnterKey(value: string, selectionStart: number, selectionEnd: number): TextChangeResult {
  // Find the start of the current line
  const lastNewLine = value.lastIndexOf('\n', selectionStart - 1);
  const currentLineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
  const currentLine = value.substring(currentLineStart, selectionStart);

  // Calculate existing indentation
  const match = currentLine.match(/^(\s*)/);
  let indentation = match ? match[1] : "";

  // Check for block opener char at end of current line segment (ignoring trailing whitespace)
  const trimmedLine = currentLine.trimEnd();
  if (trimmedLine.endsWith('{') || trimmedLine.endsWith('(') || trimmedLine.endsWith('[')) {
      indentation += "  "; // Add 2 spaces indent
  }

  const insertion = "\n" + indentation;
  const newValue = value.substring(0, selectionStart) + insertion + value.substring(selectionEnd);
  const newCursorPos = selectionStart + insertion.length;

  return { newValue, newCursorPos };
}

export function countCurrentMistakes(userInput: string, code: string): number {
    let count = 0;
    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] !== code[i]) count++;
    }
    return count;
}
