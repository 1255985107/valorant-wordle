import axios from 'axios';

async function getSubjectDetails(subjectId) {
}

async function getCharacterDetails(characterId) {
}

async function getCharactersBySubjectId(subjectId) {
    
}

async function getRandomCharacter(gameSettings) {

}

function generateFeedback(guess, answerCharacter) {
  const result = {};

  result.gender = {
    guess: guess.gender,
    feedback: guess.gender === answerCharacter.gender ? 'yes' : 'no'
  };

  const popularityDiff = guess.popularity - answerCharacter.popularity;
  const fivePercent = answerCharacter.popularity * 0.05;
  const twentyPercent = answerCharacter.popularity * 0.2;
  let popularityFeedback;
  if (Math.abs(popularityDiff) <= fivePercent) {
    popularityFeedback = '=';
  } else if (popularityDiff > 0) {
    popularityFeedback = popularityDiff <= twentyPercent ? '+' : '++';
  } else {
    popularityFeedback = popularityDiff >= -twentyPercent ? '-' : '--';
  }
  result.popularity = {
    guess: guess.popularity,
    feedback: popularityFeedback
  };

  // Handle rating comparison
  const ratingDiff = guess.highestRating - answerCharacter.highestRating;
  const ratingFivePercent = answerCharacter.highestRating * 0.02;
  const ratingTwentyPercent = answerCharacter.highestRating * 0.1;
  let ratingFeedback;
  if (guess.highestRating === -1 || answerCharacter.highestRating === -1) {
    ratingFeedback = '?';
  } else if (Math.abs(ratingDiff) <= ratingFivePercent) {
    ratingFeedback = '=';
  } else if (ratingDiff > 0) {
    ratingFeedback = ratingDiff <= ratingTwentyPercent ? '+' : '++';
  } else {
    ratingFeedback = ratingDiff >= -ratingTwentyPercent ? '-' : '--';
  }
  result.rating = {
    guess: guess.highestRating,
    feedback: ratingFeedback
  };

  const sharedAppearances = guess.appearances.filter(appearance => answerCharacter.appearances.includes(appearance));
  result.shared_appearances = {
    first: sharedAppearances[0] || '',
    count: sharedAppearances.length
  };

  // Compare total number of appearances
  const appearanceDiff = guess.appearances.length - answerCharacter.appearances.length;
  const twentyPercentAppearances = answerCharacter.appearances.length * 0.2;
  let appearancesFeedback;
  if (appearanceDiff === 0) {
    appearancesFeedback = '=';
  } else if (appearanceDiff > 0) {
    appearancesFeedback = appearanceDiff <= twentyPercentAppearances ? '+' : '++';
  } else {
    appearancesFeedback = appearanceDiff >= -twentyPercentAppearances ? '-' : '--';
  }
  result.appearancesCount = {
    guess: guess.appearances.length,
    feedback: appearancesFeedback
  };

  // Advice from EST-NINE
  const answerMetaTagsSet = new Set(answerCharacter.metaTags);
  const sharedMetaTags = guess.metaTags.filter(tag => answerMetaTagsSet.has(tag));
  
  result.metaTags = {
    guess: guess.metaTags,
    shared: sharedMetaTags
  };

  if (guess.latestAppearance === -1 || answerCharacter.latestAppearance === -1) {
    result.latestAppearance = {
      guess: guess.latestAppearance === -1 ? '?' : guess.latestAppearance,
      feedback: guess.latestAppearance === -1 && answerCharacter.latestAppearance === -1 ? '=' : '?'
    };
  } else {
    const yearDiff = guess.latestAppearance - answerCharacter.latestAppearance;
    let yearFeedback;
    if (yearDiff === 0) {
      yearFeedback = '=';
    } else if (yearDiff > 0) {
      yearFeedback = yearDiff <= 2 ? '+' : '++';
    } else {
      yearFeedback = yearDiff >= -2 ? '-' : '--';
    }
    result.latestAppearance = {
      guess: guess.latestAppearance,
      feedback: yearFeedback
    };
  }

  if (guess.earliestAppearance === -1 || answerCharacter.earliestAppearance === -1) {
    result.earliestAppearance = {
      guess: guess.earliestAppearance,
      feedback: guess.earliestAppearance === -1 && answerCharacter.earliestAppearance === -1 ? '=' : '?'
    };
  } else {
    const yearDiff = guess.earliestAppearance - answerCharacter.earliestAppearance;
    let yearFeedback;
    if (yearDiff === 0) {
      yearFeedback = '=';
    } else if (yearDiff > 0) {
      yearFeedback = yearDiff <= 1 ? '+' : '++';
    } else {
      yearFeedback = yearDiff >= -1 ? '-' : '--';
    }
    result.earliestAppearance = {
      guess: guess.earliestAppearance,
      feedback: yearFeedback
    };
  }

  return result;
}

async function getIndexInfo(indexId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/v0/indices/${indexId}`);
    
    if (!response.data) {
      throw new Error('No index information found');
    }

    return {
      title: response.data.title,
      total: response.data.total
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Index not found');
    }
    console.error('Error fetching index information:', error);
    throw error;
  }
}

async function searchSubjects(keyword) {
  try {
    const response = await axios.post(`${API_BASE_URL}/v0/search/subjects`, {
      keyword: keyword.trim(),
      filter: {
        // type: [2]  // Only anime
        type: [2, 4]  // anime and game
      }
    });

    if (!response.data || !response.data.data) {
      return [];
    }

    return response.data.data.map(subject => ({
      id: subject.id,
      name: subject.name,
      name_cn: subject.name_cn,
      image: subject.images?.grid || subject.images?.medium || '',
      date: subject.date,
      type: subject.type==2 ? '动漫' : '游戏'
    }));
  } catch (error) {
    console.error('Error searching subjects:', error);
    return [];
  }
}

export {
  getIndexInfo,
  searchSubjects
}; 