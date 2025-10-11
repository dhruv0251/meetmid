import { useState } from 'react';

export default function AIChat({ onSearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      // Get locations from sessionStorage if available
      let location1 = null, location2 = null;
      try {
        const results = sessionStorage.getItem('meetmid-results');
        if (results) {
          const parsed = JSON.parse(results);
          location1 = parsed.location1;
          location2 = parsed.location2;
        }
      } catch (e) {}

      // fallback: try meetmid-nlp-query (for new search)
      if (!location1 || !location2) {
        const nlp = sessionStorage.getItem('meetmid-nlp-query');
        if (nlp) {
          const parsed = JSON.parse(nlp);
          location1 = parsed.location1;
          location2 = parsed.location2;
        }
      }

      if (!location1 || !location2) {
        alert('Please select both locations before using AI search.');
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/nlp-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), location1, location2 })
      });

      if (!response.ok) {
        throw new Error('NLP processing failed');
      }

      const data = await response.json();
      onSearch(query.trim(), data.searchParams);
      setQuery('');
      setIsOpen(false);
    } catch (error) {
      console.error('AI Search Error:', error);
      alert('AI search failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleQueries = [
    "Find a quiet coffee shop for studying",
    "Somewhere romantic for dinner",
    "Kid-friendly restaurant with playground",
    "Business meeting spot with WiFi",
    "Casual lunch place with outdoor seating"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary"
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          width: '60px',
          height: '60px',
          borderRadius: 'var(--radius-full)',
          fontSize: 'var(--font-size-xl)',
          zIndex: 1000,
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        🤖
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 'var(--space-6)',
      right: 'var(--space-6)',
      width: '400px',
      maxWidth: 'calc(100vw - var(--space-12))',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      zIndex: 1000,
      fontFamily: 'var(--font-family)'
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-4) var(--space-6)',
        borderBottom: '1px solid var(--border-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: 'var(--accent-primary)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--bg-primary)'
          }}>
            🤖
          </div>
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            margin: 0,
            color: 'var(--text-primary)'
          }}>
            AI Search
          </h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 'var(--font-size-lg)',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 'var(--space-1)',
            borderRadius: 'var(--radius-sm)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'var(--bg-accent)';
            e.target.style.color = 'var(--text-primary)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = 'var(--text-muted)';
          }}
        >
          ✕
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)'
          }}>
            Describe what you're looking for:
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., 'quiet coffee shop for studying'"
            className="input"
            disabled={isProcessing}
            style={{
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--space-3) var(--space-4)'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!query.trim() || isProcessing}
          className="btn btn-primary"
          style={{
            width: '100%',
            fontSize: 'var(--font-size-sm)',
            padding: 'var(--space-3) var(--space-4)'
          }}
        >
          {isProcessing ? (
            <>
              <span style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid currentColor',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: 'var(--space-2)'
              }} />
              Processing...
            </>
          ) : (
            '🔍 Search with AI'
          )}
        </button>
      </form>

      {/* Examples */}
      <div style={{
        padding: '0 var(--space-6) var(--space-6)',
        borderTop: '1px solid var(--border-light)',
        marginTop: 'var(--space-4)',
        paddingTop: 'var(--space-4)'
      }}>
        <p style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-3)',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Try these examples:
        </p>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)'
        }}>
          {exampleQueries.slice(0, 3).map((example, index) => (
            <button
              key={index}
              onClick={() => setQuery(example)}
              style={{
                background: 'none',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-2) var(--space-3)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'var(--bg-accent)';
                e.target.style.borderColor = 'var(--accent-primary)';
                e.target.style.color = 'var(--text-primary)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'none';
                e.target.style.borderColor = 'var(--border-light)';
                e.target.style.color = 'var(--text-secondary)';
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}