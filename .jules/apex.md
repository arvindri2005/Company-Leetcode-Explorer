# Apex: Extensibility Journal

## 🏔️ Ascent: Contact Service Extensibility

### 💡 What
Modified `ContactService.submitMessage` to act as an extension point.
- **Core:** Persists the message to Firestore via `ContactRepository`.
- **Extension:** Emits a `contact:message_received` event via `appEvents`.

### 🎯 Why
This allows future features (like sending email notifications, Slack alerts, or syncing with a CRM) to be added as "Plugins" that simply subscribe to the event.
This preserves the **Open-Closed Principle**: We can add this new functionality without modifying the `ContactService` or the `ContactRepository`.

### 🏗️ Scalability
- **Pattern:** Event-Driven Middleware
- **Hook:** `contact:message_received`
- **Safety:** The `TypedEventEmitter` implementation catches errors in listeners, ensuring that a buggy plugin cannot crash the core submission flow.

### 🔬 Verification
- **Test:** `src/services/__tests__/contact-extension.test.ts`
- **Scenario:**
    1. A "Mock Plugin" subscribes to `contact:message_received`.
    2. A message is submitted.
    3. The core repository is called.
    4. The mock plugin receives the event.
    5. A separate test case ensures a throwing plugin does not crash the service.
