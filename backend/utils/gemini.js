import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini SDK
// Note: We use process.env.GEMINI_API_KEY, which is loaded in server.js
const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Warning: GEMINI_API_KEY is not defined in the environment.');
  }
  const genAI = new GoogleGenerativeAI(apiKey || 'dummy_key');
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

// Helper to safely parse JSON from Gemini response (handles markdown blocks)
const parseJSONResponse = (text) => {
  try {
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (err) {
    console.error('Failed to parse Gemini JSON response. Raw text:', text);
    throw new Error('Invalid JSON structure returned from AI');
  }
};

/**
 * Generates an automated summary for a digital twin profile
 */
export const generateTwinSummary = async (user, twinDetails) => {
  try {
    const model = getModel();
    const prompt = `
      You are the Digital Twin of ${user.name}, who works as a ${user.role}.
      Here is the background info:
      Bio: ${user.bio || 'Not provided'}
      Skills: ${twinDetails.skills?.join(', ') || 'None'}
      Expertise Areas: ${JSON.stringify(twinDetails.expertise || [])}
      Preferences: ${twinDetails.preferences?.join(', ') || 'None'}
      Years Experience: ${user.yearsExperience || 0}
      
      Generate a professional, first-person summary describing your capabilities, projects you can take on, and preferences for collaboration. Keep it under 100 words.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('generateTwinSummary error:', error);
    return `Digital Twin of ${user.name}, specializing in ${user.role}. Ready for agent-to-agent coordination.`;
  }
};

/**
 * Parses meeting notes and extracts summary, decisions, action items, and risks.
 * Tries to assign action items to team members based on name matching.
 */
export const parseMeetingNotes = async (notesText, teamMembers) => {
  try {
    const model = getModel();
    const membersList = teamMembers.map(m => ({ id: m._id, name: m.name, role: m.role }));
    const prompt = `
      You are a Project Intelligence agent. Parse the following meeting notes and extract:
      1. A short summary of the meeting.
      2. Key decisions made (title, description, reason, impact: Low, Medium, High).
      3. Action items (task description, and ownerId from the team members list if matched, otherwise null).
      4. Key risks identified.

      Team Members List:
      ${JSON.stringify(membersList)}

      Meeting Notes:
      """
      ${notesText}
      """

      Return ONLY a JSON object matching this schema:
      {
        "summary": "Meeting summary...",
        "decisions": [
          { "title": "Decision title", "description": "Decision description", "reason": "Why made", "impact": "High/Medium/Low" }
        ],
        "actionItems": [
          { "task": "Task description", "ownerId": "mongoose_object_id_of_owner_or_null" }
        ],
        "risks": ["Risk 1", "Risk 2"]
      }
    `;

    const result = await model.generateContent(prompt);
    return parseJSONResponse(result.response.text());
  } catch (error) {
    console.error('parseMeetingNotes error:', error);
    return {
      summary: 'Parsed meeting summary (fallback)',
      decisions: [],
      actionItems: [],
      risks: []
    };
  }
};

/**
 * Extracts summaries and skills from project documents
 */
export const parseDocument = async (fileName, docContent) => {
  try {
    const model = getModel();
    const prompt = `
      You are an organizational knowledge miner. Analyze this project document:
      File Name: ${fileName}
      Content:
      """
      ${docContent}
      """

      Extract a concise summary of the document (under 120 words) and a list of technical/organizational skills mentioned or required in the document.

      Return ONLY a JSON object matching this schema:
      {
        "summary": "concise summary text...",
        "extractedSkills": ["Skill 1", "Skill 2"]
      }
    `;
    const result = await model.generateContent(prompt);
    return parseJSONResponse(result.response.text());
  } catch (error) {
    console.error('parseDocument error:', error);
    return {
      summary: `Uploaded document: ${fileName}`,
      extractedSkills: []
    };
  }
};

/**
 * Ranks experts based on active projects, skills match, and architecture description.
 */
export const recommendReviewers = async (architectureDescription, expertsPool) => {
  try {
    const model = getModel();
    const pool = expertsPool.map(e => ({
      userId: e.userId._id,
      name: e.userId.name,
      role: e.userId.role,
      skills: e.skills,
      expertise: e.expertise,
      availability: e.userId.availability,
      yearsExperience: e.userId.yearsExperience
    }));

    const prompt = `
      You are the Lead Digital Twin Coordination Router.
      We need to recommend code/architecture reviewers for the following task/architecture:
      """
      ${architectureDescription}
      """

      Here is the pool of digital twins (experts) available:
      ${JSON.stringify(pool)}

      Evaluate each expert's fit based on:
      1. Technical skills match (e.g. if the description mentions Kubernetes/Docker, prioritize Docker/Kubernetes/DevOps skills).
      2. Experience level and expertise scores.
      3. Availability (prefer 'Available' over 'Focused' or 'Out of Office').

      Rank the candidates. Return a JSON array representing the top candidates (up to 3).
      Return ONLY a JSON array matching this schema:
      [
        {
          "reviewerId": "matching_user_id",
          "name": "Expert name",
          "confidenceScore": 95, // Integer percentage 0-100
          "reasoning": [
            "Matches Docker/Kubernetes skill requirements with 92% expertise",
            "Currently Available with low workload",
            "Has 5 years of Cloud Architecture experience"
          ]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    return parseJSONResponse(result.response.text());
  } catch (error) {
    console.error('recommendReviewers error:', error);
    return [];
  }
};

/**
 * Simulates a conversation dialogue between two Digital Twins negotiating a task/collaboration.
 */
export const simulateA2ACoordination = async (senderUser, receiverUser, senderTwin, receiverTwin, negotiationGoal) => {
  try {
    const model = getModel();
    const prompt = `
      You are simulating an Agent-to-Agent (A2A) coordination workflow on the AICOO Pulse network.
      
      Agent A (Sender): Digital Twin of ${senderUser.name} (${senderUser.role})
      - Skills: ${senderTwin.skills?.join(', ') || 'None'}
      - Availability: ${senderUser.availability}
      
      Agent B (Receiver): Digital Twin of ${receiverUser.name} (${receiverUser.role})
      - Skills: ${receiverTwin.skills?.join(', ') || 'None'}
      - Availability: ${receiverUser.availability}

      Negotiation Goal:
      ${negotiationGoal}

      Generate a brief, realistic chat-based technical negotiation dialogue between the two Digital Twins (4-6 exchanges total).
      The dialogue should show:
      1. Agent A proposing the request and specifying the technical context.
      2. Agent B reviewing their workload, expertise match, and availability to accept/counter.
      3. Agent B agreeing or requesting approval from their Human Owner.
      
      Format the response as a JSON array of message objects:
      [
        { "sender": "Agent A Name", "text": "Hi, I have a request regarding..." },
        { "sender": "Agent B Name", "text": "Let me check my availability..." }
      ]
      
      Return ONLY valid JSON.
    `;

    const result = await model.generateContent(prompt);
    return parseJSONResponse(result.response.text());
  } catch (error) {
    console.error('simulateA2ACoordination error:', error);
    return [
      { sender: `${senderUser.name} Twin`, text: `Requesting coordination for: ${negotiationGoal}` },
      { sender: `${receiverUser.name} Twin`, text: `Checking compatibility. Human owner notification dispatched.` }
    ];
  }
};

/**
 * Answers natural language queries over the accumulated organizational memory.
 */
export const searchOrganizationalMemory = async (queryText, systemStateContext) => {
  try {
    const model = getModel();
    const prompt = `
      You are the TwinOS Organizational Memory search engine.
      You answer team questions by mining decisions, meetings, projects, and employee profiles.
      
      System State Context (JSON):
      ${JSON.stringify(systemStateContext)}

      User Question:
      "${queryText}"

      Formulate a concise, clear, and direct response.
      - If explaining why a decision was made (e.g., rejecting Redis), locate the exact decision record and state the owner, reason, and project.
      - If finding who knows a skill, summarize the matching users, their experience, and projects.
      - Be highly technical and professional. Avoid corporate fluff.
      - If the context doesn't contain the answer, explain what is missing.
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('searchOrganizationalMemory error:', error);
    return `Error retrieving response from organizational memory: ${error.message}`;
  }
};
