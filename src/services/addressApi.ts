/**
 * API Adresse - Service pour l'autocomplétion d'adresses
 * 
 * Stratégie : POI first (gares, aéroports, hôtels) puis adresses classiques
 * 
 * Sources :
 * - Nominatim (OpenStreetMap) : POI prioritaires
 * - API Adresse (data.gouv.fr) : Adresses précises
 */

import { logger } from './logger';

export interface AddressSuggestion {
  label: string;
  name: string;
  postcode: string;
  city: string;
  context: string;
  coordinates: {
    lat: number;
    lon: number;
  };
  type: string;
  importance: number;
  isPOI?: boolean; // Indicateur POI
}

/**
 * Formate un label d'adresse de manière propre et concise
 * Enlève les redondances et les informations inutiles
 */
function formatCleanLabel(
  displayName: string,
  name: string,
  city: string,
  postcode: string,
  isPOI: boolean = false
): string {
  // Pour les POIs (gares, aéroports, etc.), format simple et élégant
  if (isPOI && name && city) {
    return postcode 
      ? `${name}, ${postcode} ${city}`
      : `${name}, ${city}`;
  }

  // Nettoyage des adresses classiques
  let cleaned = displayName;

  // Enlever les informations redondantes et inutiles (régions, France)
  const regionsToRemove = [
    ', France métropolitaine',
    ', France',
    ', Occitanie',
    ', Nouvelle-Aquitaine',
    ', Île-de-France',
    ', Auvergne-Rhône-Alpes',
    ', Provence-Alpes-Côte d\'Azur',
    ', Hauts-de-France',
    ', Grand Est',
    ', Normandie',
    ', Bretagne',
    ', Pays de la Loire',
    ', Centre-Val de Loire',
    ', Bourgogne-Franche-Comté',
    ', Corse',
  ];

  regionsToRemove.forEach(term => {
    cleaned = cleaned.replace(new RegExp(term, 'gi'), '');
  });

  // Enlever les départements (toujours après la ville, donc redondants)
  const departements = [
    'Haute-Garonne', 'Gironde', 'Hérault', 'Pyrénées-Atlantiques', 'Lot-et-Garonne',
    'Bouches-du-Rhône', 'Var', 'Alpes-Maritimes', 'Vaucluse', 'Gard',
    'Rhône', 'Loire', 'Isère', 'Ain', 'Savoie', 'Haute-Savoie',
    'Nord', 'Pas-de-Calais', 'Somme', 'Oise', 'Aisne',
    'Bas-Rhin', 'Haut-Rhin', 'Moselle', 'Meurthe-et-Moselle', 'Vosges',
    'Seine-et-Marne', 'Yvelines', 'Essonne', 'Hauts-de-Seine', 'Seine-Saint-Denis',
    'Val-de-Marne', 'Val-d\'Oise', 'Paris',
    'Loire-Atlantique', 'Maine-et-Loire', 'Vendée', 'Sarthe', 'Mayenne',
    'Ille-et-Vilaine', 'Côtes-d\'Armor', 'Finistère', 'Morbihan',
  ];

  departements.forEach(dept => {
    cleaned = cleaned.replace(new RegExp(`, ${dept}`, 'gi'), '');
  });

  // Enlever les quartiers/contextes redondants
  // Ex: "Place Capitole, Capitole, Capitole / Arnaud, Toulouse, Haute-Garonne, 31000"
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);
  
  if (parts.length > 3) {
    // Stratégie: garder le nom principal + ville + code postal
    const mainName = parts[0]; // Ex: "Place du Capitole"
    
    // Trouver la ville et le code postal dans les parties
    const cityPart = parts.find(p => p === city) || city;
    const postcodePart = parts.find(p => /^\d{5}$/.test(p)) || postcode;
    
    // Vérifier si le mainName contient déjà le code postal et la ville
    const alreadyHasPostcodeAndCity = mainName.includes(postcodePart) && mainName.includes(cityPart);
    
    if (alreadyHasPostcodeAndCity) {
      return mainName; // Déjà complet, ne rien ajouter
    }
    
    if (cityPart && postcodePart) {
      return `${mainName}, ${postcodePart} ${cityPart}`;
    } else if (cityPart) {
      return `${mainName}, ${cityPart}`;
    }
  }

  // Format final propre
  if (postcode && city && parts.length > 0) {
    const mainPart = parts[0];
    
    // Vérifier si parts[0] contient déjà le code postal et la ville
    const alreadyComplete = mainPart.includes(postcode) && mainPart.includes(city);
    
    if (alreadyComplete) {
      return mainPart; // Déjà complet, ne pas dupliquer
    }
    
    // Vérifier si parts[0] est juste le code postal + ville
    const isJustPostcodeCity = mainPart.match(/^\d{5}\s+\w+$/);
    if (isJustPostcodeCity) {
      return mainPart; // C'est déjà dans le bon format
    }
    
    return `${mainPart}, ${postcode} ${city}`;
  }

  // Fallback: nettoyer les virgules doubles
  return cleaned.replace(/,\s*,/g, ',').replace(/,\s*$/, '').trim();
}

