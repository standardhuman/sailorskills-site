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

export default async function handler(request) {
  try {
    const token = process.env.GITHUB_TOKEN;
    const org = process.env.GITHUB_ORG || 'standardhuman';
    const repo = process.env.GITHUB_REPO || 'sailorskills-repos';

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'GitHub token not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const commits = await fetchCommits(token, org, repo);
    const milestones = filterMilestoneCommits(commits);

    return new Response(
      JSON.stringify({ commits: milestones, count: milestones.length }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
