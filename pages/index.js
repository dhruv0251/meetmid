import { useState } from 'react';
import dynamic from 'next/dynamic';
import LocationInputBox from '../components/LocationInputBox';
import { useRouter } from 'next/router'; // ⬅️ Add this with your imports
import Image from 'next/image'; 

// In your pages/index.js or wherever your main component is
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    // Paste the debugging code here
    console.log('Environment check:', {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      keyLength: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length,
      keyStart: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10)
    });
  }, []);

  return (
    <div>
      {/* Your existing JSX */}
    </div>
  );
}

const GoogleMapPicker = dynamic(() => import('../components/GoogleMapPicker'), { ssr: false });

export default function Home() {
  const [location1, setLocation1] = useState(null);
  const [location2, setLocation2] = useState(null);
  const [showMap1, setShowMap1] = useState(false);
  const [showMap2, setShowMap2] = useState(false);
  const [loading, setLoading] = useState(false);

  
const router = useRouter(); // ⬅️ Inside your component, before handleSubmit

const handleSubmit = async () => {
  if (!location1 || !location2) {
    alert("Please select both locations.");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch('/api/midpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location1, location2 }),
    });

    const data = await response.json();

    if (!response.ok) throw new Error("Midpoint API failed");

    // ✅ Include both locations in sessionStorage
    const sessionData = {
      ...data,
      location1,
      location2
    };

    sessionStorage.setItem("meetmid-results", JSON.stringify(sessionData));

    // ✅ Navigate to results page
    router.push("/results");

  } catch (err) {
    console.error("❌ Backend error:", err);
    alert("Something went wrong.");
  } finally {
    setLoading(false);
  }
};



  return (
    <main style={mainStyle}>
      <div style={cardStyle}>

        {/* 🖼 Logo Section */}
        <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "0.5rem",
    marginBottom: "1rem"
  }}
>
  <Image
    src="/meetmid-logo.png" // <-- your uploaded logo file
    alt="Meet Mid Logo"
    width={300}
    height={300}
  />
  <div style={styles.descriptionBox}>
  <h2 style={styles.title}>Where Should We Meet? Got Easier!</h2>
  <p style={styles.text}><strong>Two people, Two locations, One perfect spot!</strong></p>
  </div>

</div>



        <LocationInputBox
          label="Your Location:"
          onLocationSelect={setLocation1}
          showMap={showMap1}
          setShowMap={setShowMap1}
        />
        {showMap1 && <GoogleMapPicker onSelect={setLocation1} />}

        <LocationInputBox
          label="Friend's Location:"
          onLocationSelect={setLocation2}
          showMap={showMap2}
          setShowMap={setShowMap2}
        />
        {showMap2 && <GoogleMapPicker onSelect={setLocation2} />}

        <button onClick={handleSubmit} disabled={loading} style={buttonStyle}>
          {loading ? "Finding..." : "Find Midpoint"}
        </button>
      </div>
    </main>
  );
}

// 💅 Styles
const mainStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  fontFamily: 'Segoe UI, sans-serif',
  background: 'linear-gradient(to right, #e0eafc, #cfdef3)',
  padding: '2rem'
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '2rem 3rem',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  textAlign: 'center',
  maxWidth: '500px',
  width: '100%'
};

const buttonStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  backgroundColor: '#fcee09', // Bright yellow (classic brutalist color)
  color: '#000',
  border: '3px solid #000',
  borderRadius: '4px',
  fontWeight: '900',
  fontSize: '1rem',
  fontFamily: '"Courier New", Courier, monospace', // or a strong monospace
  textTransform: 'uppercase',
  cursor: 'pointer',
  width: '100%',
  boxShadow: '4px 4px 0px #000', // strong block shadow
  transition: 'none'

};

const styles = {
  descriptionBox: {
    border: "3px solid black",
    padding: "1.5rem",
    marginBottom: "2rem",
    backgroundColor: "#fff",
    boxShadow: "6px 6px 0px black",
    fontFamily: "'Courier New', monospace"
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: "1rem",
    color: "#000"
  },
  text: {
    fontSize: "1rem",
    lineHeight: "1.6",
    color: "#111",
    marginBottom: "0.5rem"
  },
  list: {
    listStyleType: "none",
    paddingLeft: "0",
    marginTop: "1rem",
    marginBottom: "1rem",
    fontWeight: "bold",
    color: "#000"
  }
};
