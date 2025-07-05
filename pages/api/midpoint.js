// pages/api/midpoint.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { location1, location2 } = req.body;

  if (!location1 || !location2) {
    return res.status(400).json({ error: 'Missing locations' });
  }

  const midpoint = {
    lat: (location1.lat + location2.lat) / 2,
    lng: (location1.lng + location2.lng) / 2,
  };

  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  const radius = 15000; // 15 km

  const typesAndKeywords = [
    { type: 'cafe', keyword: 'coffee' },
    { type: 'restaurant', keyword: 'dining' },
    { type: 'park', keyword: 'green' },
    { type: 'shopping_mall', keyword: 'mall' },
    { type: 'hotel', keyword: 'hotel' },
  ];

  let allPlaces = [];

  try {
    for (const { type, keyword } of typesAndKeywords) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${midpoint.lat},${midpoint.lng}&radius=${radius}&type=${type}&keyword=${keyword}&key=${API_KEY}`;

      console.log(`🌐 Fetching ${type}s...`);
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK') {
        const filteredPlaces = data.results.filter((place) =>
          place.types.includes(type) &&
          (place.rating ?? 0) >= 3.5 &&
          (place.user_ratings_total ?? 0) > 30 &&
          !/dhaba|store|car|garage|automobile|repair|laundry/i.test(place.name)
        );

        const places = filteredPlaces.map((place) => ({
          name: place.name,
          address: place.vicinity,
          location: {
            lat: typeof place.geometry.location.lat === 'function' 
              ? place.geometry.location.lat() 
              : place.geometry.location.lat,
            lng: typeof place.geometry.location.lng === 'function' 
              ? place.geometry.location.lng() 
            : place.geometry.location.lng,
          },
          rating: place.rating,
          types: place.types,
          userRatings: place.user_ratings_total,
          sourceType: type,  
        }));


        allPlaces = allPlaces.concat(places);
      } else {
        console.warn(`⚠️ No results for ${type} - ${data.status}`);
      }
    }

    // Remove duplicates by name + address
    /*const uniquePlaces = Array.from(
      new Map(allPlaces.map((p) => [`${p.name}-${p.address}`, p])).values()
    );
*/  // Normalize name for grouping (e.g., "Third Wave Coffee - Indiranagar" → "thirdwavecoffee")
const brandLimits = {};
const maxPerBrand = 2;

function getBrandKey(name) {
  const lowered = name.toLowerCase();
  if (lowered.includes("third wave")) return "third wave coffee";
  if (lowered.includes("starbucks")) return "starbucks";
  if (lowered.includes("chai point")) return "chai point";
  // Add more known chains as needed
  return name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20); // fallback normalized
}

const uniquePlaces = [];

for (const place of allPlaces) {
  const brand = getBrandKey(place.name);
  brandLimits[brand] = (brandLimits[brand] || 0) + 1;

  if (brandLimits[brand] <= maxPerBrand) {
    uniquePlaces.push(place);
  }
}


    // Sort by rating descending
    uniquePlaces.sort((a, b) => b.rating - a.rating);
    console.log("✅ Final places returned:", uniquePlaces);
    return res.status(200).json({ midpoint, places: uniquePlaces });
  } catch (error) {
    console.error("❌ Internal Error:", error.message);
    return res.status(500).json({ error: 'Failed to fetch nearby places' });
  }
}
