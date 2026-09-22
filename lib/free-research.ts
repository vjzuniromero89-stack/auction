import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { RESEARCH_SOURCES } from "@/lib/research-sources";
import { probeFreeSources, censusGeocode, femaFlood } from "@/lib/free-intelligence";

const checks = [
  "county_property",
  "deed_chain",
  "mortgages",
  "assignments_releases",
  "judgments",
  "state_tax_liens",
  "federal_tax_liens",
  "municipal_tax_water_sewer",
  "hoa_condo",
  "bankruptcy",
  "occupancy",
  "valuation",
  "comparables",
  "flood_risk",
];

const recorderKinds = [
  "mortgages",
  "assignments_releases",
  "state_tax_liens",
  "federal_tax_liens",
  "hoa_condo",
];

async function upsertSource(db: any, propertyId: string, p: any, x: any) {
  const sourceKey = `free:${x.key}:${p.parcel_number || p.id}`;
  const payload = {
    label: x.label,
    httpStatus: x.status ?? 200,
    reachable: x.reachable ?? true,
    excerpt: x.excerpt || null,
    identifiers: {
      parcel: p.parcel_number,
      address: p.address,
      owner: p.owner_name,
    },
    note: x.note || "Official free public source capture.",
  };

  const existing = await db
    .from("sources")
    .select("id")
    .eq("property_id", propertyId)
    .eq("source_key", sourceKey)
    .maybeSingle();

  const row = {
    property_id: propertyId,
    provider: x.label,
    source_type: x.kind || "public_source",
    source_url: x.finalUrl || x.url,
    external_reference: p.parcel_number || null,
    verification_status: (x.reachable ?? true)
      ? x.automatedResult
        ? "verified_result"
        : "source_reachable"
      : "source_unavailable",
    content_type: x.contentType || "text/html",
    captured_at: new Date().toISOString(),
    evidence_note: x.note || "Official free public source capture",
    payload,
    source_key: sourceKey,
    query_terms: {
      parcel: p.parcel_number,
      address: p.address,
      owner: p.owner_name,
    },
  };

  const q = existing.data
    ? await db.from("sources").update(row).eq("id", existing.data.id)
    : await db.from("sources").insert(row);

  if (q.error) throw q.error;
}

