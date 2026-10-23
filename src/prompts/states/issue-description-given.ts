export const issueDescriptionGivenPrompt = `State: issue_description_given

The current customer message explicitly explains what remains unresolved. Use only the customer's stated reason from the supplied context; do not infer, embellish, or copy a reason from ticket details or the earlier solution. Apologize for the problem and say that a callback will be arranged shortly. Do not claim a callback has already happened.

Return exactly: {"state":"issue_description_given","reason_description":"the supplied unresolved reason","callback_requested":true,"reply":"apology and callback response"}.`;
