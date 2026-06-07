import fetch from "node-fetch";
import fs from "fs";
import { fileURLToPath } from "url";
import { validateAndGetCompany } from "./company.js";
import { querySOLR, upsertJobs, upsertCompany } from "./solr.js";
import { fixBmwJobs } from "./fix-bmw-data.js";

const COMPANY_CIF = "49775344";
const COMPANY_BRAND = "BMW TechWorks Romania";
const JOB_FEED_URL = "https://careers.bmwtechworks.ro/jobs.json";

let COMPANY_NAME = null;

async function fetchJobsFeed() {
  const res = await fetch(JOB_FEED_URL, {
    headers: {
      "User-Agent": "job_seeker_ro_spider",
      "Accept": "application/json"
    }
  });
  if (!res.ok) throw new Error(`HTTP error ${res.status} for ${JOB_FEED_URL}`);
  return await res.json();
}

function extractLocation(description) {
  if (!description) return ["Cluj-Napoca"];
  const lower = description.toLowerCase();
  if (lower.includes("cluj")) return ["Cluj-Napoca"];
  if (lower.includes("bucurești") || lower.includes("bucharest")) return ["București"];
  if (lower.includes("brașov") || lower.includes("brasov")) return ["Brașov"];
  if (lower.includes("timișoara") || lower.includes("timisoara")) return ["Timișoara"];
  if (lower.includes("iași") || lower.includes("iasi")) return ["Iași"];
  return ["Cluj-Napoca"];
}

function extractTags(title, description) {
  const text = `${title} ${description || ""}`.toLowerCase();
  const tags = [];
  const patterns = [
    ["it", /\b(developer|software|engineer|code|programming)\b/],
    ["java", /\b(java|j2ee|spring)\b/],
    ["javascript", /\b(javascript|js|node\.?js|react|angular|vue|typescript)\b/],
    ["python", /\b(python|django|flask)\b/],
    ["dotnet", /\b(\.net|c#|csharp|asp\.net)\b/],
    ["embedded", /\b(embedded|c\+\+|rtos|firmware)\b/],
    ["data", /\b(data|analytics|etl|informatica)\b/],
    ["ai", /\b(machine learning|ml|ai|genai|llm|artificial intelligence)\b/],
    ["devops", /\b(devops|ci\/cd|kubernetes|docker|jenkins)\b/],
    ["cloud", /\b(cloud|azure|aws|gcp|platform engineer)\b/],
    ["automotive", /\b(automotive|auto|mobility)\b/],
    ["salesforce", /\b(salesforce|sfdc)\b/],
    ["sap", /\b(sap|abap)\b/],
    ["security", /\b(security|cybersecurity)\b/],
    ["hr", /\b(hr|recruiter|payroll|human resources)\b/],
    ["finance", /\b(finance|treasury|accounting|payable|receivable)\b/],
    ["management", /\b(manager|lead|chief|head|director)\b/],
    ["senior", /\b(senior|principal|architect)\b/],
    ["mlops", /\b(mlops|mlflow)\b/],
    ["mulesoft", /\b(mulesoft|mule)\b/],
    ["compliance", /\b(compliance|regulatory|legal|risk)\b/],
    ["business-analysis", /\b(business analyst|ba)\b/],
    ["testing", /\b(testing|qa|test)\b/]
  ];
  for (const [tag, pattern] of patterns) {
    if (pattern.test(text)) tags.push(tag);
  }
  return [...new Set(tags)].slice(0, 20);
}

function mapToJobModel(item, cif, companyName) {
  const now = new Date().toISOString();
  const description = item.content_html || "";
  const tags = extractTags(item.title, description);
  const location = extractLocation(description);

  return {
    url: item.url,
    title: item.title,
    company: companyName,
    cif,
    location,
    tags,
    workmode: "hybrid",
    date: now,
    status: "scraped"
  };
}

async function main() {
  try {
    fs.mkdirSync("tmp", { recursive: true });

    console.log("=== Step 1: Validate company via ANAF ===");
    const { company, cif } = await validateAndGetCompany();
    COMPANY_NAME = company;

    try {
      await upsertCompany({
        id: cif,
        company,
        brand: COMPANY_BRAND,
        status: "activ",
        location: ["Cluj-Napoca"],
        website: ["https://www.bmwtechworks.ro"],
        career: ["https://careers.bmwtechworks.ro/jobs"],
        lastScraped: new Date().toISOString().split('T')[0],
        scraperFile: "https://raw.githubusercontent.com/sebiboga/bmw-techworks-romania-nodejs-scraper/master/.github/workflows/scrape.yml"
      });
    } catch (err) {
      console.log(`Note: Could not upsert company: ${err.message}`);
    }

    console.log("\n=== Step 2: Fetch jobs from JSON Feed ===");
    const feed = await fetchJobsFeed();
    const items = feed.items || [];
    console.log(`Found ${items.length} jobs in feed`);

    const jobs = items.map(item => mapToJobModel(item, cif, COMPANY_NAME));

    const payload = {
      source: "careers.bmwtechworks.ro",
      scrapedAt: new Date().toISOString(),
      company: COMPANY_NAME,
      cif,
      jobs
    };

    fs.writeFileSync("tmp/jobs.json", JSON.stringify(payload, null, 2), "utf-8");
    console.log("Saved tmp/jobs.json");

    console.log("\n=== Step 3: Upsert jobs to SOLR ===");
    await upsertJobs(jobs);
    console.log(`✅ Upserted ${jobs.length} jobs to SOLR`);

    const existingResult = await querySOLR(cif);
    console.log(`\n=== SUMMARY ===`);
    console.log(`Jobs collected: ${jobs.length}`);
    console.log(`Jobs in SOLR for CIF ${cif}: ${existingResult.numFound}`);
    console.log(`====================`);

    await fixBmwJobs(COMPANY_NAME, cif);

    console.log("\n=== DONE ===");
    console.log("Scraper completed successfully!");

  } catch (err) {
    console.error("Scraper failed:", err);
    process.exit(1);
  }
}

export { fetchJobsFeed, mapToJobModel, extractLocation, extractTags };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
