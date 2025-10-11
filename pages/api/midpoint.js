// pages/api/midpoint.js

// Helper function to convert degrees to radians
const toRadians = (degrees) => degrees * (Math.PI / 180);

// Helper function to convert radians to degrees
const toDegrees = (radians) => radians * (180 / Math.PI);

// Calculate haversine distance between two points
const calculateDistance = (loc1, loc2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(loc2.lat - loc1.lat);
  const dLng = toRadians(loc2.lng - loc1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(loc1.lat)) * Math.cos(toRadians(loc2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// AI-powered recommendation enhancement
const applyAIRecommendations = async (places, location1, location2, nlpParams = null) => {
  try {
    const currentHour = new Date().getHours();
    const context = {
      timeOfDay: nlpParams?.timeContext || (currentHour < 12 ? 'morning' : currentHour < 18 ? 'afternoon' : 'evening'),
      weather: 'sunny', // Could integrate with weather API
      occasion: nlpParams?.occasion || 'casual',
      atmosphere: nlpParams?.atmosphere || [],
      features: nlpParams?.features || [],
      budget: nlpParams?.budget || 'medium'
    };

    return places.map(place => {
      let aiScore = 0;
      const aiReasons = [];

      // Time-based AI scoring
      if (context.timeOfDay === 'morning' && place.sourceType === 'cafe') {
        aiScore += 20;
        aiReasons.push('☀️ Perfect for morning coffee');
      }
      if (context.timeOfDay === 'evening' && place.sourceType === 'restaurant') {
        aiScore += 20;
        aiReasons.push('🌙 Great for evening dining');
      }

      // Quality-based AI scoring
      if (place.rating >= 4.5) {
        aiScore += 15;
        aiReasons.push('🌟 Highly rated');
      }
      if (place.userRatings > 100) {
        aiScore += 10;
        aiReasons.push('👥 Popular choice');
      }

      // Fairness-based AI scoring
      if (place.distanceScore && place.distanceScore.distanceDifference < 2) {
        aiScore += 25;
        aiReasons.push('⚖️ Very fair for both users');
      }

      // Context-aware AI scoring
      if (place.sourceType === 'cafe' && context.timeOfDay === 'morning') {
        aiScore += 15;
        aiReasons.push('☕ Morning coffee spot');
      }

      // NLP-specific scoring
      if (nlpParams) {
        // Atmosphere matching
        if (context.atmosphere.includes('quiet') && place.sourceType === 'cafe') {
          aiScore += 25;
          aiReasons.push('🔇 Quiet atmosphere perfect for studying');
        }
        if (context.atmosphere.includes('romantic') && place.sourceType === 'restaurant' && place.rating >= 4.0) {
          aiScore += 30;
          aiReasons.push('💕 Romantic setting for special occasions');
        }
        if (context.atmosphere.includes('formal') && place.sourceType === 'restaurant') {
          aiScore += 20;
          aiReasons.push('💼 Professional business meeting spot');
        }

        // Feature matching
        if (context.features.includes('wifi') && place.sourceType === 'cafe') {
          aiScore += 20;
          aiReasons.push('📶 Great for work with WiFi');
        }
        if (context.features.includes('kid-friendly') && (place.sourceType === 'park' || place.sourceType === 'shopping_mall')) {
          aiScore += 25;
          aiReasons.push('👨‍👩‍👧‍👦 Family-friendly with activities for kids');
        }
        if (context.features.includes('outdoor') && place.sourceType === 'park') {
          aiScore += 20;
          aiReasons.push('🌳 Perfect outdoor setting');
        }

        // Occasion matching
        if (context.occasion === 'family' && (place.sourceType === 'park' || place.sourceType === 'shopping_mall')) {
          aiScore += 25;
          aiReasons.push('👨‍👩‍👧‍👦 Great for family gatherings');
        }
        if (context.occasion === 'business' && place.sourceType === 'cafe') {
          aiScore += 20;
          aiReasons.push('💼 Professional meeting environment');
        }
        if (context.occasion === 'romantic' && place.sourceType === 'restaurant' && place.rating >= 4.0) {
          aiScore += 30;
          aiReasons.push('💕 Perfect for romantic dinners');
        }

        // Budget matching
        if (context.budget === 'low' && place.rating < 4.0) {
          aiScore += 15;
          aiReasons.push('💰 Budget-friendly option');
        }
        if (context.budget === 'high' && place.rating >= 4.5) {
          aiScore += 20;
          aiReasons.push('💎 Premium quality experience');
        }
      }

      return {
        ...place,
        aiScore: Math.max(0, aiScore),
        aiReasons: aiReasons.slice(0, 3),
        aiEnhanced: true
      };
    }).sort((a, b) => b.aiScore - a.aiScore);

  } catch (error) {
    console.error('❌ AI Enhancement Error:', error);
    return places; // Return original places if AI fails
  }
};

// Filter places based on distance constraints to ensure fairness
const filterPlacesByDistance = (places, location1, location2, maxDistanceRatio = 2.0) => {
  // Calculate the distance between the two users
  const userDistance = calculateDistance(location1, location2);
  
  // Set maximum allowed distance from either user (2.0x the distance between users)
  const maxDistanceFromUser = userDistance * maxDistanceRatio;
  
    console.log(`📏 User distance: ${userDistance.toFixed(2)}km, Max distance from user: ${maxDistanceFromUser.toFixed(2)}km`);
    console.log(`🔍 Filtering places - User1: ${location1.lat},${location1.lng}, User2: ${location2.lat},${location2.lng}`);
  
  return places.filter(place => {
    const distanceFromUser1 = calculateDistance(location1, place.location);
    const distanceFromUser2 = calculateDistance(location2, place.location);
    
    // Place must be within reasonable distance from BOTH users
    const isWithinRange = distanceFromUser1 <= maxDistanceFromUser && distanceFromUser2 <= maxDistanceFromUser;
    
    if (!isWithinRange) {
      console.log(`❌ Filtered out ${place.name}: ${distanceFromUser1.toFixed(2)}km from user1, ${distanceFromUser2.toFixed(2)}km from user2`);
    }
    
    return isWithinRange;
  });
};

// Calculate balanced distance score for ranking places
const calculateBalancedDistanceScore = (place, location1, location2) => {
  const distanceFromUser1 = calculateDistance(location1, place.location);
  const distanceFromUser2 = calculateDistance(location2, place.location);
  
  // Calculate the difference in distances (lower is better)
  const distanceDifference = Math.abs(distanceFromUser1 - distanceFromUser2);
  
  // Calculate total distance (lower is better)
  const totalDistance = distanceFromUser1 + distanceFromUser2;
  
  // Balanced score: prioritize places with similar distances to both users
  // and lower total distance
  const balancedScore = distanceDifference + (totalDistance * 0.1);
  
  console.log(`📍 ${place.name}: User1=${distanceFromUser1.toFixed(2)}km, User2=${distanceFromUser2.toFixed(2)}km, Diff=${distanceDifference.toFixed(2)}km`);
  
  return {
    distanceFromUser1: distanceFromUser1,
    distanceFromUser2: distanceFromUser2,
    distanceDifference: distanceDifference,
    totalDistance: totalDistance,
    balancedScore: balancedScore
  };
};

// Calculate distance-based weighted midpoint as fallback
const calculateDistanceWeightedMidpoint = (location1, location2) => {
  // Calculate haversine distance between the two points
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(location2.lat - location1.lat);
  const dLng = toRadians(location2.lng - location1.lng);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(location1.lat)) * Math.cos(toRadians(location2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  // Use inverse distance as weight (closer points get higher weight)
  const weight1 = 1 / (distance + 0.1); // Add small constant to avoid division by zero
  const weight2 = 1 / (distance + 0.1);
  
  console.log(`📏 Distance: ${distance.toFixed(2)}km, Weights: ${weight1.toFixed(4)}, ${weight2.toFixed(4)}`);
  
  // Calculate weighted midpoint using Cartesian coordinates
  let x = 0, y = 0, z = 0;
  let totalWeight = 0;
  
  const locations = [
    { lat: location1.lat, lng: location1.lng, weight: weight1 },
    { lat: location2.lat, lng: location2.lng, weight: weight2 }
  ];
  
  locations.forEach(location => {
    const latRad = toRadians(location.lat);
    const lngRad = toRadians(location.lng);
    const weight = location.weight;
    
    x += Math.cos(latRad) * Math.cos(lngRad) * weight;
    y += Math.cos(latRad) * Math.sin(lngRad) * weight;
    z += Math.sin(latRad) * weight;
    totalWeight += weight;
  });
  
  x /= totalWeight;
  y /= totalWeight;
  z /= totalWeight;
  
  const centralLng = Math.atan2(y, x);
  const centralLat = Math.atan2(z, Math.sqrt(x * x + y * y));
  
  return {
    lat: toDegrees(centralLat),
    lng: toDegrees(centralLng)
  };
};

// Calculate weighted midpoint using travel time as weights
// Calculate true geographic midpoint (not weighted)
const calculateTrueGeographicMidpoint = (location1, location2) => {
  // Convert latitude and longitude to radians
  const lat1 = toRadians(location1.lat);
  const lng1 = toRadians(location1.lng);
  const lat2 = toRadians(location2.lat);
  const lng2 = toRadians(location2.lng);

  // Convert to Cartesian coordinates
  const x1 = Math.cos(lat1) * Math.cos(lng1);
  const y1 = Math.cos(lat1) * Math.sin(lng1);
  const z1 = Math.sin(lat1);

  const x2 = Math.cos(lat2) * Math.cos(lng2);
  const y2 = Math.cos(lat2) * Math.sin(lng2);
  const z2 = Math.sin(lat2);

  // Average the points
  const x = (x1 + x2) / 2;
  const y = (y1 + y2) / 2;
  const z = (z1 + z2) / 2;

  // Convert back to latitude and longitude
  const lng = Math.atan2(y, x);
  const hyp = Math.sqrt(x * x + y * y);
  const lat = Math.atan2(z, hyp);

  return {
    lat: toDegrees(lat),
    lng: toDegrees(lng)
  };
};

// Use true geographic midpoint for fairness
const calculateWeightedMidpoint = async (location1, location2, apiKey) => {
  return calculateTrueGeographicMidpoint(location1, location2);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }


  const { location1, location2, nlpQuery } = req.body;
  if (!location1 || !location2) {
    return res.status(400).json({ error: 'Missing locations' });
  }
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  // Defensive: ensure both locations are not the same
  if (location1.lat === location2.lat && location1.lng === location2.lng) {
    return res.status(400).json({ error: 'Locations must be different' });
  }

  // Process NLP query if provided
  let nlpParams = null;
  if (nlpQuery) {
    try {
      const nlpResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/nlp-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: nlpQuery, location1, location2 })
      });
      const nlpData = await nlpResponse.json();
      nlpParams = nlpData.searchParams;
      console.log('🤖 NLP Query processed:', nlpData.parsedQuery);
    } catch (error) {
      console.warn('⚠️ NLP processing failed, using default search:', error);
    }
  }

  // Calculate weighted midpoint based on travel time
  // Fallback to simple midpoint if API fails
  let midpoint = null;
  try {
    midpoint = await calculateWeightedMidpoint(location1, location2, API_KEY);
    if (!midpoint || isNaN(midpoint.lat) || isNaN(midpoint.lng)) {
      throw new Error('Invalid midpoint');
    }
  } catch (e) {
    // fallback to simple average
    midpoint = {
      lat: (location1.lat + location2.lat) / 2,
      lng: (location1.lng + location2.lng) / 2
    };
    console.warn('⚠️ Fallback to simple midpoint:', midpoint);
  }

  const radius = 15000; // 15 km

  // Dynamic place types based on NLP query
  let typesAndKeywords = [
    { type: 'cafe', keyword: 'coffee' },
    { type: 'restaurant', keyword: 'dining' },
    { type: 'park', keyword: 'green' },
    { type: 'shopping_mall', keyword: 'mall' },
    { type: 'hotel', keyword: 'hotel' },
  ];
  // Filter place types based on NLP query
  if (nlpParams && nlpParams.placeTypes.length > 0) {
    typesAndKeywords = typesAndKeywords.filter(item => 
      nlpParams.placeTypes.includes(item.type)
    );
    console.log('🎯 Filtered place types based on NLP:', typesAndKeywords.map(t => t.type));
  }

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

        // Fetch extra details (photos, reviews, menu) for each place
        const places = await Promise.all(filteredPlaces.map(async (place) => {
          let photoUrl = null;
          if (place.photos && place.photos.length > 0) {
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${API_KEY}`;
          }

          // Fetch place details for reviews and menu
          let reviews = [];
          let menuUrl = null;
          try {
            const detailsRes = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=reviews,website,url,photos,editorial_summary,menu&key=${API_KEY}`);
            const detailsData = await detailsRes.json();
            if (detailsData.status === 'OK' && detailsData.result) {
              reviews = detailsData.result.reviews || [];
              if (detailsData.result.menu) menuUrl = detailsData.result.menu;
            }
          } catch (e) {}

          return {
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
            photoUrl,
            reviews,
            menuUrl,
            placeId: place.place_id
          };
        }));

        allPlaces = allPlaces.concat(places);
      } else {
        console.warn(`⚠️ No results for ${type} - ${data.status}`);
      }
    }

    // Apply distance constraints to ensure fairness
    console.log(`🔍 Filtering ${allPlaces.length} places by distance constraints...`);
    allPlaces = filterPlacesByDistance(allPlaces, location1, location2);
    console.log(`✅ ${allPlaces.length} places remain after distance filtering`);

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


    // Add distance scores to each place
    const placesWithScores = uniquePlaces.map(place => {
      const distanceScore = calculateBalancedDistanceScore(place, location1, location2);
      return {
        ...place,
        distanceScore: distanceScore
      };
    });

    // Sort by balanced distance score (lower is better), then by rating
    placesWithScores.sort((a, b) => {
      // First priority: balanced distance score
      if (Math.abs(a.distanceScore.balancedScore - b.distanceScore.balancedScore) > 0.1) {
        return a.distanceScore.balancedScore - b.distanceScore.balancedScore;
      }
      // Second priority: rating
      return b.rating - a.rating;
    });

    const finalPlaces = placesWithScores;
    
    // Apply AI-powered recommendations with NLP context
    console.log("🤖 Applying AI recommendations...");
    const aiEnhancedPlaces = await applyAIRecommendations(finalPlaces, location1, location2, nlpParams);
    
    console.log("✅ Final places returned:", aiEnhancedPlaces);
    return res.status(200).json({ 
      midpoint, 
      places: aiEnhancedPlaces,
      aiEnabled: true
    });
  } catch (error) {
    console.error("❌ Internal Error:", error.message);
    return res.status(500).json({ error: 'Failed to fetch nearby places' });
  }
}
