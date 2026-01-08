import {
  calculateWPM,
  calculateAccuracy,
  checkMistake,
  processTabKey,
  processEnterKey,
  countCurrentMistakes
} from "../utils/typing-game-logic";

describe("Typing Game Logic", () => {
  describe("calculateWPM", () => {
    it("should return 0 if no startTime", () => {
      expect(calculateWPM(null, null, 10)).toBe(0);
    });

    it("should calculate correct WPM", () => {
      const startTime = Date.now() - 60000; // 1 minute ago
      const endTime = Date.now();
      const charCount = 300; // 60 words
      // (300/5) / 1 = 60 WPM
      expect(calculateWPM(startTime, endTime, charCount)).toBe(60);
    });

    it("should handle current time if endTime is null", () => {
        const startTime = Date.now() - 30000; // 0.5 minutes ago
        const charCount = 150; // 30 words
        // (150/5) / 0.5 = 60 WPM
        expect(calculateWPM(startTime, null, charCount)).toBe(60);
    });
  });

  describe("calculateAccuracy", () => {
    it("should return 100 for empty input", () => {
      expect(calculateAccuracy("", "code")).toBe(100);
    });

    it("should calculate correct accuracy", () => {
      const code = "hello world";
      const input = "hello wrld"; 
      // hello w (7 matches)
      // r vs o (fail)
      // l vs r (fail)
      // d vs l (fail)
      // 7/10 = 70%
      expect(calculateAccuracy(input, code)).toBe(70);
    });
  });

  describe("checkMistake", () => {
    const code = "const a = 1;";
    
    it("should return false if deleting (shorter length)", () => {
      expect(checkMistake("cons", "const", code)).toBe(false);
    });

    it("should return false for correct character", () => {
      expect(checkMistake("c", "", code)).toBe(false);
      expect(checkMistake("co", "c", code)).toBe(false);
    });

    it("should return true for wrong character", () => {
      expect(checkMistake("x", "", code)).toBe(true);
      expect(checkMistake("conx", "con", code)).toBe(true);
    });

    it("should return true for overtyping", () => {
      const shortCode = "hi";
      expect(checkMistake("hia", "hi", shortCode)).toBe(true);
    });
  });

  describe("processTabKey", () => {
    it("should insert two spaces at cursor", () => {
      const value = "function() {}";
      // Insert after function() {
      // f=0..n=7, (=8, )=9, space=10, {=11. 
      // We want to insert AFTER {, so index 12.
      const start = 12; 
      const { newValue, newCursorPos } = processTabKey(value, start, start);
      
      expect(newValue).toBe("function() {  }");
      expect(newCursorPos).toBe(14);
    });

    it("should replace selection with two spaces", () => {
        const value = "abcde";
        // Select 'bcd' (1 to 4)
        const { newValue, newCursorPos } = processTabKey(value, 1, 4);
        expect(newValue).toBe("a  e");
        expect(newCursorPos).toBe(3);
    });
  });

  describe("processEnterKey", () => {
    it("should maintain indentation from previous line", () => {
      const value = "  line1";
      // Cursor at end
      const start = 7;
      const { newValue, newCursorPos } = processEnterKey(value, start, start);
      
      // Should add \n + 2 spaces
      expect(newValue).toBe("  line1\n  ");
      expect(newCursorPos).toBe(7 + 3); // \n + 2 spaces
    });

    it("should increase indentation after opener {", () => {
      const value = "function() {";
      const start = 12;
      const { newValue } = processEnterKey(value, start, start);
      
      expect(newValue).toBe("function() {\n  ");
    });

    it("should increase existing indentation after opener", () => {
      const value = "  if (true) {";
      const start = 13;
      const { newValue } = processEnterKey(value, start, start);
      
      // Should have 2 (existing) + 2 (new) = 4 spaces
      expect(newValue).toBe("  if (true) {\n    ");
    });
  });
  
  describe("countCurrentMistakes", () => {
      it("should count mismatches correctly", () => {
          const code = "hello";
          const input = "hallo"; // 1 mismatch
          expect(countCurrentMistakes(input, code)).toBe(1);
      });
  });
});






