import { jest } from '@jest/globals';

const mockFetch = jest.fn();

jest.unstable_mockModule('node-fetch', () => ({
  default: mockFetch
}));

function anafSearchResponse(results) {
  return {
    ok: true,
    json: async () => ({ data: results, success: true })
  };
}

function anafCompanyResponse(data) {
  return {
    ok: true,
    json: async () => ({ data, success: true })
  };
}

function errorResponse(status) {
  return {
    ok: false,
    status,
    text: async () => 'Error'
  };
}

const ANAF_RECORD = {
  cui: 49775344,
  name: 'BMW TECHWORKS ROMANIA S.R.L.',
  address: 'PLOIEŞTI, 9, Municipiul Cluj-Napoca, Cluj',
  caenCode: '6210',
  inactive: false,
  registrationNumber: 'J2024001389126',
  vatRegistered: true,
  onrcStatusLabel: 'Funcțiune',
  legalForm: 'SRL'
};

const CACHED_DATA = {
  cui: 49775344,
  name: 'BMW TECHWORKS ROMANIA S.R.L.',
  address: 'PLOIEŞTI, 9, Municipiul Cluj-Napoca, Cluj',
  registrationNumber: 'J2024001389126',
  caenCode: '6210',
  inactive: false,
  onrcStatusLabel: 'Funcțiune',
  administrators: [{ name: 'HAUS MARIAN ILIE', role: 'administrator' }],
  authorizedCaenCodes: ['6039', '6210', '6220', '6290', '6310', '6391', '7112']
};

describe('src/anaf.js', () => {
  let anaf;

  beforeAll(async () => {
    anaf = await import('../../src/anaf.js');
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('searchCompany', () => {
    it('should return array of companies for valid brand', async () => {
      mockFetch.mockResolvedValue(anafSearchResponse([
        { cui: 49775344, name: 'BMW TECHWORKS ROMANIA S.R.L.', statusLabel: 'Funcțiune' }
      ]));

      const results = await anaf.searchCompany('BMW TechWorks');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('cui');
      expect(results[0]).toHaveProperty('name');
    });

    it('should return empty array for non-existent brand', async () => {
      mockFetch.mockResolvedValue(anafSearchResponse([]));

      const results = await anaf.searchCompany('NonExistentBrandXYZ123');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should include statusLabel in results', async () => {
      mockFetch.mockResolvedValue(anafSearchResponse([
        { cui: 49775344, name: 'BMW TECHWORKS ROMANIA S.R.L.', statusLabel: 'Funcțiune' }
      ]));

      const results = await anaf.searchCompany('BMW TechWorks');

      expect(results[0]).toHaveProperty('statusLabel', 'Funcțiune');
    });

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue(errorResponse(500));

      await expect(anaf.searchCompany('BMW TechWorks')).rejects.toThrow('ANAF search error: 500');
    });

    it('should encode brand name in URL', async () => {
      let capturedUrl;
      mockFetch.mockImplementation((url) => {
        capturedUrl = url;
        return Promise.resolve(anafSearchResponse([]));
      });

      await anaf.searchCompany('BMW TechWorks');
      expect(capturedUrl).toContain(encodeURIComponent('BMW TechWorks'));
    });
  });

  describe('getCompanyFromANAF', () => {
    it('should return company data for valid CIF', async () => {
      mockFetch.mockResolvedValue(anafCompanyResponse(ANAF_RECORD));

      const data = await anaf.getCompanyFromANAF('49775344');

      expect(data).toBeDefined();
      expect(data.cui).toBe(49775344);
      expect(data.name).toBe('BMW TECHWORKS ROMANIA S.R.L.');
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('registrationNumber');
    });

    it('should retry on HTTP error then succeed', async () => {
      mockFetch
        .mockResolvedValueOnce(errorResponse(500))
        .mockResolvedValueOnce(anafCompanyResponse(ANAF_RECORD));

      const data = await anaf.getCompanyFromANAF('49775344');

      expect(data).toBeDefined();
      expect(data.cui).toBe(49775344);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw after exhausting retries', async () => {
      mockFetch.mockResolvedValue(errorResponse(500));

      await expect(anaf.getCompanyFromANAF('49775344')).rejects.toThrow();
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle API-level error response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, error: { message: 'Company not found' } })
      });

      await expect(anaf.getCompanyFromANAF('00000000')).rejects.toThrow();
    });

    it('should return null when data is null', async () => {
      mockFetch.mockResolvedValue(anafCompanyResponse(null));

      const data = await anaf.getCompanyFromANAF('49775344');
      expect(data).toBeNull();
    });
  });

  describe('getCompanyFromANAFWithFallback', () => {
    it('should return fresh data when API works', async () => {
      mockFetch.mockResolvedValue(anafCompanyResponse(ANAF_RECORD));

      const data = await anaf.getCompanyFromANAFWithFallback('49775344');

      expect(data.name).toBe('BMW TECHWORKS ROMANIA S.R.L.');
    });

    it('should use cached data when API fails', async () => {
      mockFetch.mockResolvedValue(errorResponse(500));

      const data = await anaf.getCompanyFromANAFWithFallback('49775344', CACHED_DATA);

      expect(data).toEqual(CACHED_DATA);
    });

    it('should throw when API fails and no cache available', async () => {
      mockFetch.mockResolvedValue(errorResponse(500));

      await expect(anaf.getCompanyFromANAFWithFallback('49775344')).rejects.toThrow();
    });
  });
});
