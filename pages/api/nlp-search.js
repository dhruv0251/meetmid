// pages/api/nlp-search.js
// Natural Language Processing for meeting spot search

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { query, location1, location2 } = req.body;

  if (!query || !location1 || !location2) {
    return res.status(400).json({ error: 'Query and locations are required' });
  }

  try {
    // Parse the natural language query
    const parsedQuery = parseNaturalLanguageQuery(query);
    
    // Generate enhanced search parameters
    const searchParams = generateSearchParameters(parsedQuery, location1, location2);
    
    // Return the enhanced search configuration
    return res.status(200).json({
      success: true,
      originalQuery: query,
      parsedQuery,
      searchParams,
      suggestions: generateSuggestions(parsedQuery)
    });

  } catch (error) {
    console.error('❌ NLP Search Error:', error);
    return res.status(500).json({ error: 'Failed to process natural language query' });
  }
}

// Parse natural language queries into structured data
function parseNaturalLanguageQuery(query) {
  const lowerQuery = query.toLowerCase();
  
  // Initialize parsed result
  const parsed = {
    intent: 'general',
    placeType: 'any',
    atmosphere: [],
    features: [],
    occasion: 'casual',
    timeContext: 'any',
    accessibility: [],
    budget: 'medium',
    keywords: []
  };

  // Intent recognition
  if (lowerQuery.includes('find') || lowerQuery.includes('search') || lowerQuery.includes('looking for')) {
    parsed.intent = 'search';
  }
  if (lowerQuery.includes('recommend') || lowerQuery.includes('suggest')) {
    parsed.intent = 'recommendation';
  }

  // Place type detection
  if (lowerQuery.includes('coffee') || lowerQuery.includes('cafe') || lowerQuery.includes('coffee shop')) {
    parsed.placeType = 'cafe';
    parsed.keywords.push('coffee', 'cafe');
  }
  if (lowerQuery.includes('restaurant') || lowerQuery.includes('dining') || lowerQuery.includes('dinner') || lowerQuery.includes('lunch')) {
    parsed.placeType = 'restaurant';
    parsed.keywords.push('restaurant', 'dining');
  }
  if (lowerQuery.includes('park') || lowerQuery.includes('outdoor') || lowerQuery.includes('garden')) {
    parsed.placeType = 'park';
    parsed.keywords.push('park', 'outdoor');
  }
  if (lowerQuery.includes('mall') || lowerQuery.includes('shopping')) {
    parsed.placeType = 'shopping_mall';
    parsed.keywords.push('shopping', 'mall');
  }

  // Atmosphere detection
  if (lowerQuery.includes('quiet') || lowerQuery.includes('peaceful') || lowerQuery.includes('calm')) {
    parsed.atmosphere.push('quiet');
  }
  if (lowerQuery.includes('romantic') || lowerQuery.includes('intimate') || lowerQuery.includes('cozy')) {
    parsed.atmosphere.push('romantic');
    parsed.occasion = 'romantic';
  }
  if (lowerQuery.includes('lively') || lowerQuery.includes('energetic') || lowerQuery.includes('vibrant')) {
    parsed.atmosphere.push('lively');
  }
  if (lowerQuery.includes('casual') || lowerQuery.includes('relaxed')) {
    parsed.atmosphere.push('casual');
  }
  if (lowerQuery.includes('formal') || lowerQuery.includes('professional') || lowerQuery.includes('business')) {
    parsed.atmosphere.push('formal');
    parsed.occasion = 'business';
  }

  // Features detection
  if (lowerQuery.includes('wifi') || lowerQuery.includes('internet') || lowerQuery.includes('studying')) {
    parsed.features.push('wifi');
    parsed.occasion = 'work';
  }
  if (lowerQuery.includes('playground') || lowerQuery.includes('kid') || lowerQuery.includes('family') || lowerQuery.includes('children')) {
    parsed.features.push('kid-friendly');
    parsed.occasion = 'family';
  }
  if (lowerQuery.includes('parking')) {
    parsed.features.push('parking');
  }
  if (lowerQuery.includes('outdoor') || lowerQuery.includes('patio') || lowerQuery.includes('terrace')) {
    parsed.features.push('outdoor');
  }
  if (lowerQuery.includes('bar') || lowerQuery.includes('alcohol') || lowerQuery.includes('drinks')) {
    parsed.features.push('bar');
  }

  // Time context detection
  if (lowerQuery.includes('morning') || lowerQuery.includes('breakfast') || lowerQuery.includes('coffee')) {
    parsed.timeContext = 'morning';
  }
  if (lowerQuery.includes('afternoon') || lowerQuery.includes('lunch')) {
    parsed.timeContext = 'afternoon';
  }
  if (lowerQuery.includes('evening') || lowerQuery.includes('dinner') || lowerQuery.includes('night')) {
    parsed.timeContext = 'evening';
  }

  // Accessibility detection
  if (lowerQuery.includes('wheelchair') || lowerQuery.includes('accessible')) {
    parsed.accessibility.push('wheelchair-accessible');
  }
  if (lowerQuery.includes('stroller') || lowerQuery.includes('family')) {
    parsed.accessibility.push('family-friendly');
  }

  // Budget detection
  if (lowerQuery.includes('cheap') || lowerQuery.includes('budget') || lowerQuery.includes('affordable')) {
    parsed.budget = 'low';
  }
  if (lowerQuery.includes('expensive') || lowerQuery.includes('luxury') || lowerQuery.includes('upscale')) {
    parsed.budget = 'high';
  }

  return parsed;
}

