import { jest, describe, it, expect, beforeAll } from "@jest/globals";
import { fetchJobsFeed, mapToJobModel, extractTags } from "../../index.js";

beforeAll(() => {
  jest.setTimeout(30000);
});

describe("Integration: BMW scraper workflow", () => {
  it("should fetch feed and map all items to job model", async () => {
    const feed = await fetchJobsFeed();
    const items = feed.items || [];
    expect(items.length).toBeGreaterThan(0);

    const jobs = items.map(item =>
      mapToJobModel(item, "49775344", "BMW TECHWORKS ROMANIA SRL")
    );

    const urls = jobs.map(j => j.url);
    expect(new Set(urls).size).toBe(jobs.length);

    for (const job of jobs) {
      expect(job.title).toBeTruthy();
      expect(job.url).toContain("careers.bmwtechworks.ro");
      expect(job.company).toBe("BMW TECHWORKS ROMANIA SRL");
      expect(job.cif).toBe("49775344");
      expect(job.workmode).toBe("hybrid");
    }
  });

  it("should extract relevant tags for known job titles", () => {
    const testCases = [
      { title: "Senior Angular Developer", expectedTags: ["senior", "javascript"] },
      { title: "SAP ABAP Developer", expectedTags: ["sap"] },
      { title: "MLOps with AWS", expectedTags: ["mlops", "cloud"] },
      { title: "Platform Engineer with Azure", expectedTags: ["cloud"] },
      { title: "Salesforce Developer UPSKILL", expectedTags: ["salesforce"] },
    ];

    for (const { title, expectedTags } of testCases) {
      const tags = extractTags(title, "");
      for (const tag of expectedTags) {
        expect(tags).toContain(tag);
      }
    }
  });
});
