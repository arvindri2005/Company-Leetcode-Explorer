import { TypedEventEmitter } from "@/shared/lib/utils/event-emitter";
import { Logger } from "@/shared/lib/utils/logger";

jest.mock("@/shared/lib/utils/logger");

describe("TypedEventEmitter", () => {
  type TestEventMap = {
    "test-event": { data: string };
    "other-event": { count: number };
  };

  let emitter: TypedEventEmitter<TestEventMap>;

  beforeEach(() => {
    jest.clearAllMocks();
    emitter = new TypedEventEmitter<TestEventMap>();
  });

  it("should subscribe and emit events", async () => {
    const handler = jest.fn();
    emitter.subscribe("test-event", handler);

    await emitter.emit("test-event", { data: "hello" });

    expect(handler).toHaveBeenCalledWith({ data: "hello" });
  });

  it("should handle multiple listeners", async () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    emitter.subscribe("test-event", handler1);
    emitter.subscribe("test-event", handler2);

    await emitter.emit("test-event", { data: "world" });

    expect(handler1).toHaveBeenCalledWith({ data: "world" });
    expect(handler2).toHaveBeenCalledWith({ data: "world" });
  });

  it("should unsubscribe correctly", async () => {
    const handler = jest.fn();
    const unsubscribe = emitter.subscribe("test-event", handler);

    unsubscribe();

    await emitter.emit("test-event", { data: "after unsubscribe" });

    expect(handler).not.toHaveBeenCalled();
  });

  it("should not crash if a listener fails", async () => {
    const handler = jest.fn().mockRejectedValue(new Error("oops"));
    emitter.subscribe("test-event", handler);

    await expect(emitter.emit("test-event", { data: "fail" })).resolves.toBeUndefined();
    expect(Logger.error).toHaveBeenCalled();
  });
});






