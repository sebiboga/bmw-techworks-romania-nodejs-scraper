import fetch from "node-fetch";

const SOLR_URL = "https://solr.peviitor.ro/solr/job";
const CIF_CORRECT = "49775344";
const TIMEOUT = 10000;

function getAuth() {
  const auth = process.env.SOLR_AUTH;
  if (!auth) throw new Error("SOLR_AUTH not set in environment");
  return auth;
}

function authHeaders() {
  return {
    "Authorization": "Basic " + Buffer.from(getAuth()).toString("base64"),
    "Content-Type": "application/json",
    "User-Agent": "job_seeker_ro_spider"
  };
}

async function solrQuery(params) {
  const url = `${SOLR_URL}/select?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Solr query error: ${res.status}`);
  return (await res.json()).response;
}

async function solrDelete(query) {
  const res = await fetch(`${SOLR_URL}/update?commit=true`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify({ delete: { query } })
  });
  if (!res.ok) throw new Error(`Solr delete error: ${res.status}`);
}

async function solrReplace(doc) {
  const res = await fetch(`${SOLR_URL}/update?commit=true`, {
    method: "POST", headers: authHeaders(),
    body: JSON.stringify([doc])
  });
  if (!res.ok) throw new Error(`Solr upsert error: ${res.status}`);
}

async function checkUrlValid(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD", timeout: TIMEOUT,
      headers: { "User-Agent": "job_seeker_ro_spider" }
    });
    return { valid: res.ok, status: res.status };
  } catch {
    return { valid: false, status: 0 };
  }
}

function isJobUrl(url) {
  if (!url) return false;
  return url.includes("careers.bmwtechworks.ro/jobs/") ||
         url.includes("jobviewtrack.com") ||
         url.includes("mediere.anofm.ro") ||
         url.includes("bestjobs.eu");
}

export async function fixBmwJobs(companyCorrect, cifCorrect) {
  const COMPANY = companyCorrect || "BMW TECHWORKS ROMANIA S.R.L.";
  const CIF = cifCorrect || CIF_CORRECT;

  console.log("\n=== Fix BMW Company Data ===\n");

  let fixed = 0;
  let deleted404 = 0;
  let alreadyOk = 0;

  const response = await solrQuery({ q: "company:*BMW*TECHWORKS*", rows: 200, wt: "json" });
  const jobs = response.docs || [];
  console.log(`Found ${response.numFound} jobs with company containing "BMW TECHWORKS"`);

  for (const job of jobs) {
    const url = job.url || "";
    const title = job.title || "(unknown)";
    const oldCif = job.cif || "";

    if (oldCif === CIF) {
      console.log(`  OK           | ${title}`);
      alreadyOk++;
      continue;
    }

    const urlCheck = await checkUrlValid(url);
    const urlValid = urlCheck.valid;

    if (!urlValid && isJobUrl(url)) {
      console.log(`  404 DELETED  | ${title}`);
      await solrDelete(`url:"${url}"`);
      deleted404++;
      continue;
    }

    console.log(`  FIXED        | ${title} | ${job.company || ""} | CIF: ${oldCif || "(lipsă)"}`);
    const fixedDoc = { ...job, company: COMPANY, cif: CIF };
    delete fixedDoc._version_;
    await solrReplace(fixedDoc);
    fixed++;
  }

  console.log(`\n=== Fix Summary ===`);
  console.log(`  Total BMW jobs found:    ${jobs.length}`);
  console.log(`  Already correct:         ${alreadyOk}`);
  console.log(`  Fixed (company/cif):     ${fixed}`);
  console.log(`  Deleted (404):           ${deleted404}`);
  console.log(`====================\n`);
}