const API_BASE_URL = 'https://api-adresse.data.gouv.fr';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

// Mots-clés pour détecter une recherche de POI
const POI_KEYWORDS = [
  'gare', 'station', 'train',
  'aeroport', 'aéroport', 'airport',
  'hotel', 'hôtel',
  'hopital', 'hôpital', 'hospital',
  'universite', 'université', 'university',
  'mairie', 'town hall',
  'musee', 'musée', 'museum',
  'theatre', 'théâtre', 'theater',
  'stade', 'stadium',
  'centre commercial', 'mall',
  'parc', 'park',
  'place', 'square',
  'tour', 'tower',
  'basilique', 'eglise', 'cathédrale', 'church',
];

/**
 * Détecte le type de POI recherché
 */
function detectPOIType(query: string): 'gare' | 'aeroport' | 'hotel' | null {
  const normalized = query.toLowerCase();
  
  if (normalized.includes('gare') || normalized.includes('station')) {
    return 'gare';
  }
  if (normalized.includes('aeroport') || normalized.includes('aéroport') || normalized.includes('airport')) {
    return 'aeroport';
  }
  if (normalized.includes('hotel') || normalized.includes('hôtel')) {
    return 'hotel';
  }
  
  return null;
}

/**
 * Extrait le nom de ville de la requête
 */
function extractCityName(query: string): string | null {
  const normalized = query.toLowerCase();
  
  // Liste des grandes villes françaises
  const cities = [
    'paris', 'marseille', 'lyon', 'toulouse', 'nice', 'nantes', 
    'strasbourg', 'montpellier', 'bordeaux', 'lille', 'rennes',
    'reims', 'saint-etienne', 'toulon', 'grenoble', 'dijon',
    'angers', 'nîmes', 'villeurbanne', 'clermont-ferrand', 'le mans',
  ];
  
  for (const city of cities) {
    if (normalized.includes(city)) {
      return city;
    }
  }
  
  return null;
}

/**
 * Détecte si la requête recherche un POI
 */
function isPOIQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return POI_KEYWORDS.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Base de données locale des gares principales françaises
 */
const KNOWN_STATIONS: { [key: string]: AddressSuggestion } = {
  'toulouse matabiau': {
    label: 'Gare de Toulouse-Matabiau, 31000 Toulouse',
    name: 'Gare de Toulouse-Matabiau',
    postcode: '31000',
    city: 'Toulouse',
    context: 'Haute-Garonne, Occitanie',
    coordinates: { lat: 43.6113, lon: 1.4532 },
    type: 'railway:station',
    importance: 2.0,
    isPOI: true,
  },
  'paris nord': {
    label: 'Gare du Nord, 75010 Paris',
    name: 'Gare du Nord',
    postcode: '75010',
    city: 'Paris',
    context: 'Île-de-France',
    coordinates: { lat: 48.8809, lon: 2.3553 },
    type: 'railway:station',
    importance: 2.0,
    isPOI: true,
  },
  'paris gare de lyon': {
    label: 'Gare de Lyon, 75012 Paris',
    name: 'Gare de Lyon',
    postcode: '75012',
    city: 'Paris',
    context: 'Île-de-France',
    coordinates: { lat: 48.8444, lon: 2.3736 },
    type: 'railway:station',
    importance: 2.0,
    isPOI: true,
  },
  'aeroport toulouse blagnac': {
    label: 'Aéroport Toulouse-Blagnac, 31700 Blagnac',
    name: 'Aéroport Toulouse-Blagnac',
    postcode: '31700',
    city: 'Blagnac',
    context: 'Haute-Garonne, Occitanie',
    coordinates: { lat: 43.6294, lon: 1.3678 },
    type: 'aeroway:aerodrome',
    importance: 2.0,
    isPOI: true,
  },
};

