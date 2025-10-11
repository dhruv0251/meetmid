import { useState } from 'react';
import Head from 'next/head';
import LocationInputBox from '../components/LocationInputBox';
import AIChat from '../components/AIChat';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';
import ThemeToggle from '../components/ThemeToggle';
import { useRouter } from 'next/router';

function HomePage() {
  const [location1, setLocation1] = useState(null);
  const [location2, setLocation2] = useState(null);
  const [showMap1, setShowMap1] = useState(false);
  const [showMap2, setShowMap2] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  const handleSubmit = async () => {
    if (!location1 || !location2) {
      alert("Please select both locations.");
      return;
    }

    try {
      setLoading(true);

      // Get NLP query if available
      const nlpQuery = sessionStorage.getItem('meetmid-nlp-query');
      const nlpData = nlpQuery ? JSON.parse(nlpQuery) : null;

      console.log("🚀 Starting API call with:", { location1, location2, nlpQuery: nlpData?.query });
      
      const response = await fetch('/api/midpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          location1, 
          location2,
          nlpQuery: nlpData?.query || null
        }),
      });

      console.log("📡 API Response status:", response.status);
      const data = await response.json();
      console.log("📊 API Response data:", data);

      if (!response.ok) {
        console.error("❌ API Error:", data);
        throw new Error(`Midpoint API failed: ${data.error || 'Unknown error'}`);
      }

      // ✅ Include both locations in sessionStorage
      const sessionData = {
        ...data,
        location1,
        location2,
        nlpQuery: nlpData?.query || null
      };

      sessionStorage.setItem("meetmid-results", JSON.stringify(sessionData));
      sessionStorage.removeItem('meetmid-nlp-query'); // Clear after use

      router.push("/results");

    } catch (err) {
      console.error("❌ Backend error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>MeetMid - AI-Powered Meeting Spot Finder</title>
        <meta name="description" content="Find the perfect meeting spot between two locations using AI-powered recommendations" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </Head>
      
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        fontFamily: 'var(--font-family)',
        color: 'var(--text-primary)'
      }}>
        {/* Header */}
        <header style={{
          padding: 'var(--space-16) 0 var(--space-12)',
          textAlign: 'center'
        }}>
          <div className="container container-xs">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-6)'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)',
                color: 'var(--bg-primary)'
              }}>
                🤝
              </div>
              <h1 className="heading-1" style={{ margin: 0 }}>
                MeetMid
              </h1>
            </div>
            
            <p style={{
              fontSize: 'var(--font-size-lg)',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              marginBottom: 'var(--space-8)'
            }}>
              AI-powered meeting spot finder that considers travel time, preferences, and fairness for both people.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main>
          <div className="container container-xs">
            <div className="card" style={{
              padding: 'var(--space-12)',
              textAlign: 'center'
            }}>
              <h2 className="heading-3" style={{ marginBottom: 'var(--space-8)' }}>
                Select Your Locations
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                <LocationInputBox
                  label="Your Location"
                  onLocationSelect={setLocation1}
                  showMap={showMap1}
                  setShowMap={setShowMap1}
                />

                <LocationInputBox
                  label="Friend's Location"
                  onLocationSelect={setLocation2}
                  showMap={showMap2}
                  setShowMap={setShowMap2}
                />
              </div>

              <button 
                onClick={handleSubmit} 
                disabled={loading || !location1 || !location2}
                className="btn btn-primary btn-lg"
                style={{
                  marginTop: 'var(--space-8)',
                  width: '100%',
                  maxWidth: '400px'
                }}
              >
                {loading ? (
                  <>
                    <span style={{ 
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid currentColor',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Finding Perfect Spots...
                  </>
                ) : (
                  '🎯 Find Perfect Meeting Spots'
                )}
              </button>
            </div>
          </div>
        </main>

        {/* AI Chat */}
        <AIChat onSearch={(query, searchParams) => {
          console.log('AI Search:', query, searchParams);
          sessionStorage.setItem('meetmid-nlp-query', JSON.stringify({ query, searchParams }));

          if (location1 && location2) {
            // Show success toast
            const toast = document.createElement('div');
            toast.style.cssText = `
              position: fixed;
              top: var(--space-6);
              left: 50%;
              transform: translateX(-50%);
              background: var(--accent-primary);
              color: var(--bg-primary);
              padding: var(--space-4) var(--space-6);
              border-radius: var(--radius-md);
              box-shadow: var(--shadow-lg);
              z-index: 10000;
              font-weight: var(--font-weight-semibold);
              font-size: var(--font-size-sm);
            `;
            toast.textContent = `🤖 AI Search: "${query}" - Finding perfect spots...`;
            document.body.appendChild(toast);
            
            setTimeout(() => {
              document.body.removeChild(toast);
            }, 3000);
            
            handleSubmit();
          } else {
            alert(`🤖 AI Search: "${query}"\n\nPlease select both locations first, then I'll find the perfect meeting spots!`);
          }
        }} />
        
        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  );
}