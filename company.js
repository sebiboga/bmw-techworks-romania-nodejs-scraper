import fetch from "node-fetch";
import fs from "fs";
import { querySOLR, deleteJobsByCIF } from "./solr.js";
import { getCompanyFromANAF, searchCompany } from "./src/anaf.js";

const Peviitor_API_URL = "https://api.peviitor.ro/v1/company/";
const COMPANY_BRAND = "BMW TechWorks Romania";
const COMPANY_CIF_FALLBACK = "49775344";

export function getCompanyBrand() {
  return COMPANY_BRAND;
}

const COMPANY_MODEL_FIELDS = [
  { name: "id", required: true, type: "string" },
  { name: "company", required: true, type: "string" },
  { name: "brand", required: false, type: "string" },
  { name: "group", required: false, type: "string" },
  { name: "status", required: false, type: "string", allowed: ["activ", "suspendat", "inactiv", "radiat"] },
  { name: "location", required: false, type: "array" },
  { name: "website", required: false, type: "array" },
  { name: "career", required: false, type: "array" },
  { name: "lastScraped", required: false, type: "string" },
  { name: "scraperFile", required: false, type: "string" }
];

async function getCompanyFromPeviitor() {
  const url = `${Peviitor_API_URL}?name=${encodeURIComponent(COMPANY_BRAND)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "job_seeker_ro_spider" }
  });
  if (!res.ok) throw new Error(`Peviitor API error: ${res.status}`);
  const data = await res.json();
  return data.companies?.[0] || null;
}

function saveCompanyData(anafData, peviitorData) {
  const companyData = {
    validatedAt: new Date().toISOString(),
    source: "ANAF",
    brand: COMPANY_BRAND,
    anaf: anafData,
    peviitor: peviitorData,
    summary: {
      company: anafData?.name || null,
      cif: anafData?.cui?.toString() || null,
      active: !anafData?.inactive,
      address: anafData?.address || null
    }
  };
  fs.mkdirSync("tmp", { recursive: true });
  fs.writeFileSync("tmp/company.json", JSON.stringify(companyData, null, 2), "utf-8");
  console.log("\nSaved company data to tmp/company.json\n");
  return companyData;
}

function loadCachedCompanyData() {
  if (fs.existsSync("tmp/company.json")) {
    try {
      const data = JSON.parse(fs.readFileSync("tmp/company.json", "utf-8"));
      if (data?.anaf?.cui && data?.anaf?.name) {
        return data;
      }
    } catch (e) {
      console.log("Warning: Could not load cached company data");
    }
  }
  return null;
}

async function getCompanyData() {
  const cachedData = loadCachedCompanyData();
  if (cachedData?.summary?.cif) {
    console.log(`Using cached company data for CIF: ${cachedData.summary.cif}`);
    const anafData = cachedData.anaf;
    console.log(`Cached name: ${anafData.name}`);
    console.log(`Cached CUI: ${anafData.cui}`);
    console.log(`Cached status: ${anafData.inactive ? "INACTIVE" : "ACTIVE"}`);
    return {
      company: anafData.name.toUpperCase(),
      cif: anafData.cui.toString(),
      active: !anafData.inactive,
      anafData
    };
  }

  console.log(`=== Step 2: Search DemoANAF by brand ===\n`);
  console.log(`Searching for: "${COMPANY_BRAND}"`);
  const searchResults = await searchCompany(COMPANY_BRAND);
  const bestMatch = searchResults?.[0];
  if (!bestMatch || !bestMatch.cui) {
    throw new Error(`Company not found in DemoANAF: "${COMPANY_BRAND}"`);
  }
  const discoveredCif = bestMatch.cui.toString();
  console.log(`Found: ${bestMatch.name} (CIF: ${discoveredCif})`);

  console.log(`\n=== Step 3: Get company details from ANAF ===\n`);
  console.log(`Fetching details for CIF: ${discoveredCif}`);
  const anafData = await getCompanyFromANAF(discoveredCif);
  if (!anafData) throw new Error("No data from ANAF");
  if (!anafData.name) throw new Error("ANAF returned no company name");

  console.log(`ANAF returned name: ${anafData.name}`);
  console.log(`ANAF returned CUI: ${anafData.cui}`);
  console.log(`ANAF status: ${anafData.inactive ? "INACTIVE" : "ACTIVE"}`);

  return {
    company: anafData.name.toUpperCase(),
    cif: anafData.cui.toString(),
    active: !anafData.inactive,
    anafData
  };
}

export async function validateAndGetCompany() {
  console.log("=== Step 1: Validate company via ANAF ===\n");
  const { company, cif, active, anafData } = await getCompanyData();

  console.log("\n=== Step 4: Validate via Peviitor ===\n");
  let peviitorData = null;
  try {
    peviitorData = await getCompanyFromPeviitor();
    console.log("Peviitor data fetched successfully");
  } catch (e) {
    console.log("Peviitor API error:", e.message);
  }

  console.log("\n=== Step 5: Check existing jobs in SOLR ===\n");
  const solrResult = await querySOLR(cif);
  console.log(`Jobs found in SOLR for CIF ${cif}: ${solrResult.numFound}`);

  saveCompanyData(anafData, peviitorData);

  if (!active) {
    console.log("\nCompany is INACTIVE in ANAF - deleting jobs from SOLR");
    if (solrResult.numFound > 0) {
      await deleteJobsByCIF(cif);
    }
    return { status: "inactive", company, cif, existingJobsCount: solrResult.numFound };
  }

  const address = anafData?.address || anafData?.headquartersAddress?.locality || "";

  console.log(`\nCompany validated: ${company}, CIF: ${cif}`);
  console.log("Ready to scrape jobs...\n");

  return { status: "active", company, cif, existingJobsCount: solrResult.numFound, address, anafData };
}