/**
 * Recherche dans la base locale de POI connus
 */
function searchLocalPOI(query: string): AddressSuggestion[] {
  const normalized = query.toLowerCase().trim();
  const results: AddressSuggestion[] = [];
  
  for (const [key, poi] of Object.entries(KNOWN_STATIONS)) {
    // Matching flexible : tous les mots de la requête doivent être dans la clé ou le nom
    const words = normalized.split(/\s+/);
    const matchCount = words.filter(word => 
      key.includes(word) || poi.name.toLowerCase().includes(word)
    ).length;
    
    // Si au moins 2 mots correspondent (ex: "gare toulouse")
    if (matchCount >= Math.min(2, words.length)) {
      results.push(poi);
    }
  }
  
  return results;
}

/**
 * Recherche POI avec Nominatim (recherche structurée + parallèle)
 */
async function searchPOI(query: string, limit: number): Promise<AddressSuggestion[]> {
  try {
    // ÉTAPE 1: Vérifier d'abord dans la base locale (instantané)
    const localResults = searchLocalPOI(query);
    
    logger.debug('[POI Search] Résultats locaux', { 
      query, 
      count: localResults.length,
      matches: localResults.map(r => r.name)
    });

    // ÉTAPE 2: Recherche Nominatim en parallèle (2 stratégies max)
    const searchPromises: Promise<any[]>[] = [];
    
    // Stratégie 1: Recherche texte libre
    const freeTextParams = new URLSearchParams({
      q: query.trim(),
      format: 'json',
      limit: '10',
      countrycodes: 'fr',
      addressdetails: '1',
    });
    
    searchPromises.push(
      fetch(`${NOMINATIM_URL}/search?${freeTextParams}`, {
        headers: { 'User-Agent': 'Corail-VTC-App/1.0', 'Accept-Language': 'fr' },
      })
      .then(r => r.ok ? r.json() : [])
      .catch(() => [])
    );

    // Stratégie 2: Recherche structurée si c'est une gare ou aéroport
    const poiType = detectPOIType(query);
    if (poiType) {
      const cityName = extractCityName(query);
      if (cityName) {
        const structuredParams = new URLSearchParams({
          city: cityName,
          format: 'json',
          limit: '10',
          countrycodes: 'fr',
          addressdetails: '1',
          // Filtrer par type spécifique
          ...(poiType === 'gare' && { amenity: 'station' }),
          ...(poiType === 'aeroport' && { aeroway: 'aerodrome' }),
        });
        
        searchPromises.push(
          fetch(`${NOMINATIM_URL}/search?${structuredParams}`, {
            headers: { 'User-Agent': 'Corail-VTC-App/1.0', 'Accept-Language': 'fr' },
          })
          .then(r => r.ok ? r.json() : [])
          .catch(() => [])
        );
      }
    }

    // Attendre toutes les recherches en parallèle (RAPIDE)
    const results = await Promise.all(searchPromises);
    const allResults = results.flat();

    // Fusionner résultats locaux + Nominatim et dédupliquer
    const nominatimMapped = allResults.map((item: any) => ({
      place_id: item.place_id,
      name: item.name || item.display_name?.split(',')[0] || '',
      ...item,
    }));
    
    // Dédupliquer par nom (priorité aux résultats locaux)
    const seenNames = new Set<string>();
    const mergedResults: any[] = [];
    
    // D'abord les résultats locaux (haute confiance)
    for (const local of localResults) {
      const key = local.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        mergedResults.push({
          name: local.name,
          display_name: local.label,
          address: {
            postcode: local.postcode,
            city: local.city,
          },
          lat: local.coordinates.lat.toString(),
          lon: local.coordinates.lon.toString(),
          class: local.type.split(':')[0],
          type: local.type.split(':')[1],
          importance: local.importance,
          isLocal: true,
        });
      }
    }
    
    // Puis les résultats Nominatim
    for (const item of nominatimMapped) {
      const key = item.name.toLowerCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        mergedResults.push(item);
      }
    }

    // Filtrage intelligent : POI + scoring
    const filteredData = mergedResults.filter((item: any) => {
      const category = item.class;
      const type = item.type;
      const name = (item.name || '').toLowerCase();
      const displayName = (item.display_name || '').toLowerCase();
      
      // Liste blanche stricte des POI
      const isValidPOI = 
        // Gares (priorité absolue)
        (category === 'railway' && ['station', 'halt', 'tram_stop', 'stop'].includes(type)) ||
        // Aéroports
        (category === 'aeroway' && ['aerodrome', 'terminal', 'gate'].includes(type)) ||
        // Hôtels
        (category === 'tourism' && ['hotel', 'motel', 'hostel', 'guest_house'].includes(type)) ||
        // Monuments/Attractions
        (category === 'tourism' && ['attraction', 'museum', 'artwork', 'viewpoint', 'gallery'].includes(type)) ||
        // Établissements publics
        (category === 'amenity' && ['hospital', 'university', 'theatre', 'town_hall', 'place_of_worship', 'library', 'clinic'].includes(type)) ||
        // Centres commerciaux, stades
        (category === 'amenity' && ['marketplace', 'community_centre'].includes(type)) ||
        (category === 'leisure' && ['stadium', 'sports_centre', 'park'].includes(type)) ||
        // Places importantes
        (category === 'place' && ['square'].includes(type) && name.length > 0);
      
      // Exclure les résultats trop génériques
      const isTooGeneric = 
        (type === 'administrative' && !name) ||
        (category === 'highway' && !['bus_stop', 'platform'].includes(type)) ||
        (category === 'place' && ['city', 'town', 'village', 'suburb', 'neighbourhood'].includes(type));
      
      return isValidPOI && !isTooGeneric;
    });

    // Mapper et scorer intelligemment
    const suggestions = filteredData.map((item: any) => {
      const name = item.name || item.display_name?.split(',')[0] || '';
      const category = item.class;
      const type = item.type;
      
      // Score de base
      let importance = parseFloat(item.importance) || 0;
      
      // BOOST ÉNORME pour les résultats locaux (base de données)
      if (item.isLocal) {
        importance = 3.0; // Priorité absolue aux résultats locaux
      } else {
        // Boost massif selon le type (Nominatim)
        if (category === 'railway') importance += 1.5; // ⭐ GARES
        if (category === 'aeroway') importance += 1.4; // ✈️ Aéroports
        if (category === 'tourism' && ['hotel', 'attraction'].includes(type)) importance += 0.8;
        if (category === 'amenity' && ['hospital', 'university'].includes(type)) importance += 0.7;
        if (category === 'leisure') importance += 0.6;
        
        // Boost si le nom contient les mots-clés de la recherche
        const searchWords = query.toLowerCase().split(/\s+/);
        const nameWords = name.toLowerCase();
        const matchCount = searchWords.filter(word => 
          word.length > 2 && nameWords.includes(word)
        ).length;
        importance += matchCount * 0.4; // +0.4 par mot trouvé
      }

      const postcode = item.address?.postcode || '';
      const city = item.address?.city || item.address?.town || item.address?.village || '';
      
      return {
        label: formatCleanLabel(item.display_name, name, city, postcode, true),
        name,
        postcode,
        city,
        context: `${item.address?.county || ''}, ${item.address?.state || ''}`.trim(),
        coordinates: {
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        },
        type: `${category}:${type}`,
        importance,
        isPOI: true,
      };
    });

    // Trier par importance (score le plus élevé en premier)
    suggestions.sort((a, b) => b.importance - a.importance);

    logger.debug('[POI Search] Résultats trouvés', {
      query,
      count: suggestions.length,
    });

    return suggestions.slice(0, limit);
  } catch (error) {
    logger.error('[POI Search] Erreur', error, { query });
    return [];
  }
}