// Generate search parameters based on parsed query
function generateSearchParameters(parsedQuery, location1, location2) {
  const searchParams = {
    placeTypes: [],
    keywords: [],
    minRating: 3.5,
    maxDistance: 20,
    timeContext: parsedQuery.timeContext,
    occasion: parsedQuery.occasion,
    atmosphere: parsedQuery.atmosphere,
    features: parsedQuery.features,
    budget: parsedQuery.budget,
    aiScoring: {
      timeBonus: 0,
      atmosphereBonus: 0,
      featureBonus: 0,
      occasionBonus: 0
    }
  };

  // Set place types based on query
  if (parsedQuery.placeType !== 'any') {
    searchParams.placeTypes.push(parsedQuery.placeType);
  } else {
    // Default to common types if not specified
    searchParams.placeTypes = ['cafe', 'restaurant', 'park'];
  }

  // Add keywords for better search
  searchParams.keywords = parsedQuery.keywords;

  // Adjust rating requirements based on occasion
  if (parsedQuery.occasion === 'romantic' || parsedQuery.occasion === 'business') {
    searchParams.minRating = 4.0;
  }

  // Set AI scoring bonuses
  if (parsedQuery.timeContext === 'morning' && parsedQuery.placeType === 'cafe') {
    searchParams.aiScoring.timeBonus = 25;
  }
  if (parsedQuery.timeContext === 'evening' && parsedQuery.placeType === 'restaurant') {
    searchParams.aiScoring.timeBonus = 25;
  }
  if (parsedQuery.atmosphere.includes('romantic')) {
    searchParams.aiScoring.atmosphereBonus = 30;
  }
  if (parsedQuery.features.includes('wifi')) {
    searchParams.aiScoring.featureBonus = 20;
  }
  if (parsedQuery.occasion === 'family') {
    searchParams.aiScoring.occasionBonus = 25;
  }

  return searchParams;
}

// Generate helpful suggestions based on parsed query
function generateSuggestions(parsedQuery) {
  const suggestions = [];

  if (parsedQuery.placeType === 'cafe' && parsedQuery.atmosphere.includes('quiet')) {
    suggestions.push('☕ Perfect for studying or work meetings');
    suggestions.push('🔇 Quiet atmosphere with good WiFi');
  }

  if (parsedQuery.occasion === 'romantic') {
    suggestions.push('💕 Romantic restaurants with intimate settings');
    suggestions.push('🌹 Highly-rated places for special occasions');
  }

  if (parsedQuery.features.includes('kid-friendly')) {
    suggestions.push('👨‍👩‍👧‍👦 Family-friendly restaurants and parks');
    suggestions.push('🎠 Places with playgrounds and kid activities');
  }

  if (parsedQuery.occasion === 'business') {
    suggestions.push('💼 Professional meeting spots');
    suggestions.push('📊 Quiet places with good WiFi and accessibility');
  }

  if (parsedQuery.timeContext === 'morning') {
    suggestions.push('☀️ Morning coffee spots and breakfast places');
  }

  if (parsedQuery.timeContext === 'evening') {
    suggestions.push('🌙 Evening dining and entertainment options');
  }

  return suggestions;
}
