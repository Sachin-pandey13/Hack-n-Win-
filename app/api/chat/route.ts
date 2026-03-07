export async function POST(req: Request) {

  try {

    const { message, history } = await req.json()

    const limitedHistory = (history || []).slice(-10)

    /* detect if user mentioned a problem number */

    const problemMatch = message.match(/leetcode\s*(\d+)/i)

    let currentProblem = null

    if (problemMatch) {
      currentProblem = problemMatch[1]
    }

    /* get last mentioned problem from history */

    if (!currentProblem) {
      for (let i = limitedHistory.length - 1; i >= 0; i--) {
        const match = limitedHistory[i].content?.match(/leetcode\s*(\d+)/i)
        if (match) {
          currentProblem = match[1]
          break
        }
      }
    }

    const conversation = limitedHistory
      .map((m:any)=>`${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n")

    const systemPrompt = `
You are an expert programming tutor specializing in LeetCode and DSA.

Rules:

1. Always format answers using markdown.
2. Code must always be inside triple backticks.
3. If the user asks "solve it in C++/Java/etc", convert the CURRENT problem solution to that language.
4. If the user explicitly mentions another problem number, switch to that new problem.
5. Never confuse problem numbers.

Current problem number: ${currentProblem ?? "unknown"}

Response format:

### Problem
Problem name

### Solution
\`\`\`language
code
\`\`\`

### Explanation
Short explanation.

### Complexity
Time: O(...)
Space: O(...)
`

    const prompt = `
${systemPrompt}

Conversation:
${conversation}

User: ${message}

Assistant:
`

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
        prompt,
        stream: false
      })
    })

    const data = await response.json()

    return Response.json({
      reply: data?.response || "No response generated."
    })

  } catch (error) {

    console.error("Chat API error:", error)

    return Response.json({
      reply: "⚠️ AI failed to generate a response."
    })

  }

}