/**
 * Recherche d'adresses classiques avec API Adresse
 */
async function searchAddresses(query: string, limit: number): Promise<AddressSuggestion[]> {
  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
      autocomplete: '1',
    });

    const response = await fetch(`${API_BASE_URL}/search/?${params}`);
    
    if (!response.ok) {
      throw new Error(`API Adresse error: ${response.status}`);
    }

    const data = await response.json();

    const suggestions = data.features.map((feature: any) => {
      const name = feature.properties.name;
      const postcode = feature.properties.postcode || '';
      const city = feature.properties.city || '';
      const label = feature.properties.label;
      
      return {
        label: formatCleanLabel(label, name, city, postcode, false),
        name,
        postcode,
        city,
        context: feature.properties.context || '',
        coordinates: {
          lat: feature.geometry.coordinates[1],
          lon: feature.geometry.coordinates[0],
        },
        type: feature.properties.type,
        importance: feature.properties.importance || 0.3,
        isPOI: false,
      };
    });

    logger.debug('[API Adresse] Résultats trouvés', {
      query,
      count: suggestions.length,
    });

    return suggestions;
  } catch (error) {
    logger.error('[API Adresse] Erreur', error, { query });
    return [];
  }
}

/**
 * Recherche HYBRIDE intelligente : POI first, addresses second
 * 
 * @param query - Texte de recherche
 * @param limit - Nombre de résultats (défaut: 8)
 * @returns Liste de suggestions d'adresses
 */
