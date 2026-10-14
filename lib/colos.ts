// Cloudflare colo 代码 → 国家(常见节点精选;未收录返回 null)
const COLOS: Record<string, string> = {
  SJC: "US", LAX: "US", SEA: "US", ORD: "US", DFW: "US", IAD: "US", ATL: "US", MIA: "US", EWR: "US", BOS: "US", DEN: "US", PHX: "US", MSP: "US", PDX: "US", IAH: "US", SMF: "US", SLC: "US", STL: "US", DTW: "US", TPA: "US", PHL: "US", CLT: "US", BNA: "US", RDU: "US", AUS: "US", MCI: "US", PIT: "US", CVG: "US", IND: "US", MDT: "US",
  YVR: "CA", YYZ: "CA", YWG: "CA", YUL: "CA",
  MEX: "MX", QRO: "MX",
  GRU: "BR", GIG: "BR", POA: "BR", REC: "BR", FOR: "BR",
  EZE: "AR", SCL: "CL", BOG: "CO", LIM: "PE",
  LHR: "GB", MAN: "GB", EDI: "GB", LBA: "GB",
  DUB: "IE", AMS: "NL", FRA: "DE", DUS: "DE", MUC: "DE", BER: "DE", HAM: "DE", STR: "DE", CDG: "FR", MRS: "FR", LYS: "FR", MAD: "ES", BCN: "ES", LIS: "PT", MXP: "IT", FCO: "IT", PMO: "IT", ZRH: "CH", GVA: "CH", VIE: "AT", ARN: "SE", OSL: "NO", CPH: "DK", HEL: "FI", WAW: "PL", PRG: "CZ", BUD: "HU", OTP: "RO", SOF: "BG", ATH: "GR", BEG: "RS", ZAG: "HR", KEF: "IS", RIX: "LV", TLL: "EE", VNO: "LT",
  IST: "TR", DXB: "AE", DOH: "QA", KWI: "KW", BAH: "BH", RUH: "SA", JED: "SA", TLV: "IL", AMM: "JO", BWN: "BN",
  BOM: "IN", MAA: "IN", BLR: "IN", DEL: "IN", CCU: "IN", HYD: "IN", MRT: "LK", DAC: "BD", KHI: "PK",
  SIN: "SG", KUL: "MY", BKK: "TH", HKG: "HK", SGN: "VN", HAN: "VN", MNL: "PH", CGK: "ID", DPS: "ID", PNH: "KH", RGN: "MM",
  NRT: "JP", KIX: "JP", FUK: "JP", CTS: "JP", ICN: "KR", TPE: "TW",
  SYD: "AU", MEL: "AU", PER: "AU", BNE: "AU", ADL: "AU", AKL: "NZ", WLG: "NZ",
  JNB: "ZA", CPT: "ZA", NBO: "KE", LOS: "NG", ABJ: "CI", DAR: "TZ", EBB: "UG",
};

export function coloToCountry(colo: string): string | null {
  if (!colo) return null;
  return COLOS[colo.trim().toUpperCase()] || null;
}

// colo 代码 → 城市名(常见节点精选;未收录返回 null)
const COLO_CITY: Record<string, string> = {
  SJC: "San Jose", LAX: "Los Angeles", SEA: "Seattle", ORD: "Chicago", DFW: "Dallas", IAD: "Ashburn", ATL: "Atlanta", MIA: "Miami", EWR: "Newark", BOS: "Boston", DEN: "Denver", PHX: "Phoenix", MSP: "Minneapolis", PDX: "Portland", IAH: "Houston", SMF: "Sacramento", SLC: "Salt Lake City", STL: "St. Louis", DTW: "Detroit", TPA: "Tampa", PHL: "Philadelphia", CLT: "Charlotte", AUS: "Austin", SAN: "San Diego", LAS: "Las Vegas",
  YVR: "Vancouver", YYZ: "Toronto", YWG: "Winnipeg", YUL: "Montreal", YYC: "Calgary",
  MEX: "Mexico City", QRO: "Queretaro",
  GRU: "Sao Paulo", GIG: "Rio de Janeiro", EZE: "Buenos Aires", SCL: "Santiago", BOG: "Bogota", LIM: "Lima",
  LHR: "London", MAN: "Manchester", EDI: "Edinburgh",
  DUB: "Dublin", AMS: "Amsterdam", FRA: "Frankfurt", DUS: "Dusseldorf", MUC: "Munich", BER: "Berlin", HAM: "Hamburg", CDG: "Paris", MRS: "Marseille", MAD: "Madrid", BCN: "Barcelona", LIS: "Lisbon", MXP: "Milan", FCO: "Rome", ZRH: "Zurich", GVA: "Geneva", VIE: "Vienna", ARN: "Stockholm", OSL: "Oslo", CPH: "Copenhagen", HEL: "Helsinki", WAW: "Warsaw", PRG: "Prague", BUD: "Budapest", OTP: "Bucharest", SOF: "Sofia", ATH: "Athens", BEG: "Belgrade", ZAG: "Zagreb", KEF: "Reykjavik", RIX: "Riga", TLL: "Tallinn", VNO: "Vilnius",
  IST: "Istanbul", DXB: "Dubai", DOH: "Doha", KWI: "Kuwait City", BAH: "Manama", RUH: "Riyadh", JED: "Jeddah", TLV: "Tel Aviv", AMM: "Amman",
  BOM: "Mumbai", MAA: "Chennai", BLR: "Bengaluru", DEL: "New Delhi", CCU: "Kolkata", HYD: "Hyderabad", DAC: "Dhaka", KHI: "Karachi", CMB: "Colombo",
  SIN: "Singapore", KUL: "Kuala Lumpur", BKK: "Bangkok", HKG: "Hong Kong", SGN: "Ho Chi Minh City", HAN: "Hanoi", MNL: "Manila", CGK: "Jakarta", DPS: "Denpasar",
  NRT: "Tokyo", KIX: "Osaka", FUK: "Fukuoka", CTS: "Sapporo", ICN: "Seoul", TPE: "Taipei", KHH: "Kaohsiung",
  SYD: "Sydney", MEL: "Melbourne", PER: "Perth", BNE: "Brisbane", ADL: "Adelaide", AKL: "Auckland", WLG: "Wellington",
  JNB: "Johannesburg", CPT: "Cape Town", NBO: "Nairobi", LOS: "Lagos", DAR: "Dar es Salaam",
};

export function coloToCity(colo: string): string | null {
  if (!colo) return null;
  return COLO_CITY[colo.trim().toUpperCase()] || null;
}
