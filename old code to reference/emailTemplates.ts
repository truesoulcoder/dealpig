const emailTemplates = {
    offerEmail: (
        leadName: string,
        propertyAddress: string,
        offerPrice: string,
        senderName: string,
        acquisitionsDirector: string,
        phoneNumber: string,
        titleCompany: string
    ) => {
        return `I am writing to express my interest in structuring an all‑cash offer on the property located at ${propertyAddress}.

I propose a cash offer we've underwritten "as‑is" with limited information as to the property's current condition. Please keep in mind you will pay no closing costs, commissions, or seller fees if you choose to accept the offer. You won't even need to clean up or throw away any debris—we make it easy.

Based on current market conditions, comparable sales, and the property profile, I have outlined the specific terms in the attached Letter of Intent, including:

Price & Earnest Money Deposit
Purchase Option Period
Buyer's Assignment Consideration
Proposed Closing Date
As‑Is Condition Acceptance
Buyer Pays All Closing Costs
Quick Close Available

Title Company: ${titleCompany}

If you have any questions, simply hit Reply or call our office during business hours to speak with our Acquisitions Director, ${acquisitionsDirector}, at ${phoneNumber}. The offer is valid for 48 hours from time sent.

Warm regards,
${senderName} | True Soul Partners LLC

This Letter of Intent to Purchase Real Estate outlines general intentions and is not legally binding. Terms are subject to further negotiation and approval. No party is obligated until a formal agreement is executed.`;
    },

    followUpEmail: (leadName: string, propertyAddress: string, senderName: string) => `
        Hi ${leadName},

        I wanted to follow up regarding the property at ${propertyAddress}. 

        If you have any questions or need further information, please feel free to reach out.

        Looking forward to hearing from you.

        Best,
        ${senderName} | True Soul Partners LLC
    `
};

/**
 * Compiles an email template by replacing template variables with values
 * @param template The email template to compile
 * @param variables Object containing variable values to insert
 * @returns Compiled email content
 */
export function compile(template: string, variables: Record<string, string>): string {
    let compiledTemplate = template;
    
    // Replace all template variables with their values
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        compiledTemplate = compiledTemplate.replace(regex, value || '');
    });
    
    return compiledTemplate;
}

export default emailTemplates;