export async function searchAddress(
  query: string,
  limit: number = 8
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const isPOI = isPOIQuery(query);

    if (isPOI) {
      // Stratégie POI : Nominatim en priorité
      logger.debug('[SearchAddress] Détection POI', { query });
      
      const poiResults = await searchPOI(query, limit);
      
      // Si on trouve des POI, on les retourne directement
      if (poiResults.length > 0) {
        logger.info('[SearchAddress] POI trouvés', {
          query,
          count: poiResults.length,
        });
        return poiResults;
      }
      
      // Sinon fallback sur adresses classiques
      logger.debug('[SearchAddress] Pas de POI, fallback adresses', { query });
      return await searchAddresses(query, limit);
    } else {
      // Stratégie adresse : API Adresse en priorité
      logger.debug('[SearchAddress] Recherche adresse classique', { query });
      
      const addressResults = await searchAddresses(query, limit);
      
      // Si peu de résultats, on ajoute des POI en complément
      if (addressResults.length < 3) {
        const poiResults = await searchPOI(query, 3);
        const combined = [...addressResults, ...poiResults];
        
        // Dédupliquer
        const unique = combined.filter((item, index, self) => 
          index === self.findIndex(t => t.label.toLowerCase() === item.label.toLowerCase())
        );
        
        return unique.slice(0, limit);
      }
      
      return addressResults;
    }
  } catch (error) {
    logger.error('[SearchAddress] Erreur recherche', error, { query });
    return [];
  }
}

/**
 * Géocodage inversé : obtenir une adresse à partir de coordonnées
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<AddressSuggestion | null> {
  try {
    const params = new URLSearchParams({
      lon: lon.toString(),
      lat: lat.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/reverse/?${params}`);
    
    if (!response.ok) {
      throw new Error(`API Adresse error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const name = feature.properties.name;
    const postcode = feature.properties.postcode || '';
    const city = feature.properties.city || '';
    const label = feature.properties.label;
    
    return {
      label: formatCleanLabel(label, name, city, postcode, false),
      name,
      postcode,
      city,
      context: feature.properties.context || '',
      coordinates: {
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
      },
      type: feature.properties.type,
      importance: feature.properties.importance || 0,
      isPOI: false,
    };
  } catch (error) {
    logger.error('[ReverseGeocode] Erreur', error, { lat, lon });
    return null;
  }
}
