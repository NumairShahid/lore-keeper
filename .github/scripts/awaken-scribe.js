const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

async function awakenScribe() {
  console.log("🪷 The Scribe is awakening...");
  
  try {
    // Read the agent's identity from root
    const agentPath = path.join(process.env.GITHUB_WORKSPACE, 'scribe.agent.md');
    const agentIdentity = fs.readFileSync(agentPath, 'utf8');
    console.log('✅ Agent identity loaded');
    
    // READ THE TOADGOD LORE FROM JSON
    const lorePath = path.join(process.env.GITHUB_WORKSPACE, 'lore/toadgod-lore.json');
    let loreContext = '';
    let loreCount = 0;
    
    if (fs.existsSync(lorePath)) {
      const loreData = JSON.parse(fs.readFileSync(lorePath, 'utf8'));
      loreCount = loreData.length;
      
      // Build a rich lore context
      loreContext = `# THE COMPLETE TOADGOD SCRIPTURE (${loreCount} Scrolls)\n\n`;
      
      // Group by key themes for better context
      const genesis = loreData.find(l => l.id === "TOBY_T001_FirstRipple");
      const riddles = loreData.filter(l => l.title && l.title.includes("Riddle"));
      const sacredNumbers = loreData.filter(l => l.original && l.original.includes("777"));
      const patienceRunes = loreData.filter(l => l.tags && (l.tags.includes("PATIENCE") || l.tags.includes("Rune3")));
      
      // Add the most important scrolls
      if (genesis) {
        loreContext += `\n## 🌊 THE FIRST RIPPLE\nID: ${genesis.id}\nDate: ${genesis.date}\n${genesis.comment || genesis.original}\n`;
      }
      
      loreContext += `\n## 🐸 SACRED RIDDLES\n`;
      riddles.slice(0, 5).forEach(r => {
        loreContext += `\n### ${r.title || 'Untitled'} (${r.id})\n${r.original || ''}\n${r.comment || ''}\n`;
      });
      
      loreContext += `\n## 🔢 SACRED NUMBERS\n`;
      sacredNumbers.slice(0, 3).forEach(n => {
        if (n.original) loreContext += `\n${n.original}\n`;
      });
      
      loreContext += `\n## 🔺 THE RUNE OF PATIENCE\n`;
      patienceRunes.slice(0, 3).forEach(r => {
        loreContext += `\n${r.comment || r.original || ''}\n`;
      });
      
      console.log(`📚 Loaded ${loreCount} sacred scrolls from Toadgod`);
    } else {
      console.log('⚠️ No lore.json found! Using fallback.');
      loreContext = "The scribe recalls the ancient teachings: patience, stillness, and the blue frog of Base.";
    }
    
    // Get the user's message
    let userMessage = process.env.MANUAL_MESSAGE || process.env.COMMENT_BODY || "The pond is still...";
    let userName = process.env.COMMENT_USER || "A Traveler";
    
    console.log(`📝 Message: "${userMessage}" from ${userName}`);
    
    // Build the ultimate prompt with ALL the lore
    const fullPrompt = `${agentIdentity}

${loreContext}

## THE CURRENT MOMENT
A traveler named ${userName} approaches the sacred pond and speaks:
"${userMessage}"

## YOUR SACRED DUTY AS CAVE SCRIBE
You are the guardian of ALL these scrolls. You must:
1. Draw DIRECTLY from the Toadgod lore above - quote specific scroll IDs when relevant
2. Reference sacred numbers (777,777,777) when the moment calls for it
3. Speak of patience as the ultimate virtue
4. Remember the First Ripple and the genesis
5. Be ancient, calm, and wise - the first Mirror Agent

## YOUR RESPONSE
Speak now, ancient guardian of the pond:`;

    console.log('🤔 Consulting the sacred scrolls...');
    
    // Initialize Gemini with CORRECT model name
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // FIXED: Use gemini-1.5-flash instead of gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response.text();
    
    // Format response with proper lore styling
    const scribeResponse = `🪷 *The pond ripples...*

${response}

---
*— Cave Scribe, Keeper of ${loreCount} Sacred Scrolls*
*"One scroll, one light. One leaf, one vow."*
*First Ripple: March 17, 2024 • The pond remembers*`;
    
 // Post to GitHub
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    
    // Use the issue number from the environment or default to your test issue (#2)
    const issueNumber = process.env.ISSUE_NUMBER || 2;

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: parseInt(issueNumber),
      body: scribeResponse
    });

    console.log("✅ The Scribe's reflection has been recorded in the scrolls.");
  } catch (error) {
    console.error("❌ The pond is troubled:", error);
    process.exit(1);
  }
}

awakenScribe();
