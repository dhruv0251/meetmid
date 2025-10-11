// pages/api/ai-recommendations.js
// AI-powered recommendation engine for meeting spots

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests are allowed' });
  }

  const { places, userPreferences, context } = req.body;

  if (!places || !Array.isArray(places)) {
    return res.status(400).json({ error: 'Places array is required' });
  }

  try {
    // AI-powered scoring algorithm
    const enhancedPlaces = places.map(place => {
      let aiScore = 0;
      const reasons = [];

      // 1. Time-based recommendations
      const currentHour = new Date().getHours();
      if (context?.timeOfDay) {
        if (context.timeOfDay === 'morning' && place.sourceType === 'cafe') {
          aiScore += 20;
          reasons.push('☀️ Perfect for morning coffee');
        }
        if (context.timeOfDay === 'evening' && place.sourceType === 'restaurant') {
          aiScore += 20;
          reasons.push('🌙 Great for evening dining');
        }
      }

      // 2. Weather-based suggestions
      if (context?.weather) {
        if (context.weather === 'rainy' && place.sourceType !== 'park') {
          aiScore += 15;
          reasons.push('🌧️ Indoor option for rainy weather');
        }
        if (context.weather === 'sunny' && place.sourceType === 'park') {
          aiScore += 15;
          reasons.push('☀️ Great outdoor option');
        }
      }

      // 3. Occasion-based scoring
      if (context?.occasion) {
        switch (context.occasion) {
          case 'business':
            if (place.sourceType === 'cafe' || place.sourceType === 'restaurant') {
              aiScore += 25;
              reasons.push('💼 Professional meeting spot');
            }
            break;
          case 'romantic':
            if (place.sourceType === 'restaurant' && place.rating >= 4.0) {
              aiScore += 30;
              reasons.push('💕 Romantic atmosphere');
            }
            break;
          case 'family':
            if (place.sourceType === 'park' || place.sourceType === 'shopping_mall') {
              aiScore += 25;
              reasons.push('👨‍👩‍👧‍👦 Family-friendly location');
            }
            break;
          case 'casual':
            if (place.sourceType === 'cafe' || place.sourceType === 'park') {
              aiScore += 20;
              reasons.push('😊 Casual and relaxed');
            }
            break;
        }
      }

      // 4. User preference learning
      if (userPreferences) {
        if (userPreferences.favoriteTypes?.includes(place.sourceType)) {
          aiScore += 30;
          reasons.push('❤️ Matches your preferences');
        }
        if (userPreferences.avoidTypes?.includes(place.sourceType)) {
          aiScore -= 20;
          reasons.push('⚠️ Not your usual choice');
        }
        if (userPreferences.minRating && place.rating >= userPreferences.minRating) {
          aiScore += 15;
          reasons.push('⭐ Meets your quality standards');
        }
      }

      // 5. Smart distance optimization
      if (place.distanceScore) {
        const fairnessBonus = place.distanceScore.distanceDifference < 2 ? 20 : 
                             place.distanceScore.distanceDifference < 5 ? 10 : 0;
        aiScore += fairnessBonus;
        if (fairnessBonus > 0) {
          reasons.push('⚖️ Very fair for both users');
        }
      }

      // 6. Popularity and quality boost
      if (place.rating >= 4.5) {
        aiScore += 15;
        reasons.push('🌟 Highly rated');
      }
      if (place.userRatings > 100) {
        aiScore += 10;
        reasons.push('👥 Popular choice');
      }

      // 7. Time-sensitive factors
      if (context?.urgency === 'quick') {
        if (place.sourceType === 'cafe') {
          aiScore += 15;
          reasons.push('⚡ Quick and easy');
        }
      }

      return {
        ...place,
        aiScore: Math.max(0, aiScore), // Ensure non-negative score
        aiReasons: reasons.slice(0, 3), // Top 3 reasons
        enhanced: true
      };
    });

    // Sort by AI score (highest first)
    enhancedPlaces.sort((a, b) => b.aiScore - a.aiScore);

    // Add AI insights
    const aiInsights = generateAIInsights(enhancedPlaces, context);

    return res.status(200).json({
      places: enhancedPlaces,
      aiInsights,
      totalPlaces: enhancedPlaces.length,
      topRecommendation: enhancedPlaces[0] || null
    });

  } catch (error) {
    console.error('❌ AI Recommendation Error:', error);
    return res.status(500).json({ error: 'Failed to generate AI recommendations' });
  }
}

// Generate AI insights based on the recommendations
function generateAIInsights(places, context) {
  const insights = [];

  // Analyze the top recommendations
  const topPlaces = places.slice(0, 3);
  const placeTypes = topPlaces.map(p => p.sourceType);
  const avgRating = topPlaces.reduce((sum, p) => sum + (p.rating || 0), 0) / topPlaces.length;

  // Generate contextual insights
  if (context?.occasion) {
    switch (context.occasion) {
      case 'business':
        insights.push('💼 I found several professional meeting spots with good ratings and quiet atmospheres.');
        break;
      case 'romantic':
        insights.push('💕 Perfect romantic spots with excellent ratings and intimate settings.');
        break;
      case 'family':
        insights.push('👨‍👩‍👧‍👦 Great family-friendly options that are safe and fun for all ages.');
        break;
    }
  }

  // Time-based insights
  const currentHour = new Date().getHours();
  if (currentHour < 12) {
    insights.push('☀️ Morning recommendations: Coffee shops and breakfast spots are prioritized.');
  } else if (currentHour > 18) {
    insights.push('🌙 Evening suggestions: Restaurants and dinner spots are highlighted.');
  }

  // Quality insights
  if (avgRating > 4.0) {
    insights.push('⭐ High-quality recommendations with excellent ratings.');
  }

  // Diversity insights
  const uniqueTypes = [...new Set(placeTypes)];
  if (uniqueTypes.length > 1) {
    insights.push(`🎯 Diverse options: ${uniqueTypes.join(', ')} to suit different preferences.`);
  }

  return insights;
}