export async function runFreeResearch(id: string) {
  const db = getSupabaseAdmin();

  const pq = await db.from("properties").select("*").eq("id", id).single();
  if (pq.error) throw pq.error;
  const p = pq.data;

  const rr = await db
    .from("free_research_runs")
    .insert({ property_id: id, status: "running" })
    .select("id")
    .single();
  if (rr.error) throw rr.error;

  // Build all checklist/task rows in memory. Avoid one DB request per check/provider.
  const checkRows: any[] = [];
  const taskRows: any[] = [];

  for (const type of checks) {
    let src = RESEARCH_SOURCES.filter(
      (x: any) =>
        (x.kind === type ||
          (recorderKinds.includes(type) && x.kind === "deed_chain")) &&
        (!x.counties || x.counties.includes(p.county))
    );
    if (type === "judgments") src = RESEARCH_SOURCES.filter((x: any) => x.kind === "judgments");
    if (type === "flood_risk") src = RESEARCH_SOURCES.filter((x: any) => x.kind === "flood_risk");

    checkRows.push({
      property_id: id,
      check_type: type,
      status: src.length ? "researching_free" : "free_source_not_configured",
      result: {
        mode: "FREE_ONLY",
        identifiers: { address: p.address, parcel: p.parcel_number, owner: p.owner_name },
        sources: src.map((x: any) => ({ label: x.label, url: x.url, note: x.note, free: true })),
        message: src.length
          ? "Free-source research queued. VERIFIED/NOT FOUND is used only after an actual result query."
          : "No reliable $0 source configured; unresolved.",
      },
      source: src.map((x: any) => x.label).join(", ") || "FREE-ONLY research",
      checked_at: null,
    });

    for (const x of src as any[]) {
      taskRows.push({
        property_id: id,
        task_type: type,
        provider: x.key,
        status: "queued_free",
        access_cost: "free",
        execution_mode: x.automated ? "automatic" : "manual",
        query_url: x.url,
        result: {
          label: x.label,
          note: x.note,
          identifiers: { parcel: p.parcel_number, owner: p.owner_name, address: p.address },
        },
      });
    }
  }

  // Replace only this property's FREE research rows in batches.
  const delTasks = await db.from("research_tasks").delete().eq("property_id", id).eq("access_cost", "free");
  if (delTasks.error) throw delTasks.error;
  if (taskRows.length) {
    const ti = await db.from("research_tasks").insert(taskRows);
    if (ti.error) throw ti.error;
  }

  const existing = await db.from("due_diligence_checks").select("id,check_type").eq("property_id", id);
  if (existing.error) throw existing.error;
  const ids = (existing.data || []).map((x: any) => x.id);
  if (ids.length) {
    const dc = await db.from("due_diligence_checks").delete().in("id", ids);
    if (dc.error) throw dc.error;
  }
  const ci = await db.from("due_diligence_checks").insert(checkRows);
  if (ci.error) throw ci.error;

  // External official-source probes: a small bounded set, then evidence is stored in one DB insert.
  const probes = await probeFreeSources(p.county);
  const sourceRows: any[] = [];
  let reached = 0;
  for (const x of probes as any[]) {
    if (x.reachable) reached++;
    sourceRows.push({
      property_id: id,
      provider: x.label,
      source_type: x.kind || "public_source",
      source_url: x.finalUrl || x.url,
      external_reference: p.parcel_number || null,
      verification_status: x.reachable ? "source_reachable" : "source_unavailable",
      content_type: x.contentType || "text/html",
      captured_at: new Date().toISOString(),
      evidence_note: x.note || "Official free public source capture",
      payload: {
        label: x.label,
        httpStatus: x.status,
        reachable: x.reachable,
        excerpt: x.excerpt || null,
        identifiers: { parcel: p.parcel_number, address: p.address, owner: p.owner_name },
      },
      source_key: `free:${x.key}:${p.parcel_number || p.id}`,
      query_terms: { parcel: p.parcel_number, address: p.address, owner: p.owner_name },
    });
  }

  let geo: any = null;
  let flood: any = null;
  const full = [p.address, p.city, p.state || "DE", p.zip_code].filter(Boolean).join(", ");
  geo = await censusGeocode(full);

  if (geo?.lat && geo?.lon) {
    sourceRows.push({
      property_id: id,
      provider: "US Census Geocoder",
      source_type: "location",
      source_url: geo.url,
      external_reference: p.parcel_number || null,
      verification_status: "verified_result",
      content_type: "application/json",
      captured_at: new Date().toISOString(),
      evidence_note: "Actual free machine geocode completed.",
      payload: { matchedAddress: geo.matchedAddress, lat: geo.lat, lon: geo.lon },
      source_key: `free:census_geocoder:${p.parcel_number || p.id}`,
      query_terms: { address: full },
    });

    flood = await femaFlood(geo.lat, geo.lon);
    if (flood?.ok) {
      sourceRows.push({
        property_id: id,
        provider: "FEMA National Flood Hazard Layer",
        source_type: "flood_risk",
        source_url: flood.url,
        external_reference: p.parcel_number || null,
        verification_status: "verified_result",
        content_type: "application/json",
        captured_at: new Date().toISOString(),
        evidence_note: "Actual FEMA spatial query completed.",
        payload: {
          coordinates: { lat: geo.lat, lon: geo.lon },
          featureCount: flood.features.length,
          features: flood.features.slice(0, 5),
        },
        source_key: `free:fema_nfhl:${p.parcel_number || p.id}`,
        query_terms: { lat: geo.lat, lon: geo.lon },
      });
    }
  }

  // Replace this engine's evidence rows in two DB operations.
  const sd = await db.from("sources").delete().eq("property_id", id).like("source_key", "free:%");
  if (sd.error) throw sd.error;
  if (sourceRows.length) {
    const si = await db.from("sources").insert(sourceRows);
    if (si.error) throw si.error;
  }

  if (geo?.lat && geo?.lon) {
    const pu = await db.from("properties").update({ latitude: geo.lat, longitude: geo.lon }).eq("id", id);
    if (pu.error) throw pu.error;
  }

  if (flood?.ok) {
    const fu = await db
      .from("due_diligence_checks")
      .update({
        status: "verified",
        result: {
          coordinates: { lat: geo.lat, lon: geo.lon },
          featureCount: flood.features.length,
          features: flood.features.slice(0, 5),
          source: flood.url,
        },
        source: "FEMA NFHL",
        checked_at: new Date().toISOString(),
      })
      .eq("property_id", id)
      .eq("check_type", "flood_risk");
    if (fu.error) throw fu.error;
  }

  const summary = {
    mode: "FREE_ONLY",
    tasks: taskRows.length,
    publicSourcesReached: reached,
    geocoded: !!geo,
    femaQueried: !!flood?.ok,
    limitations: [
      "Interactive recorder/property/court forms remain MANUAL REVIEW until an actual query result can be obtained without bypassing access controls.",
      "Paid document images and paid providers are disabled.",
      "Absence from an unqueried or blocked source is never treated as NOT FOUND.",
    ],
  };

  const ps = await db.from("properties").update({ free_research_summary: summary }).eq("id", id);
  if (ps.error) throw ps.error;

  const rs = await db
    .from("free_research_runs")
    .update({
      status: "complete",
      sources_checked: reached,
      findings: flood?.features?.length || 0,
      completed_at: new Date().toISOString(),
      notes: [summary],
    })
    .eq("id", rr.data.id);
  if (rs.error) throw rs.error;

  return {
    ok: true,
    ...summary,
    property: { address: p.address, parcel: p.parcel_number, owner: p.owner_name, county: p.county },
  };
}
