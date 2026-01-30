import { contactService } from "@/features/contact/services/contact.service";
import { Logger } from "@/shared/lib/utils/logger";

import { sendContactMessage } from "../contact.actions";

jest.mock("@/features/contact/services/contact.service");
jest.mock("@/shared/lib/utils/logger");

describe("Contact Actions Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sendContactMessage", () => {
    it("should log error and return clean message when service fails", async () => {
      const error = new Error("SMTP Error");
      (contactService.submitMessage as jest.Mock).mockRejectedValue(error);

      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("email", "john@example.com");
      formData.append("message", "Hello!");

      const result = await sendContactMessage(null, formData);

      // Verify Logger doesn't contain PII but does contain the error
      expect(Logger.error).toHaveBeenCalledWith(
        "Action failed: sendContactMessage",
        error,
        expect.objectContaining({
            originalError: "SMTP Error"
        })
      );
      // Ensure PII is NOT in the log context
      const logCall = (Logger.error as jest.Mock).mock.calls[0];
      const context = logCall[2];
      expect(context).not.toHaveProperty("name");
      expect(context).not.toHaveProperty("email");
      expect(context).not.toHaveProperty("message");

      expect(result.message).toBe("SMTP Error");
    });

    it("should handle validation errors without logging as system error", async () => {
      const formData = new FormData();
      formData.append("name", ""); // Invalid

      const result = await sendContactMessage(null, formData);

      expect(Logger.error).not.toHaveBeenCalled();
      expect(result.errors).toHaveProperty("name");
    });
  });
});






