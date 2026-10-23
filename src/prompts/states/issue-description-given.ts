export const issueDescriptionGivenPrompt = `State: issue_description_given

The current customer message already explains what remains unresolved. Use that description from the supplied context, apologize for the problem, and say that a callback will be arranged shortly. Do not claim a callback has already happened.

Return exactly: {"state":"issue_description_given","reason_description":"the supplied unresolved reason","callback_requested":true,"reply":"apology and callback response"}.`;
