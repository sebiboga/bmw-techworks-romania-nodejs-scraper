import fetch from "node-fetch";
import fs from "fs";
import { loadEnvFile } from "node:process";

try {
  loadEnvFile(".env.local");
} catch {
  // .env.local may not exist in CI
}

const SOLR_URL = "https://solr.peviitor.ro/solr/job";
const SOLR_COMPANY_URL = "https://solr.peviitor.ro/solr/company";
const TIMEOUT = 10000;

export function getSolrAuth() {
  const auth = process.env.SOLR_AUTH;
  if (!auth) throw new Error("SOLR_AUTH not set in environment");
  return auth;
}

function authHeaders() {
  return {
    "Authorization": "Basic " + Buffer.from(getSolrAuth()).toString("base64"),
    "Content-Type": "application/json",
    "User-Agent": "job_seeker_ro_spider"
  };
}

export async function querySOLR(cif) {
  const params = new URLSearchParams({
    q: `cif:${cif}`,
    rows: 200,
    wt: "json"
  });

  const res = await fetch(`${SOLR_URL}/select?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`SOLR query error: ${res.status}`);

  const data = await res.json();
  return data.response;
}

export async function upsertCompany(companyDoc) {
  const params = new URLSearchParams({ commit: "true" });
  const res = await fetch(`${SOLR_COMPANY_URL}/update?${params}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify([companyDoc])
  });
  if (!res.ok) throw new Error(`SOLR company upsert error: ${res.status}`);
  console.log(`✅ Company "${companyDoc.company}" upserted to SOLR company core.`);
}

export async function queryCompanySOLR(companyQuery) {
  const params = new URLSearchParams({ q: companyQuery, rows: 10, wt: "json" });
  const res = await fetch(`${SOLR_COMPANY_URL}/select?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`SOLR company query error: ${res.status}`);
  return (await res.json()).response;
}

export async function deleteJobsByCIF(cif) {
  const params = new URLSearchParams({ commit: "true" });
  const deleteQuery = JSON.stringify({ delete: { query: `cif:${cif}` } });
  const res = await fetch(`${SOLR_URL}/update?${params}`, {
    method: "POST", headers: authHeaders(), body: deleteQuery
  });
  if (!res.ok) throw new Error(`SOLR delete error: ${res.status}`);
  console.log("✅ Jobs deleted from SOLR.");
}

export async function deleteJobByUrl(url) {
  const params = new URLSearchParams({ commit: "true" });
  const deleteQuery = JSON.stringify({ delete: { query: `url:"${url}"` } });
  const res = await fetch(`${SOLR_URL}/update?${params}`, {
    method: "POST", headers: authHeaders(), body: deleteQuery
  });
  if (!res.ok) throw new Error(`SOLR delete error: ${res.status}`);
}

export async function upsertJobs(jobs) {
  const params = new URLSearchParams({ commit: "true" });
  const res = await fetch(`${SOLR_URL}/update?${params}`, {
    method: "POST", headers: authHeaders(), body: JSON.stringify(jobs)
  });
  if (!res.ok) throw new Error(`SOLR upsert error: ${res.status}`);
  console.log(`✅ Upserted ${jobs.length} jobs to SOLR.`);
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      timeout: TIMEOUT,
      headers: { "User-Agent": "job_seeker_ro_spider" }
    });
    return { url, status: res.status, valid: res.ok };
  } catch (err) {
    return { url, status: 0, valid: false, error: err.message };
  }
}

async function runVerification(cif) {
  console.log("=== Verify SOLR Jobs ===\n");
  const result = await querySOLR(cif);
  console.log(`Total jobs in SOLR for CIF ${cif}: ${result.numFound}`);

  if (fs.existsSync("tmp/jobs_existing.json")) {
    console.log("\n=== Verify existing URLs ===\n");
    const existing = JSON.parse(fs.readFileSync("tmp/jobs_existing.json", "utf-8"));
    const existingJobs = existing.jobs || [];
    console.log(`Checking ${existingJobs.length} URLs...`);

    const invalidUrls = [];
    for (let i = 0; i < existingJobs.length; i++) {
      const job = existingJobs[i];
      const res = await checkUrl(job.url);
      console.log(`[${i+1}/${existingJobs.length}] ${res.status > 0 ? res.status : 'ERR'} - ${job.url}`);
      if (!res.valid) invalidUrls.push(job.url);
    }

    if (invalidUrls.length > 0) {
      console.log(`\n⚠️ ${invalidUrls.length} invalid URLs found - deleting from SOLR...`);
      for (const url of invalidUrls) {
        await deleteJobByUrl(url);
      }
      console.log(`✅ Deleted ${invalidUrls.length} invalid jobs from SOLR`);
    }

    if (invalidUrls.length === 0) {
      fs.unlinkSync("tmp/jobs_existing.json");
    } else {
      console.log("⚠️ Keeping tmp/jobs_existing.json for reference");
    }
  }
}

async function runExtract(cif) {
  console.log("=== Extract existing jobs from SOLR ===\n");
  try {
    const result = await querySOLR(cif);
    console.log(`Found ${result.numFound} existing jobs in SOLR for CIF ${cif}`);
    if (result.numFound === 0) {
      console.log("No existing jobs to backup.");
      return;
    }
    const backup = {
      extractedAt: new Date().toISOString(),
      cif,
      count: result.numFound,
      jobs: result.docs
    };
    fs.writeFileSync("tmp/jobs_existing.json", JSON.stringify(backup, null, 2), "utf-8");
    console.log("\n✅ Saved existing jobs to tmp/jobs_existing.json\n");
  } catch (err) {
    console.error("Failed to extract existing jobs:", err.message);
    process.exit(1);
  }
}

async function runCompanyQuery(args) {
  console.log("=== Query Company in SOLR ===\n");
  const query = args[1] || "company:BMW*";
  console.log(`Query: ${query}`);
  const result = await queryCompanySOLR(query);
  console.log(`Found ${result.numFound} companies`);
  if (result.docs?.length) {
    console.log("\nFirst company:");
    console.log(JSON.stringify(result.docs[0], null, 2));
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("solr.js")) {
  const args = process.argv.slice(2);
  if (args.includes("extract")) {
    const cif = args[1] || null;
    if (!cif) {
      console.error("Error: CIF required. Usage: node solr.js extract <CIF>");
      process.exit(1);
    }
    await runExtract(cif);
  } else if (args.includes("company")) {
    await runCompanyQuery(args);
  } else {
    const cif = args[0] || null;
    if (!cif) {
      console.error("Error: CIF required. Usage: node solr.js <CIF>");
      process.exit(1);
    }
    await runVerification(cif);
  }
}
