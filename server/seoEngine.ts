export function calculateSeoScore(content: string, keyword?: string): {
  readabilityScore: number;
  seoScore: number;
  keywordDensity: string;
  suggestions: string[];
} {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  const avgWordsPerSentence = wordCount / sentenceCount;

  let readabilityScore = 100;
  if (avgWordsPerSentence > 25) readabilityScore -= 20;
  else if (avgWordsPerSentence > 20) readabilityScore -= 10;
  else if (avgWordsPerSentence > 15) readabilityScore -= 5;
  if (wordCount < 300) readabilityScore -= 15;
  if (wordCount < 100) readabilityScore -= 25;

  const suggestions: string[] = [];
  if (wordCount < 300) suggestions.push("Consider expanding the content to at least 300 words");
  if (avgWordsPerSentence > 20) suggestions.push("Shorten sentences to improve readability");
  if (wordCount > 0 && sentences.length < 3) suggestions.push("Add more paragraph breaks or sections");

  let seoScore = 50;
  let keywordDensity = "0.00%";

  if (keyword && wordCount > 0) {
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const regex = new RegExp(`\\b${lowerKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    const matches = lowerContent.match(regex);
    const keywordCount = matches ? matches.length : 0;
    const density = (keywordCount / wordCount) * 100;
    keywordDensity = `${density.toFixed(2)}%`;

    if (keywordCount === 0) {
      seoScore = 30;
      suggestions.push(`Add the target keyword "${keyword}" to the content`);
    } else if (density < 0.5) {
      seoScore = 60;
      suggestions.push(`Increase keyword "${keyword}" usage (current density: ${keywordDensity})`);
    } else if (density > 5) {
      seoScore = 70;
      suggestions.push(`Reduce keyword "${keyword}" usage to avoid keyword stuffing (current density: ${keywordDensity})`);
    } else {
      seoScore = 85;
    }

    const firstThird = lowerContent.slice(0, Math.floor(lowerContent.length / 3));
    if (!firstThird.includes(lowerKeyword)) {
      seoScore -= 10;
      suggestions.push(`Add the keyword "${keyword}" earlier in the content`);
    }
  }

  if (wordCount >= 1000) seoScore += 5;
  if (wordCount >= 2000) seoScore += 5;

  readabilityScore = Math.max(0, Math.min(100, readabilityScore));
  seoScore = Math.max(0, Math.min(100, seoScore));

  return { readabilityScore, seoScore, keywordDensity, suggestions };
}

export function generateMetaTags(title: string, content: string): {
  metaTitle: string;
  metaDescription: string;
} {
  const words = content.trim().split(/\s+/).filter(Boolean);
  let metaTitle = title.length > 60 ? title.slice(0, 57) + "..." : title;
  const firstSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let metaDescription = firstSentences.length > 0 ? firstSentences[0].trim() : content.slice(0, 200);
  if (metaDescription.length < 50 && firstSentences.length > 1) {
    metaDescription = (firstSentences[0] + ". " + firstSentences[1]).trim();
  }
  if (metaDescription.length > 160) {
    metaDescription = metaDescription.slice(0, 157) + "...";
  }
  return { metaTitle, metaDescription };
}

export function analyzeKeyword(keyword: string): Promise<{
  volume: number;
  difficulty: number;
  intent: string;
}> {
  const seed = keyword.length;
  const volume = ((seed * 13 + 7) % 10000) + 100;
  const difficulty = ((seed * 7 + 3) % 100);
  const intents = ["informational", "commercial", "transactional", "navigational"];
  const intent = intents[seed % intents.length];

  return Promise.resolve({ volume, difficulty, intent });
}
