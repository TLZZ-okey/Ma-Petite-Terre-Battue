// Configuration pour l'API Odds API
const ODDS_API_KEY = process.env.ODDS_API_KEY || "ta_cle_api_par_defaut";
const ODDS_API_BASE_URL = "https://odds-api.io/api/v1";

// Types pour les données de l'API
interface OddsMarket {
  key: string;
  outcomes: {
    name: string;
    price: number;
  }[];
}

interface Bookmaker {
  key: string;
  markets: OddsMarket[];
}

interface OddsAPIMatch {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
}

interface APIResponse {
  success: boolean;
  data: OddsAPIMatch[];
}

// Fonction pour récupérer les matchs de tennis avec leurs côtes
export const fetchTennisMatches = async (): Promise<OddsAPIMatch[]> => {
  try {
    const url = `${ODDS_API_BASE_URL}/odds?sport=tennis&region=eu&moneyline=true&apiKey=${ODDS_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch matches: ${response.statusText}`);
    }
    
    const data: APIResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching tennis matches:", error);
    return [];
  }
};

// Fonction pour formater les données des matchs pour notre application
interface FormattedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  startTime: Date;
  tournament: string;
  status: 'upcoming' | 'live' | 'finished';
}

export const formatMatches = (apiMatches: OddsAPIMatch[]): FormattedMatch[] => {
  return apiMatches.map(match => {
    // Extraire les côtes depuis les bookmakers
    let homeOdds = 2.0;
    let awayOdds = 2.0;
    
    if (match.bookmakers && match.bookmakers.length > 0) {
      const firstBookmaker = match.bookmakers[0];
      const moneylineMarket = firstBookmaker.markets?.find(m => m.key === 'moneyline');
      
      if (moneylineMarket && moneylineMarket.outcomes) {
        const homeOutcome = moneylineMarket.outcomes.find(o => o.name === match.home_team);
        const awayOutcome = moneylineMarket.outcomes.find(o => o.name === match.away_team);
        
        if (homeOutcome) homeOdds = homeOutcome.price;
        if (awayOutcome) awayOdds = awayOutcome.price;
      }
    }
    
    return {
      id: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      homeOdds,
      awayOdds,
      startTime: new Date(match.commence_time),
      tournament: match.sport_title,
      status: 'upcoming'
    };
  });
};

// Fonction pour récupérer et formater les matchs
export const getTennisMatches = async (): Promise<FormattedMatch[]> => {
  const apiMatches = await fetchTennisMatches();
  return formatMatches(apiMatches);
};

// Fonction pour récupérer les matchs depuis notre base de données locale (Firebase)
// ou depuis l'API si la base est vide
export const getMatchesWithFallback = async (): Promise<FormattedMatch[]> => {
  // Essayer de récupérer depuis Firebase d'abord
  try {
    const { getMatches } = await import('./firebase');
    const matches = await getMatches();
    if (matches.length > 0) {
      return matches;
    }
  } catch (error) {
    console.log("No matches in Firebase, fetching from API...");
  }
  
  // Si Firebase est vide, récupérer depuis l'API
  const apiMatches = await getTennisMatches();
  
  // Sauvegarder dans Firebase pour les prochaines fois
  if (apiMatches.length > 0) {
    try {
      const { addMatch } = await import('./firebase');
      for (const match of apiMatches) {
        await addMatch({
          ...match,
          status: 'upcoming'
        });
      }
    } catch (error) {
      console.error("Error saving matches to Firebase:", error);
    }
  }
  
  return apiMatches;
};
