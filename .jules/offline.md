## 2024-05-24 - Login Form Silent Failure Disconnect
Disconnect: When offline, users could still attempt to click "Login" or "Sign Up", leading to a silent failure or an unhandled Firebase network error because `signInWithEmailAndPassword` requires a connection.
Link: Added `useOnlineStatus` hook to `LoginForm` and `SignupForm` to explicitly disable the submit button and change the text to "You are offline" when `navigator.onLine` is false. This prevents the user from initiating a doomed request and provides immediate feedback.
