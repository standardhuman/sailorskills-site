// src/pages/CommitStoryPage.tsx
import React, { useState, useEffect } from 'react';
import '../App.css';

interface CommitStory {
  category: string;
  business_impact: string;
  commit_sha: string;
  date: string;
}

interface StoryData {
  categories: {
    Operations: CommitStory[];
    Billing: CommitStory[];
    Scheduling: CommitStory[];
    Inventory: CommitStory[];
    Communication: CommitStory[];
  };
  lastUpdated: string;
}

export default function CommitStoryPage() {
  const [data, setData] = useState<StoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/commit-story')
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setData(data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="container">Loading commit story...</div>;
  }

  if (error) {
    return <div className="container">Error: {error}</div>;
  }

  return (
    <div className="container">
      <header className="story-header">
        <h1>Building SailorSkills: Solving Real Problems for Hull Cleaners</h1>
        <p className="subtitle">
          Active development of solutions to marine service challenges
        </p>
        {data && (
          <p className="last-updated">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        )}
      </header>

      <main>
        {data && Object.entries(data.categories).map(([category, stories]) => (
          stories.length > 0 && (
            <CategorySection
              key={category}
              category={category}
              stories={stories}
            />
          )
        ))}
      </main>
    </div>
  );
}

interface CategorySectionProps {
  category: string;
  stories: CommitStory[];
}

function CategorySection({ category, stories }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(category === 'Operations');

  return (
    <section className="category-section">
      <h2 onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
        {category} Solutions - {stories.length} features
        <span>{expanded ? ' ▼' : ' ▶'}</span>
      </h2>

      {expanded && (
        <div className="feature-cards">
          {stories.map((story, idx) => (
            <div key={idx} className="feature-card">
              <p className="business-impact">{story.business_impact}</p>
              <div className="feature-meta">
                <span className="date-badge">
                  Added {new Date(story.date).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <a
                  href={`https://github.com/standardhuman/sailorskills-repos/commit/${story.commit_sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="commit-link"
                >
                  View commit
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
