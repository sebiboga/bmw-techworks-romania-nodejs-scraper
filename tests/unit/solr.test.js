import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";

const mockFetch = jest.fn();

jest.unstable_mockModule("node-fetch", () => ({
  default: mockFetch
}));

function makeOkResponse(data) {
  return { ok: true, json: async () => data };
}

function makeErrorResponse(status) {
  return { ok: false, status, text: async () => "error" };
}

describe("solr.js", () => {
  let solr;

  beforeAll(async () => {
    process.env.SOLR_AUTH = "test:auth";
    solr = await import("../../solr.js");
  });

  afterAll(() => {
    delete process.env.SOLR_AUTH;
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("getSolrAuth", () => {
    it("should return SOLR_AUTH from environment", () => {
      expect(solr.getSolrAuth()).toBe("test:auth");
    });

    it("should throw if SOLR_AUTH is not set", () => {
      const saved = process.env.SOLR_AUTH;
      delete process.env.SOLR_AUTH;
      expect(() => solr.getSolrAuth()).toThrow("SOLR_AUTH not set");
      process.env.SOLR_AUTH = saved;
    });
  });

  describe("querySOLR", () => {
    it("should query Solr by CIF", async () => {
      mockFetch.mockResolvedValue(makeOkResponse({
        response: { numFound: 1, docs: [{ cif: "49775344" }] }
      }));

      const result = await solr.querySOLR("49775344");
      expect(result.numFound).toBe(1);
      expect(result.docs[0].cif).toBe("49775344");
    });

    it("should throw on error response", async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(500));
      await expect(solr.querySOLR("49775344")).rejects.toThrow("SOLR query error");
    });
  });

  describe("upsertJobs", () => {
    it("should upsert jobs to Solr", async () => {
      mockFetch.mockResolvedValue(makeOkResponse({ responseHeader: { status: 0 } }));
      await expect(solr.upsertJobs([{ title: "Test" }])).resolves.not.toThrow();
    });

    it("should throw on error", async () => {
      mockFetch.mockResolvedValue(makeErrorResponse(500));
      await expect(solr.upsertJobs([{ title: "Test" }])).rejects.toThrow("SOLR upsert error");
    });
  });

  describe("deleteJobsByCIF", () => {
    it("should delete jobs by CIF", async () => {
      mockFetch.mockResolvedValue(makeOkResponse({}));
      await expect(solr.deleteJobsByCIF("49775344")).resolves.not.toThrow();
    });
  });

  describe("upsertCompany", () => {
    it("should upsert company data", async () => {
      mockFetch.mockResolvedValue(makeOkResponse({}));
      const companyDoc = { id: "49775344", company: "BMW TECHWORKS ROMANIA SRL", brand: "BMW TechWorks Romania", status: "activ" };
      await expect(solr.upsertCompany(companyDoc)).resolves.not.toThrow();
    });
  });
});
