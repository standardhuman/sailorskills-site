// api/commit-story.js
export const config = {
  runtime: 'edge',
};

const GITHUB_API_BASE = 'https://api.github.com';

async function fetchCommits(token, org, repo) {
  const url = `${GITHUB_API_BASE}/repos/${org}/${repo}/commits?per_page=100`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return await response.json();
}

function filterMilestoneCommits(commits) {
  const milestonePatterns = /^\[(FEATURE|FIX|PHASE|DOC)\]/;

  return commits
    .filter(commit => {
      const message = commit.commit.message;
      return milestonePatterns.test(message);
    })
    .map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      date: commit.commit.author.date,
      author: commit.commit.author.name,
    }));
}

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const TRANSLATION_PROMPT = `You are translating git commits for a marine service business management suite.
Target audience: Hull cleaner divers who run small marine service businesses.

Their daily pain points:
- Scheduling: Managing boat service appointments, tracking which boats need cleaning
- Billing: Creating invoices, tracking payments, handling customer accounts
- Inventory: Managing anode supplies, tracking installations on boats
- Communication: Keeping customers informed about service status
- Operations: Recording underwater work, propeller tracking, service history

For each commit below, identify:
1. Which pain point category it addresses (Scheduling, Billing, Inventory, Communication, Operations, or skip if internal)
2. A 1-2 sentence business translation: what problem this solves for hull cleaners

Return ONLY valid JSON array with this structure:
[
  {
    "category": "Operations",
    "business_impact": "Track propeller condition during underwater inspections.",
    "commit_sha": "abc123",
    "date": "2025-10-15"
  }
]

Skip commits that are purely internal (tests, CI/CD, refactoring) unless they directly impact user workflow.

Commits to translate:`;

async function translateCommitsWithGemini(commits, apiKey) {
  const commitsData = commits.map(c => ({
    sha: c.sha,
    message: c.message,
    date: c.date,
  }));

  const prompt = `${TRANSLATION_PROMPT}\n\n${JSON.stringify(commitsData, null, 2)}`;

  const url = `${GEMINI_API_BASE}/models/gemini-pro:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates[0]?.content?.parts[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini');
  }

  // Extract JSON from markdown code blocks if present
  const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
  const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

  return JSON.parse(jsonText);
}

function categorizeTranslations(translations) {
  const categories = {
    Operations: [],
    Billing: [],
    Scheduling: [],
    Inventory: [],
    Communication: [],
  };

  translations.forEach(item => {
    if (categories[item.category]) {
      categories[item.category].push(item);
    }
  });

  return categories;
}

export default async function handler(request) {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const geminiKey = process.env.GEMINI_API_KEY;
    const org = process.env.GITHUB_ORG || 'standardhuman';
    const repo = process.env.GITHUB_REPO || 'sailorskills-repos';

    if (!githubToken || !geminiKey) {
      return new Response(
        JSON.stringify({ error: 'API keys not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch and filter commits
    const commits = await fetchCommits(githubToken, org, repo);
    const milestones = filterMilestoneCommits(commits);

    // Translate with Gemini
    const translations = await translateCommitsWithGemini(milestones, geminiKey);
    const categorized = categorizeTranslations(translations);

    return new Response(
      JSON.stringify({
        categories: categorized,
        lastUpdated: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Commit story API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
