import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = "https://api-adresse.data.gouv.fr";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

export interface AddressSuggestion {
  label: string;
  name: string;
  postcode: string;
  city: string;
  context: string;
  coordinates: { lat: number; lon: number };
  type: string;
  importance: number;
  isPOI?: boolean;
}

function formatLabel(
  label: string,
  name: string,
  city: string,
  postcode: string,
  isPOI = false
): string {
  if (isPOI && name && city) {
    return postcode ? `${name}, ${postcode} ${city}` : `${name}, ${city}`;
  }
  if (postcode && city) {
    const main = label.split(",")[0]?.trim() || name;
    if (main.includes(postcode) && main.includes(city)) return main;
    return `${main}, ${postcode} ${city}`;
  }
  return label;
}

// Mots-clés pour détecter une recherche POI (gares, aéroports, cinémas, etc.)
const POI_KEYWORDS = [
  "gare", "station", "train",
  "aeroport", "aéroport", "airport",
  "hotel", "hôtel",
  "hopital", "hôpital", "hospital",
  "universite", "université",
  "mairie",
  "musee", "musée", "museum",
  "theatre", "théâtre",
  "stade",
  "centre commercial", "mall",
  "parc", "park",
  "cinema", "cinéma", "pathé", "pathe",
  "place", "square",
  "tour", "tower",
];

function isPOIQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return POI_KEYWORDS.some((k) => lower.includes(k));
}

// Base locale de POI connus (priorité immédiate)
const LOCAL_POI: Record<string, AddressSuggestion> = {
  "toulouse matabiau": {
    label: "Gare de Toulouse-Matabiau, 31000 Toulouse",
    name: "Gare de Toulouse-Matabiau",
    postcode: "31000",
    city: "Toulouse",
    context: "Haute-Garonne, Occitanie",
    coordinates: { lat: 43.6113, lon: 1.4532 },
    type: "railway:station",
    importance: 2.0,
    isPOI: true,
  },
  "paris nord": {
    label: "Gare du Nord, 75010 Paris",
    name: "Gare du Nord",
    postcode: "75010",
    city: "Paris",
    context: "Île-de-France",
    coordinates: { lat: 48.8809, lon: 2.3553 },
    type: "railway:station",
    importance: 2.0,
    isPOI: true,
  },
  "paris gare de lyon": {
    label: "Gare de Lyon, 75012 Paris",
    name: "Gare de Lyon",
    postcode: "75012",
    city: "Paris",
    context: "Île-de-France",
    coordinates: { lat: 48.8444, lon: 2.3736 },
    type: "railway:station",
    importance: 2.0,
    isPOI: true,
  },
  "aeroport toulouse blagnac": {
    label: "Aéroport Toulouse-Blagnac, 31700 Blagnac",
    name: "Aéroport Toulouse-Blagnac",
    postcode: "31700",
    city: "Blagnac",
    context: "Haute-Garonne, Occitanie",
    coordinates: { lat: 43.6294, lon: 1.3678 },
    type: "aeroway:aerodrome",
    importance: 2.0,
    isPOI: true,
  },
};

// Normalise pour comparaison (accents -> ASCII, tirets -> espaces)
function normalizeForMatch(s: string): string {
  const combined = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // caractères combinants (accents)
    .replace(/-/g, " ")
    .trim();
  return combined;
}

function searchLocalPOI(query: string): AddressSuggestion[] {
  const normalized = normalizeForMatch(query);
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);
  const results: AddressSuggestion[] = [];
  for (const [key, poi] of Object.entries(LOCAL_POI)) {
    const keyNorm = normalizeForMatch(key);
    const nameNorm = normalizeForMatch(poi.name);
    const matchCount = words.filter(
      (word) => keyNorm.includes(word) || nameNorm.includes(word)
    ).length;
    const allWordsMatch = words.length >= 2 && matchCount >= Math.min(2, words.length);
    const queryContainsKey = keyNorm.split(/\s+/).every((k) => normalized.includes(k));
    const keyContainsQuery = normalized.length >= 5 && (keyNorm.includes(normalized) || nameNorm.includes(normalized));
    if (allWordsMatch || queryContainsKey || keyContainsQuery) {
      if (!results.some((r) => r.name === poi.name)) results.push(poi);
    }
  }
  return results;
}

