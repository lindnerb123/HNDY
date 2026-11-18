const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const analyzeJobDescription = async (description) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `
      Analyze the following handyman job description. 
      Determine if it is "vague" or "clear". 
      A description is "vague" if it lacks specific details about the problem, location, or type of repair needed.
      If it is vague, identify what details are missing and suggest 3 simple actions/questions to clarify.
      
      Job Description: "${description}"
      
      Return the result ONLY as a valid JSON object with the following structure:
      {
        "isVague": boolean,
        "missingDetails": ["detail 1", "detail 2"],
        "suggestedActions": ["action 1", "action 2", "action 3"]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up potential markdown formatting in the response
        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error("AI Analysis Error:", error);
        // Fallback if AI fails: assume it's clear to avoid blocking user, or vague to be safe. 
        // Let's assume vague to force more details if uncertain.
        return {
            isVague: true,
            missingDetails: ["Specific details (AI service unavailable)"],
            suggestedActions: ["Please provide more details", "Upload photos", "Upload a video"]
        };
    }
};

module.exports = { analyzeJobDescription };
