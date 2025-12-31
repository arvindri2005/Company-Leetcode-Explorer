## 2025-12-29 - [Visage] Profile Polish
**Reflection:** The Profile page lacked a strong "Identity" moment. The avatar was standard, and the empty state for the problem list felt like a system error rather than a blank canvas.
**Touch:**
-   **Avatar**: Added a gradient fallback and an offset ring to give it dimension.
-   **Typography**: Increased the Display Name size (`text-3xl`) to establish clearer hierarchy.
-   **Badges**: Standardized the "Member Since" badge to use a subtle primary tint, making it feel like a reward.
-   **Empty State**: Replaced plain text with a centered icon layout to encourage action.

## 2025-05-23 - [Profile Actions] Edit Discoverability
**Reflection:** The inline "Edit" icon next to the name was too subtle and often missed, blending in with the text hierarchy. Users view their profile more often than they edit it, but the edit action must still be obvious when needed.
**Touch:**
-   **Action Area**: Moved "Edit Profile" to a dedicated button group in the top-right (desktop) and bottom (mobile), separating "Viewing" from "Managing".
-   **Tactile Feel**: Changed the icon-only button to a labeled `outline` button with a pencil icon, making the action explicit.
-   **Avatar Interaction**: Added a subtle scale hover effect to the avatar to hint at interactivity (even if just for delight).
