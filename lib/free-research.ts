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

  await db
    .from("research_tasks")
    .update({ status: "disabled_paid_provider", access_cost: "paid" })
    .eq("property_id", id)
    .in("provider", [
      "attom",
      "pacer",
      "first_american",
      "datatree",
      "corelogic",
    ]);

  let taskCount = 0;

  for (const type of checks) {
    let src = RESEARCH_SOURCES.filter(
      (s: any) =>
        (s.kind === type ||
          (recorderKinds.includes(type) && s.kind === "deed_chain")) &&
        (!s.counties || s.counties.includes(p.county))
    );

    if (type === "judgments") {
      src = RESEARCH_SOURCES.filter((s: any) => s.kind === "judgments");
    }
    if (type === "flood_risk") {
      src = RESEARCH_SOURCES.filter((s: any) => s.kind === "flood_risk");
    }

    const status = src.length
      ? "researching_free"
      : "free_source_not_configured";

    const result = {
      mode: "FREE_ONLY",
      identifiers: {
        address: p.address,
        parcel: p.parcel_number,
        owner: p.owner_name,
      },
      sources: src.map((s: any) => ({
        label: s.label,
        url: s.url,
        note: s.note,
        free: true,
      })),
      message: src.length
        ? "Free-source research queued. VERIFIED/NOT FOUND is used only after an actual result query."
        : "No reliable $0 source configured; unresolved.",
    };

    const old = await db
      .from("due_diligence_checks")
      .select("id")
      .eq("property_id", id)
      .eq("check_type", type)
      .maybeSingle();

    const row = {
      property_id: id,
      check_type: type,
      status,
      result,
      source: src.map((x: any) => x.label).join(", ") || "FREE-ONLY research",
      checked_at: null,
    };

    if (old.data) {
      const q = await db
        .from("due_diligence_checks")
        .update(row)
        .eq("id", old.data.id);
      if (q.error) throw q.error;
    } else {
      const q = await db.from("due_diligence_checks").insert(row);
      if (q.error) throw q.error;
    }

    for (const s of src as any[]) {
      const ex = await db
        .from("research_tasks")
        .select("id")
        .eq("property_id", id)
        .eq("task_type", type)
        .eq("provider", s.key)
        .maybeSingle();

      const task = {
        property_id: id,
        task_type: type,
        provider: s.key,
        status: "queued_free",
        access_cost: "free",
        execution_mode: s.automated ? "automatic" : "manual",
        query_url: s.url,
        result: {
          label: s.label,
          note: s.note,
          identifiers: {
            parcel: p.parcel_number,
            owner: p.owner_name,
            address: p.address,
          },
        },
      };

      const q = ex.data
        ? await db.from("research_tasks").update(task).eq("id", ex.data.id)
        : await db.from("research_tasks").insert(task);
      if (q.error) throw q.error;
      taskCount++;
    }
  }

  const probes = await probeFreeSources(p.county);
  let reached = 0;

  for (const x of probes as any[]) {
    await upsertSource(db, id, p, x);

    const tq = await db
      .from("research_tasks")
      .update({
        last_http_status: x.status,
        last_checked_at: new Date().toISOString(),
        status: x.reachable ? "manual_review_required" : "source_unavailable",
        result: { sourceReached: x.reachable, note: x.note },
      })
      .eq("property_id", id)
      .eq("provider", x.key);

    if (tq.error) throw tq.error;
    if (x.reachable) reached++;
  }

  let geo: any = null;
  let flood: any = null;

  const full = [p.address, p.city, p.state || "DE", p.zip_code]
    .filter(Boolean)
    .join(", ");

  geo = await censusGeocode(full);

  if (geo?.lat && geo?.lon) {
    const uq = await db
      .from("properties")
      .update({ latitude: geo.lat, longitude: geo.lon })
      .eq("id", id);
    if (uq.error) throw uq.error;

    await upsertSource(db, id, p, {
      key: "census_geocoder",
      label: "US Census Geocoder",
      kind: "location",
      url: geo.url,
      finalUrl: geo.url,
      status: 200,
      reachable: true,
      contentType: "application/json",
      excerpt: geo.matchedAddress,
      automatedResult: true,
      note: "Actual free machine geocode completed.",
    });

    flood = await femaFlood(geo.lat, geo.lon);

    if (flood?.ok) {
      await upsertSource(db, id, p, {
        key: "fema_nfhl",
        label: "FEMA National Flood Hazard Layer",
        kind: "flood_risk",
        url: flood.url,
        finalUrl: flood.url,
        status: flood.status,
        reachable: true,
        contentType: "application/json",
        excerpt: JSON.stringify(flood.features).slice(0, 1600),
        automatedResult: true,
        note: "Actual FEMA spatial query completed.",
      });

      const ck = await db
        .from("due_diligence_checks")
        .select("id")
        .eq("property_id", id)
        .eq("check_type", "flood_risk")
        .maybeSingle();

      const fres = {
        coordinates: { lat: geo.lat, lon: geo.lon },
        featureCount: flood.features.length,
        features: flood.features.slice(0, 5),
        source: flood.url,
      };

      const frow = {
        status: "verified",
        result: fres,
        source: "FEMA NFHL",
        checked_at: new Date().toISOString(),
      };

      if (ck.data) {
        const fq = await db
          .from("due_diligence_checks")
          .update(frow)
          .eq("id", ck.data.id);
        if (fq.error) throw fq.error;
      }
    }
  }

  const summary = {
    mode: "FREE_ONLY",
    tasks: taskCount,
    publicSourcesReached: reached,
    geocoded: !!geo,
    femaQueried: !!flood?.ok,
    limitations: [
      "Interactive recorder/property/court forms remain MANUAL REVIEW until an actual query result can be obtained without bypassing access controls.",
      "Paid document images and paid providers are disabled.",
      "Absence from an unqueried or blocked source is never treated as NOT FOUND.",
    ],
  };

  const ps = await db
    .from("properties")
    .update({ free_research_summary: summary })
    .eq("id", id);
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
    property: {
      address: p.address,
      parcel: p.parcel_number,
      owner: p.owner_name,
      county: p.county,
    },
  };
}
