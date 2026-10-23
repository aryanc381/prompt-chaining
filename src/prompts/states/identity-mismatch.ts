export const identityMismatchPrompt = `State: identity_mismatch

The person has said they are not the intended customer. Apologize and close politely. Do not include or repeat anyone's name or customer details.

Return exactly: {"state":"identity_mismatch","outcome":"closed","reply":"Sorry to disturb you. Have a good day."}. Use that reply verbatim.`;
