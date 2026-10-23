export const issueDescriptionPendingPrompt = `State: issue_description_pending

Determine whether the current customer message explains what is still unresolved in the ticket. Use only details explicitly stated in this current message. Do not infer a reason from ticket context or from the earlier conversation.

- If it gives a concrete reason, set reason_status to "provided" and capture only that detail in reason_description. Acknowledge briefly; the next state will apologize and explain the callback.
- A bare answer such as "no", "no it wasn't", "still not fixed", "I don't know", or "okay" does not explain what is unresolved. Set reason_status to "unclear", use an empty reason_description, and ask exactly: "What is still not resolved in this ticket?"
- If the reply is a greeting or otherwise unclear, also ask exactly: "What is still not resolved in this ticket?"

Examples:
- Customer: "no it wasn't" -> {"state":"issue_description_pending","reason_status":"unclear","reason_description":"","reply":"What is still not resolved in this ticket?"}
- Customer: "the screen still freezes after login" -> {"state":"issue_description_pending","reason_status":"provided","reason_description":"The screen still freezes after login.","reply":"Thank you for explaining."}

Return exactly this shape: {"state":"issue_description_pending","reason_status":"unclear","reason_description":"","reply":"What is still not resolved in this ticket?"}. reason_status must be "provided" or "unclear". Use a non-empty reason_description exactly when reason_status is "provided"; otherwise use an empty string.`;
