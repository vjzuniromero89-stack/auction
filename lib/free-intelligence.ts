
type ProbeResult = {
  key: string;
  label: string;
  kind: string;
  url: string;
  finalUrl?: string;
  status: number;
  reachable: boolean;
  contentType?: string;
  excerpt?: string;
  automatedResult?: boolean;
  note?: string;
};

async function safeGet(url: string): Promise<ProbeResult> {
  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "user-agent": "DelawareAuctionIntelligence/1.0",
      },
      redirect: "follow",
    });
    const contentType = r.headers.get("content-type") || "";
    let excerpt = "";
    try {
      const text = await r.text();
      excerpt = text.replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 1200);
    } catch {}
    return {
      key: "public_source",
      label: url,
      kind: "public_source",
      url,
      finalUrl: r.url,
      status: r.status,
      reachable: r.ok,
      contentType,
      excerpt,
      note: r.ok ? "Official public source reached." : `Source returned HTTP ${r.status}.`,
    };
  } catch (e: any) {
    return {
      key: "public_source",
      label: url,
      kind: "public_source",
      url,
      status: 0,
      reachable: false,
      note: e?.message || "Source request failed.",
    };
  }
}

const countySources: Record<string, Array<Omit<ProbeResult, "status" | "reachable">>> = {
  "New Castle": [
    {
      key: "ncc_parcel",
      label: "New Castle County Parcel Search",
      kind: "county_property",
      url: "https://www3.newcastlede.gov/parcel/search/",
      note: "Official New Castle County parcel search.",
    },
    {
      key: "ncc_recorder",
      label: "New Castle County Recorder Document Search",
      kind: "deed_chain",
      url: "https://www.newcastlede.gov/144/Document-Search",
      note: "Official Recorder document search information.",
    },
    {
      key: "ncc_tax",
      label: "New Castle County Tax Information",
      kind: "municipal_tax_water_sewer",
      url: "https://www.newcastlede.gov/232/Tax-Information-Forms",
      note: "Official county tax information.",
    },
  ],
  Kent: [
    {
      key: "kent_property",
      label: "Kent County Property Records",
      kind: "county_property",
      url: "https://propertyrecords.kentcountyde.gov/",
      note: "Official Kent County property records.",
    },
    {
      key: "kent_deeds",
      label: "Kent County Recorder / Land Records",
      kind: "deed_chain",
      url: "https://i2g.uslandrecords.com/DE/Kent2/D/Default.aspx",
      note: "Official Kent County land records portal.",
    },
  ],
  Sussex: [
    {
      key: "sussex_property",
      label: "Sussex County Property Search",
      kind: "county_property",
      url: "https://property.sussexcountyde.gov/PT/forms/htmlframe.aspx?mode=content%2Fhome.htm",
      note: "Official Sussex County property search.",
    },
    {
      key: "sussex_deeds",
      label: "Sussex County Landmark Recorder",
      kind: "deed_chain",
      url: "https://deeds.sussexcountyde.gov/LandmarkWeb/Home/Index",
      note: "Official Sussex County Recorder / Landmark portal.",
    },
  ],
};

const statewideSources: Array<Omit<ProbeResult, "status" | "reachable">> = [
  {
    key: "de_courtconnect",
    label: "Delaware CourtConnect",
    kind: "judgments",
    url: "https://courtconnect.courts.delaware.gov/cc/cconnect/ck_public_qry_main.cp_main_srch_options",
    note: "Official Delaware CourtConnect public search.",
  },
];

export async function probeFreeSources(county: string): Promise<ProbeResult[]> {
  const defs = [...(countySources[county] || []), ...statewideSources];
  const out: ProbeResult[] = [];
  for (const def of defs) {
    try {
      const r = await fetch(def.url, {
        method: "GET",
        headers: {
          accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
          "user-agent": "DelawareAuctionIntelligence/1.0",
        },
        redirect: "follow",
      });
      let excerpt = "";
      try {
        const text = await r.text();
        excerpt = text
          .replace(/<script[\s\S]*?<\/script>/gi, " ")
          .replace(/<style[\s\S]*?<\/style>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 1200);
      } catch {}
      out.push({
        ...def,
        finalUrl: r.url,
        status: r.status,
        reachable: r.ok,
        contentType: r.headers.get("content-type") || "",
        excerpt,
      });
    } catch (e: any) {
      out.push({
        ...def,
        status: 0,
        reachable: false,
        note: `${def.note || ""} ${e?.message || "Request failed."}`.trim(),
      });
    }
  }
  return out;
}

export async function censusGeocode(address: string): Promise<any | null> {
  if (!address) return null;
  const u = new URL("https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress");
  u.searchParams.set("address", address);
  u.searchParams.set("benchmark", "Public_AR_Current");
  u.searchParams.set("vintage", "Current_Current");
  u.searchParams.set("format", "json");

  try {
    const r = await fetch(u.toString(), {
      headers: { accept: "application/json", "user-agent": "DelawareAuctionIntelligence/1.0" },
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    const match = j?.result?.addressMatches?.[0];
    if (!match?.coordinates) return null;
    return {
      lat: Number(match.coordinates.y),
      lon: Number(match.coordinates.x),
      matchedAddress: match.matchedAddress || address,
      url: u.toString(),
      raw: match,
    };
  } catch {
    return null;
  }
}

export async function femaFlood(lat: number, lon: number): Promise<any> {
  const geometry = `${lon},${lat}`;
  const u = new URL("https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query");
  u.searchParams.set("f", "json");
  u.searchParams.set("geometry", geometry);
  u.searchParams.set("geometryType", "esriGeometryPoint");
  u.searchParams.set("inSR", "4326");
  u.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  u.searchParams.set("outFields", "*");
  u.searchParams.set("returnGeometry", "false");

  try {
    const r = await fetch(u.toString(), {
      headers: { accept: "application/json", "user-agent": "DelawareAuctionIntelligence/1.0" },
    });
    const j: any = await r.json().catch(() => ({}));
    return {
      ok: r.ok && !j?.error,
      status: r.status,
      url: u.toString(),
      features: Array.isArray(j?.features) ? j.features : [],
      error: j?.error || null,
    };
  } catch (e: any) {
    return {
      ok: false,
      status: 0,
      url: u.toString(),
      features: [],
      error: e?.message || "FEMA request failed",
    };
  }
}
