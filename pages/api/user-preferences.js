// pages/api/user-preferences.js
// AI-powered user preference learning system

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get user preferences
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    try {
      // In a real app, this would fetch from a database
      // For now, we'll use localStorage simulation
      const defaultPreferences = {
        favoriteTypes: [],
        avoidTypes: [],
        minRating: 3.5,
        maxDistance: 20,
        preferences: {
          quiet: false,
          romantic: false,
          familyFriendly: false,
          business: false,
          budget: 'medium'
        },
        learningData: {
          totalSearches: 0,
          selectedPlaces: [],
          rejectedPlaces: [],
          patterns: {}
        }
      };

      return res.status(200).json(defaultPreferences);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch preferences' });
    }
  }

  if (req.method === 'POST') {
    // Update user preferences based on behavior
    const { userId, action, place, context } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'User ID and action are required' });
    }

    try {
      // AI learning algorithm
      const updatedPreferences = await learnFromUserBehavior(userId, action, place, context);
      
      return res.status(200).json({
        success: true,
        updatedPreferences,
        insights: generateLearningInsights(updatedPreferences)
      });
    } catch (error) {
      console.error('❌ Preference Learning Error:', error);
      return res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// AI learning algorithm for user preferences
async function learnFromUserBehavior(userId, action, place, context) {
  // Simulate learning from user behavior
  const learningInsights = {
    // Positive reinforcement for selected places
    if (action === 'selected') {
      // Learn from place type
      if (place.sourceType) {
        // Increase preference for this type
        console.log(`📈 Learning: User likes ${place.sourceType} places`);
      }
      
      // Learn from rating preferences
      if (place.rating > 4.0) {
        console.log(`⭐ Learning: User prefers high-rated places`);
      }
      
      // Learn from context
      if (context?.occasion) {
        console.log(`🎯 Learning: User likes ${context.occasion} occasions`);
      }
    }
    
    // Negative reinforcement for rejected places
    if (action === 'rejected') {
      if (place.sourceType) {
        console.log(`📉 Learning: User avoids ${place.sourceType} places`);
      }
    }
  };

  return {
    learned: true,
    insights: learningInsights,
    recommendations: generatePersonalizedRecommendations(place, context)
  };
}

// Generate personalized recommendations based on learned preferences
function generatePersonalizedRecommendations(place, context) {
  const recommendations = [];
  
  if (place.sourceType === 'cafe') {
    recommendations.push('Try similar coffee shops in the area');
    recommendations.push('Look for places with good WiFi and quiet atmosphere');
  }
  
  if (place.sourceType === 'restaurant') {
    recommendations.push('Consider restaurants with similar cuisine');
    recommendations.push('Look for places with good ratings and reviews');
  }
  
  if (context?.occasion === 'business') {
    recommendations.push('Professional meeting spots with quiet atmosphere');
    recommendations.push('Places with good accessibility and parking');
  }
  
  return recommendations;
}

// Generate insights from learning data
function generateLearningInsights(preferences) {
  const insights = [];
  
  if (preferences.learningData.totalSearches > 5) {
    insights.push('🤖 I\'m learning your preferences to give you better recommendations!');
  }
  
  if (preferences.learningData.selectedPlaces.length > 0) {
    const mostSelectedType = preferences.learningData.selectedPlaces
      .reduce((acc, place) => {
        acc[place.sourceType] = (acc[place.sourceType] || 0) + 1;
        return acc;
      }, {});
    
    const topType = Object.keys(mostSelectedType).reduce((a, b) => 
      mostSelectedType[a] > mostSelectedType[b] ? a : b
    );
    
    insights.push(`📊 I notice you prefer ${topType} places. I'll prioritize similar options!`);
  }
  
  return insights;
}
