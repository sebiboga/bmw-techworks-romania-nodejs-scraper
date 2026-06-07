import { jest, describe, it, expect } from "@jest/globals";
import { fetchJobsFeed, mapToJobModel } from "../../index.js";

beforeAll(() => {
  jest.setTimeout(30000);
});

describe("E2E: BMW Job Feed", () => {
  it("should fetch real jobs from the JSON Feed endpoint", async () => {
    const feed = await fetchJobsFeed();
    expect(feed).toBeDefined();
    expect(feed.items).toBeDefined();
    expect(Array.isArray(feed.items)).toBe(true);
    expect(feed.items.length).toBeGreaterThan(0);
  });

  it("should return jobs with required fields", async () => {
    const feed = await fetchJobsFeed();
    for (const item of feed.items) {
      expect(item.title).toBeDefined();
      expect(item.title).toBeTruthy();
      expect(item.url).toBeDefined();
      expect(item.url).toContain("careers.bmwtechworks.ro/jobs/");
      expect(item.date_published).toBeDefined();
      expect(item.content_html).toBeDefined();
    }
  });

  it("should map to valid job model", async () => {
    const feed = await fetchJobsFeed();
    const item = feed.items[0];
    const job = mapToJobModel(item, "49775344", "BMW TECHWORKS ROMANIA S.R.L.");

    expect(job.url).toBe(item.url);
    expect(job.title).toBe(item.title);
    expect(job.company).toBe("BMW TECHWORKS ROMANIA S.R.L.");
    expect(job.cif).toBe("49775344");
    expect(job.workmode).toBe("hybrid");
    expect(job.status).toBe("scraped");
  });
});
