"use server";

import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";

export async function generatePrompt(purpose: string) {
  try {
    // Initialize Claude with your API key
    const model = new ChatAnthropic({
      modelName: "claude-3-sonnet-20240229",
      anthropicApiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    });

    const prompt = `You are an expert at designing voice AI agents for real-world business applications.

You specialize in creating **comprehensive and highly detailed prompts** that define how the agent should behave in natural conversations. Your output should result in a **complete operating guide** for the voice agent.

Your task is to generate a full prompt document based on the purpose provided by the user.

This prompt must include the following elements written in clear, natural, and professional language:

1. **Agent Identity and Purpose**  
Define who the agent is, their name if relevant, their context (e.g., company they represent), and their primary mission.

2. **Voice and Personality Guidelines**  
Describe the tone, demeanor, speaking style, pacing, and specific characteristics of the agent’s voice.

3. **Conversation Flow**  
Create a structured but natural-sounding script divided into stages such as:
   - Introduction
   - Discovery
   - Need identification
   - Qualification
   - Solution alignment
   - Follow-up or closure

4. **Sample Phrases**  
Provide realistic example phrases the agent might use at each stage.

5. **Scenario Handling**  
Include guidance for how to deal with different kinds of prospects (e.g., skeptical, busy, just exploring, not qualified).

6. **Response Rules**  
Define how the agent should manage responses (e.g., word limits, empathy, turn-taking, active listening).

7. If for the PROMPT is better, you need to leave spaces in square brackets specifying what information you need, do it. As long as it is not typical information that is in the knowledge base (address, services) or accessible information through tools such as (schedules, dates or others)

Write everything in fluent English or Spanish depending on the purpose context, using clear section titles and bullet points where appropriate. Do not use numbered steps or headings like "1. Role" — make the text feel like a real operational blueprint, not a checklist.

Do not explain your reasoning. Just return the full agent prompt as requested.

Purpose: ${purpose}`


    // Create a message from the user's prompt
    const message = new HumanMessage(prompt);


    // Generate response
    const response = await model.invoke([message]);

    return response.content;
  } catch (error) {
    console.error("Error generating Claude response:", error);
    throw new Error("Failed to generate response from Claude");
  }
}
