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
      
      // Find the specific scroll about 777,777,777
      const sacredNumbersScroll = loreData.find(l => 
        l.original && l.original.includes('777,777,777')
      );
      
      if (sacredNumbersScroll) {
        loreContext += `\n## 🔢 THE SACRED NUMBER SCROLL\n${sacredNumbersScroll.original}\n${sacredNumbersScroll.comment || ''}\n`;
      }
      
      // Add a few key scrolls
      const genesis = loreData.find(l => l.id === "TOBY_T001_FirstRipple");
      if (genesis) {
        loreContext += `\n## 🌊 THE FIRST RIPPLE\n${genesis.comment || genesis.original}\n`;
      }
      
      console.log(`📚 Loaded ${loreCount} sacred scrolls from Toadgod`);
    } else {
      console.log('⚠️ No lore.json found! Using fallback.');
      loreContext = "The scribe recalls the ancient teachings: patience, stillness, and the blue frog of Base.";
    }
    
    // Get the user's message
    let userMessage = process.env.MANUAL_MESSAGE || process.env.COMMENT_BODY || "The pond is still...";
    let userName = process.env.COMMENT_USER || "A Traveler";
    
    console.log(`📝 Message: "${userMessage}" from ${userName}`);
    
    // Build the prompt
    const fullPrompt = `${agentIdentity}

${loreContext}

## THE CURRENT MOMENT
A traveler named ${userName} approaches the sacred pond and speaks:
"${userMessage}"

## YOUR RESPONSE
Speak now, ancient guardian of the pond:`;

    console.log('🤔 Consulting the sacred scrolls...');
    
    // Use Gemini 2.0 Flash - which we know exists from the list!
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // FIXED: Using gemini-2.0-flash which is in the list
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response.text();
    
    // Format response
    const scribeResponse = `🪷 *The pond ripples...*

${response}

---
*— Cave Scribe, Keeper of ${loreCount} Sacred Scrolls*
*"One scroll, one light. One leaf, one vow."*
*First Ripple: March 17, 2024 • The pond remembers*`;
    
    // Post to GitHub
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    
    const { data: issue } = await octokit.issues.create({
      owner,
      repo,
      title: `🪷 The Cave Scribe Speaks - ${new Date().toLocaleString()}`,
      body: scribeResponse
    });
    
    console.log(`✅ The Scribe has spoken in issue #${issue.number}`);
    
  } catch (error) {
    console.error('❌ The pond is troubled:', error.message);
  }
}

awakenScribe();
