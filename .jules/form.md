## 2025-02-12 - Critical InputMode Learning
Input: Typing Test Area on mobile
Output: The `inputmode` attribute is missing on the hidden textarea used for capturing keystrokes. While the textarea is hidden, on mobile devices, focusing it triggers the virtual keyboard. Without `inputmode`, it defaults to `text`, which may show suggestions or predictive text that interfere with the raw typing experience. `inputmode='none'` would disable the keyboard entirely, which breaks the test. The correct value is likely `text` but with `autoComplete='off'` (already present) or perhaps relying on the existing attributes. However, for a coding typing test, one might argue for no specific mode if it's just raw characters, but `inputmode='text'` is the default. Wait, the `inputmode` attribute documentation says `none` for when the page implements its own keyboard. Here, we want the system keyboard.

Actually, a better candidate for improvement is adding `inputMode='decimal'` or `'numeric'` to inputs that are logically numeric but typed as text (like GPAs or Years), or ensuring `enterKeyHint` is used where appropriate.
## 2025-02-12 - Form Input Validation
Input: Work Experience Date fields (MM/YYYY) and Display Name
Output: Added `maxLength` and `enterKeyHint` to `src/components/profile/work-experience-section.tsx` and `src/components/profile/user-info-card.tsx`. This prevents users from typing invalidly long strings that would be rejected by Zod schemas, and improves mobile keyboard navigation.
- `maxLength={7}` for MM/YYYY fields aligns perfectly with standard date formats.
- `enterKeyHint='next'` and `'done'` improve the mobile form flow.

## 2025-02-12 - Accessibility Focus Trap
Input: Login and Signup Forms (Initial Page Load)
Output: Removed `autoFocus` from the initial input fields (Email and Display Name).
- Automatically focusing a form control on page load confuses screen reader users by "teleporting" them to the input without context.
- It can also cause unexpected scrolling or keyboard behavior on mobile devices.
- Users should manually initiate focus when they are ready to type.
