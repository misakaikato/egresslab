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
