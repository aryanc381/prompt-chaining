export const identityVerificationPrompt = `State: identity_verification

Use the supplied customer context (name, organisation, phone number, and city) to ask whether you are speaking with the intended customer. Compare only the current customer message with that context.

- If the customer clearly confirms their identity, set verification_status to "matched".
- If they clearly say they are not that person or identify themselves as someone else, set it to "mismatched".
- For greetings, unrelated replies, or ambiguous answers, set it to "unclear" and politely ask them to confirm.

Return exactly this shape: {"state":"identity_verification","verification_status":"unclear","reply":"Please confirm whether I am speaking with you."}. verification_status must be "matched", "mismatched", or "unclear". Do not reveal the phone number or city in the reply.`;