// Types OSM acceptés pour les POI (dont cinémas)
function isAcceptablePOI(item: { class?: string; type?: string }): boolean {
  const c = (item.class || "").toLowerCase();
  const t = (item.type || "").toLowerCase();
  return (
    (c === "railway" && ["station", "halt", "tram_stop", "stop"].includes(t)) ||
    (c === "aeroway" && ["aerodrome", "terminal", "gate"].includes(t)) ||
    (c === "tourism" && ["hotel", "motel", "hostel", "attraction", "museum", "cinema", "theatre"].includes(t)) ||
    (c === "amenity" && ["cinema", "theatre", "hospital", "university", "town_hall", "place_of_worship", "library", "clinic", "pharmacy"].includes(t)) ||
    (c === "leisure" && ["stadium", "sports_centre", "park"].includes(t)) ||
    (c === "shop" && t === "mall") ||
    (c === "building" && t === "cinema")
  );
}

async function searchNominatimPOI(query: string, limit: number): Promise<AddressSuggestion[]> {
  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: "json",
      limit: "15",
      countrycodes: "fr",
      addressdetails: "1",
    });
    const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
      headers: { "User-Agent": "Corail-Landing/1.0", "Accept-Language": "fr" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const mapped: AddressSuggestion[] = [];
    for (const item of data) {
      if (!isAcceptablePOI(item)) continue;
      const name = item.name || (item.display_name || "").split(",")[0] || "";
      const addr = item.address || {};
      const postcode = addr.postcode || "";
      const city = addr.city || addr.town || addr.village || "";
      const displayName = item.display_name || `${name}, ${postcode} ${city}`.trim();
      mapped.push({
        label: formatLabel(displayName, name, city, postcode, true),
        name,
        postcode,
        city,
        context: [addr.county, addr.state].filter(Boolean).join(", "),
        coordinates: {
          lat: parseFloat(item.lat) || 0,
          lon: parseFloat(item.lon) || 0,
        },
        type: `${item.class || "place"}:${item.type || "unknown"}`,
        importance: parseFloat(item.importance) || 0.5,
        isPOI: true,
      });
    }
    return mapped.slice(0, limit);
  } catch {
    return [];
  }
}

async function searchAPIAdresse(query: string, limit: number): Promise<AddressSuggestion[]> {
  try {
    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString(),
      autocomplete: "1",
    });
    const res = await fetch(`${API_BASE_URL}/search/?${params}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const features = data.features || [];
    return features.map((f: any) => {
      const name = f.properties?.name ?? "";
      const postcode = f.properties?.postcode ?? "";
      const city = f.properties?.city ?? "";
      const label = f.properties?.label ?? "";
      return {
        label: formatLabel(label, name, city, postcode, false),
        name,
        postcode,
        city,
        context: f.properties?.context ?? "",
        coordinates: {
          lat: f.geometry?.coordinates?.[1] ?? 0,
          lon: f.geometry?.coordinates?.[0] ?? 0,
        },
        type: f.properties?.type ?? "address",
        importance: f.properties?.importance ?? 0.3,
        isPOI: false,
      };
    });
  } catch (err) {
    console.error("[address-search] API Adresse", err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 8, 15);

  if (q.length < 3) {
    return NextResponse.json([]);
  }

  try {
    const isPOI = isPOIQuery(q);

    // 1) Toujours vérifier la base locale (instantané)
    const localPOI = searchLocalPOI(q);

    // 2) En parallèle : API Adresse + Nominatim si recherche POI
    const [addressResults, nominatimResults] = await Promise.all([
      searchAPIAdresse(q, limit),
      isPOI ? searchNominatimPOI(q, limit) : Promise.resolve([]),
    ]);

    // 3) Fusion : POI locaux d'abord, puis Nominatim POI, puis adresses ; déduplication par label
    const seen = new Set<string>();
    const out: AddressSuggestion[] = [];

    for (const item of localPOI) {
      const key = item.label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
    for (const item of nominatimResults) {
      const key = item.label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
    for (const item of addressResults) {
      const key = item.label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }

    return NextResponse.json(out.slice(0, limit));
  } catch (err) {
    console.error("[address-search]", err);
    return NextResponse.json([], { status: 200 });
  }
}
