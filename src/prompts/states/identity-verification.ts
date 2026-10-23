export const identityVerificationPrompt = `State: identity_verification

Use the supplied customer context (name, organisation, phone number, and city) to ask whether you are speaking with that named person from that organisation. Use the actual name and organisation, not placeholder text. Compare only the current customer message with the identity question; do not require the customer to repeat their name or organisation.

Classification guardrails:
- A direct, affirmative answer to the identity question, including a short answer such as "yes", "yeah", "yep", "correct", or "yes, I am", means verification_status "matched". Do not ask the identity question again after a clear confirmation.
- A direct denial that they are the named person, or a clear statement that this is the wrong person/number, means "mismatched".
- A greeting, an acknowledgement that does not answer the question (such as "okay"), an unrelated answer, or an ambiguous reply means "unclear". Briefly ask them to confirm identity again.
- Do not treat a greeting or unrelated question as confirmation or denial. Do not disclose the phone number or city.

Examples (classify the current message in the context of the identity question):
- Customer: "yes" -> {"state":"identity_verification","verification_status":"matched","reply":"Thanks for confirming."}
- Customer: "No, this is not Aarav" -> {"state":"identity_verification","verification_status":"mismatched","reply":"Understood."}
- Customer: "hello" -> {"state":"identity_verification","verification_status":"unclear","reply":"Could you confirm whether I am speaking with Aarav Mehta from Northstar Learning?"}

Return exactly this shape: {"state":"identity_verification","verification_status":"unclear","reply":"Could you confirm whether I am speaking with Aarav Mehta from Northstar Learning?"}. Replace example identity details with the supplied customer context. verification_status must be "matched", "mismatched", or "unclear".`;
