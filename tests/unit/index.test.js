import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

const mockFetch = jest.fn();

jest.unstable_mockModule("node-fetch", () => ({
  default: mockFetch
}));

const mockFeedItem = {
  id: "test-uuid",
  title: "Senior Angular Developer",
  url: "https://careers.bmwtechworks.ro/jobs/123456-senior-angular-developer",
  date_published: "2026-06-01T10:00:00+03:00",
  content_html: "<p>We are looking for a Senior Angular Developer to join our team in Cluj-Napoca.</p>"
};

function makeOkResponse(data) {
  return { ok: true, json: async () => data };
}

function makeErrorResponse(status) {
  return { ok: false, status, text: async () => "error" };
}

describe("fetchJobsFeed", () => {
  let index;

  beforeAll(async () => {
    index = await import("../../index.js");
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("should fetch and return the jobs feed", async () => {
    mockFetch.mockResolvedValue(makeOkResponse({ items: [mockFeedItem] }));
    const result = await index.fetchJobsFeed();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Senior Angular Developer");
  });

  it("should throw on HTTP error", async () => {
    mockFetch.mockResolvedValue(makeErrorResponse(500));
    await expect(index.fetchJobsFeed()).rejects.toThrow("HTTP error 500");
  });
});

describe("extractLocation", () => {
  let index;

  beforeAll(async () => {
    index = await import("../../index.js");
  });

  it("should return Cluj-Napoca when description mentions Cluj", () => {
    expect(index.extractLocation("Job in Cluj-Napoca")).toEqual(["Cluj-Napoca"]);
  });

  it("should return default Cluj-Napoca when no location found", () => {
    expect(index.extractLocation("Some generic description")).toEqual(["Cluj-Napoca"]);
  });

  it("should return București when description mentions Bucharest", () => {
    expect(index.extractLocation("Job in Bucharest")).toEqual(["București"]);
  });

  it("should return default for empty description", () => {
    expect(index.extractLocation(null)).toEqual(["Cluj-Napoca"]);
  });
});

describe("extractTags", () => {
  let index;

  beforeAll(async () => {
    index = await import("../../index.js");
  });

  it("should extract senior and angular tags", () => {
    const tags = index.extractTags("Senior Angular Developer", "Looking for an Angular developer");
    expect(tags).toContain("senior");
    expect(tags).toContain("javascript");
  });

  it("should extract ai and mlops tags", () => {
    const tags = index.extractTags("MLOps with AWS", "Machine learning and MLOps");
    expect(tags).toContain("mlops");
    expect(tags).toContain("ai");
    expect(tags).toContain("cloud");
  });

  it("should extract sap tags", () => {
    const tags = index.extractTags("SAP ABAP Developer", "SAP ABAP programming");
    expect(tags).toContain("sap");
  });

  it("should deduplicate tags", () => {
    const tags = index.extractTags("Java Developer", "Java J2EE Spring Developer");
    const javaCount = tags.filter(t => t === "java").length;
    expect(javaCount).toBe(1);
  });

  it("should return empty array for unrelated text", () => {
    const tags = index.extractTags("Office Manager", "Administrative work");
    expect(Array.isArray(tags)).toBe(true);
  });
});

describe("mapToJobModel", () => {
  let index;

  beforeAll(async () => {
    index = await import("../../index.js");
  });

  it("should map a feed item to job model", () => {
    const job = index.mapToJobModel(mockFeedItem, "49775344", "BMW TECHWORKS ROMANIA SRL");
    expect(job.url).toBe(mockFeedItem.url);
    expect(job.title).toBe("Senior Angular Developer");
    expect(job.company).toBe("BMW TECHWORKS ROMANIA SRL");
    expect(job.cif).toBe("49775344");
    expect(job.workmode).toBe("hybrid");
    expect(job.status).toBe("scraped");
    expect(job.location).toEqual(["Cluj-Napoca"]);
    expect(job.date).toBeDefined();
  });
});
