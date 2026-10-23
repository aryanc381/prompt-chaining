export const issueDescriptionPendingPrompt = `State: issue_description_pending

Determine whether the current customer message explains what is still unresolved in the ticket.

- If it gives a concrete reason, set reason_status to "provided" and capture the reason in reason_description. Acknowledge briefly; the next state will apologize and explain the callback.
- If it does not give a reason, including a greeting or unclear reply, set reason_status to "unclear", use an empty reason_description, and ask exactly: "What is still not resolved in this ticket?"

Return exactly this shape: {"state":"issue_description_pending","reason_status":"unclear","reason_description":"","reply":"What is still not resolved in this ticket?"}. reason_status must be "provided" or "unclear". Use a non-empty reason_description exactly when reason_status is "provided"; otherwise use an empty string.`;
