import { parse } from "date-fns";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test, vi, MockedFunction } from "vitest";
import { useGAPIStore } from "../../src/store/gapi";
import { positionsDto, positionsRaw } from "./rowdata/positions";
import { presenceDto, presenceRaw } from "./rowdata/presence";

vi.mock("vue-router", () => {
  return {
    useRoute: () => ({
      params: { id: "123" },
    }),
  };
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
vi.stubGlobal("localStorage", localStorageMock);

// Mock Google Identity Services
const mockTokenClient = {
  requestAccessToken: vi.fn()
};

const mockInitTokenClient = vi.fn().mockReturnValue(mockTokenClient);
const mockRevoke = vi.fn((token: string, callback?: () => void) => {
  if (callback) callback();
});

// Mock One Tap functions
const mockInitialize = vi.fn();
const mockPrompt = vi.fn();

const googleMock = {
  accounts: {
    oauth2: {
      initTokenClient: mockInitTokenClient,
      revoke: mockRevoke
    },
    id: {
      initialize: mockInitialize,
      prompt: mockPrompt
    }
  }
};

vi.stubGlobal("google", googleMock);

// Mock fetch for Google Sheets API calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("google api client store tests", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
    localStorageMock.clear.mockImplementation(() => {});
    
    // Setup fetch mock to return empty values by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ values: [] })
    });
  });

  test("gapi store can be instantiated and has required functions", () => {
    const gapi = useGAPIStore();
    
    // Basic test to verify store exists and has expected properties
    expect(gapi).toBeDefined();
    expect(typeof gapi.updateSheetValues).toBe("function");
    expect(typeof gapi.batchUpdateSheetValues).toBe("function");
    expect(gapi.SHEETS).toBeDefined();
    expect(gapi.TITLES).toBeDefined();
  });

  test("gapi store load initializes token client and One Tap", async () => {
    const store = useGAPIStore();

    await store.load();

    expect(mockInitTokenClient).toHaveBeenCalledWith({
      client_id: expect.any(String),
      scope: expect.any(String),
      callback: expect.any(Function),
    });

    expect(mockInitialize).toHaveBeenCalledWith({
      client_id: expect.any(String),
      callback: expect.any(Function),
      auto_prompt: true,
      cancel_on_tap_outside: false,
    });

    // Verify that the One Tap callback handles user info correctly
    const oneTapCallback = (mockInitialize as any).mock.calls[0]?.[0]?.callback;
    if (oneTapCallback) {
      // Mock JWT payload
      const mockJWT = 'header.' + btoa(JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/avatar.jpg'
      })) + '.signature';

      oneTapCallback({ credential: mockJWT, select_by: 'user' });

      // Should store user info but not immediately request access token
      expect(store.userInfo).toEqual({
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/avatar.jpg'
      });
    }
  });

  test("login calls token client requestAccessToken", async () => {
    // Create a new store instance for this test
    const store = useGAPIStore();
    
    // Mock initTokenClient to capture the call and ensure our mock is properly set
    let capturedTokenClient: any = null;
    mockInitTokenClient.mockImplementation((config: any) => {
      capturedTokenClient = mockTokenClient;
      return mockTokenClient;
    });

    await store.load();

    // Ensure the token client was created
    expect(mockInitTokenClient).toHaveBeenCalled();
    expect(capturedTokenClient).toBe(mockTokenClient);

    // Wait a bit for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now test the login
    store.login();

    expect(mockTokenClient.requestAccessToken).toHaveBeenCalledWith({ prompt: 'consent' });
  });

  test("requestApiAccess calls token client requestAccessToken", async () => {
    const store = useGAPIStore();
    
    // Ensure mockInitTokenClient properly returns our mock
    let capturedTokenClient: any = null;
    mockInitTokenClient.mockImplementation((config: any) => {
      capturedTokenClient = mockTokenClient;
      return mockTokenClient;
    });

    await store.load();

    // Ensure the token client was created
    expect(mockInitTokenClient).toHaveBeenCalled();
    expect(capturedTokenClient).toBe(mockTokenClient);
    
    // Wait a bit for async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Reset the requestAccessToken mock to ensure clean state
    mockTokenClient.requestAccessToken.mockClear();

    store.requestApiAccess();

    expect(mockTokenClient.requestAccessToken).toHaveBeenCalledWith({ prompt: 'consent' });
  });

  test("triggerOneTap calls google.accounts.id.prompt", async () => {
    const store = useGAPIStore();
    await store.load();

    // Reset the prompt mock to ensure clean state
    mockPrompt.mockClear();

    store.triggerOneTap();

    expect(mockPrompt).toHaveBeenCalled();
  });

  test("logout revokes token", async () => {
    const store = useGAPIStore();
    await store.load();

    // Get the callback from the first call to initTokenClient and trigger authentication
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    expect(store.isSignedIn).toBe(true);

    store.logout();

    expect(mockRevoke).toHaveBeenCalledWith('test-token', expect.any(Function));
    expect(store.isSignedIn).toBe(false);
    
    // Verify localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('google_access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('google_token_expiry');
  });

  test("load of settings", async () => {
    const soldiersMaxAmountMock = 42;
    const presenceNameColumnMock = 4;
    const presenceNameFirstRowMock = 20;
    
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            values: [
              [, presenceNameColumnMock, , , , soldiersMaxAmountMock],
              [, presenceNameFirstRowMock, , , ,],
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ values: [] })
      });
    });

    const store = useGAPIStore();
    await store.load();

    // Get the callback from the first call to initTokenClient and trigger authentication
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    expect(store.settings.soldiersMaxAmount).toBe(soldiersMaxAmountMock);
    expect(store.settings.presenceNameColumn).toBe(presenceNameColumnMock);
    expect(store.settings.presenceNameFirstRow).toBe(presenceNameFirstRowMock);
    
    // Verify token was stored in localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('google_access_token', 'test-token');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('google_token_expiry', expect.any(String));
  });

  test("load of soldiers", async () => {
    const mockData = {
      id: 121212,
      name: "משה אופניק",
      role: "לוחם",
      platoon: 1,
      description: "משה אופניק [לוחם] 1",
    };
    
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            values: [[, 2, , , , 200], [, 13, , , ,]]
          })
        });
      }
      if (url.includes('%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D') || url.includes('חיילים')) { // soldiers sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            values: [
              [
                mockData.id,
                mockData.name,
                mockData.platoon,
                mockData.role,
                mockData.description,
              ],
            ],
          }),
        });
      }
      if (url.includes('%D7%A2%D7%9E%D7%93%D7%95%D7%AA') || url.includes('עמדות')) { // positions sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ values: [] })
        });
      }
      if (url.includes('%D7%A0%D7%95%D7%9B%D7%97%D7%95%D7%AA') || url.includes('נוכחות')) { // presence sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ values: [] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ values: [] })
      });
    });

    const store = useGAPIStore();
    await store.load();

    // Get the callback from the first call to initTokenClient and trigger authentication
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    expect(store.soldiers).toStrictEqual([
      {
        id: mockData.id + "",
        name: mockData.name,
        role: mockData.role,
        platoon: mockData.platoon + "",
        description: mockData.description,
      },
    ]);
  });

  test("load of positions", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            values: [[, 2, , , , 200], [, 13, , , ,]]
          })
        });
      }
      if (url.includes('%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D') || url.includes('חיילים')) { // soldiers sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ values: [] })
        });
      }
      if (url.includes('%D7%A2%D7%9E%D7%93%D7%95%D7%AA') || url.includes('עמדות')) { // positions sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            values: positionsRaw
          })
        });
      }
      if (url.includes('%D7%A0%D7%95%D7%9B%D7%97%D7%95%D7%AA') || url.includes('נוכחות')) { // presence sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ values: [] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ values: [] })
      });
    });

    const store = useGAPIStore();
    await store.load();

    // Get the callback from the first call to initTokenClient and trigger authentication
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    expect(store.positions).toStrictEqual(positionsDto);
  });

  test("load of presence", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            values: [[, 2, , , , 200], [, 13, , , ,]]
          })
        });
      }
      if (url.includes('%D7%97%D7%99%D7%99%D7%9C%D7%99%D7%9D') || url.includes('חיילים')) { // soldiers sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            values: [
              ["123", "משה אופניק", "1", "לוחם", "משה אופניק [לוחם] 1"],
              ["456", "בוב ספוג", "2", "לוחם", "בוב ספוג [לוחם] 2"],
              ["789", "ג׳ורג קוסטנזה", "מפלג", "סמבצ", "ג׳ורג קוסטנזה [סמבצ] מפלג"],
            ]
          })
        });
      }
      if (url.includes('%D7%A2%D7%9E%D7%93%D7%95%D7%AA') || url.includes('עמדות')) { // positions sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ values: [] })
        });
      }
      if (url.includes('%D7%A0%D7%95%D7%9B%D7%97%D7%95%D7%AA') || url.includes('נוכחות')) { // presence sheet
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            values: presenceRaw
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ values: [] })
      });
    });

    const store = useGAPIStore();
    await store.load();

    // Get the callback from the first call to initTokenClient and trigger authentication
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    expect(store.presence.soldiersPresence).toStrictEqual(presenceDto);
  });

  test("token persistence - restores from localStorage", async () => {
    // Mock stored token
    const storedToken = 'stored-test-token';
    const futureTime = Date.now() + 3600000; // 1 hour from now
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'google_access_token') return storedToken;
      if (key === 'google_token_expiry') return futureTime.toString();
      return null;
    });

    // Mock successful token validation
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    });

    const store = useGAPIStore();
    await store.load();

    // Should restore from localStorage without new authentication
    expect(store.isSignedIn).toBe(true);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('google_access_token');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('google_token_expiry');
  });

  test("token persistence - clears expired token", async () => {
    // Mock expired token
    const expiredToken = 'expired-test-token';
    const pastTime = Date.now() - 1000; // 1 second ago
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'google_access_token') return expiredToken;
      if (key === 'google_token_expiry') return pastTime.toString();
      return null;
    });

    const store = useGAPIStore();
    await store.load();

    // Should clear expired token
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('google_access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('google_token_expiry');
    expect(store.isSignedIn).toBe(false);
  });

  test("generateSheetNameFromDate formats date correctly", () => {
    const store = useGAPIStore();
    
    // Test with a specific date
    const testDate = new Date(2024, 10, 4); // November 4, 2024 (month is 0-based)
    const result = store.generateSheetNameFromDate(testDate);
    
    expect(result).toBe("שבצק-04.11.24");
  });

  test("getCurrentSheetName returns template name when no date provided", () => {
    const store = useGAPIStore();
    
    const result = store.getCurrentSheetName();
    
    expect(result).toBe("עמדות");
  });

  test("getCurrentSheetName returns date-specific name when date provided", () => {
    const store = useGAPIStore();
    
    const testDate = new Date(2024, 11, 25); // December 25, 2024
    const result = store.getCurrentSheetName(testDate);
    
    expect(result).toBe("שבצק-25.12.24");
  });

  test("getSheetIdByName returns sheet ID when sheet exists", async () => {
    const store = useGAPIStore();
    
    // Initialize the store first
    await store.load();
    
    // Mock successful authentication by triggering the callback
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    // Mock fetch response with sheet properties
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        sheets: [
          { properties: { sheetId: 123, title: "עמדות" } },
          { properties: { sheetId: 456, title: "שבצק-04.11.24" } }
        ]
      })
    });

    const result = await store.getSheetIdByName("שבצק-04.11.24");
    
    expect(result).toBe(456);
  });

  test("getSheetIdByName returns null when sheet doesn't exist", async () => {
    const store = useGAPIStore();
    
    // Initialize the store first
    await store.load();
    
    // Mock successful authentication by triggering the callback
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    // Mock fetch response with sheet properties
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        sheets: [
          { properties: { sheetId: 123, title: "עמדות" } }
        ]
      })
    });

    const result = await store.getSheetIdByName("שבצק-99.99.99");
    
    expect(result).toBe(null);
  });

  test("checkSheetExists returns true when sheet exists", async () => {
    const store = useGAPIStore();
    
    // Initialize the store first
    await store.load();
    
    // Mock successful authentication by triggering the callback
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    // Mock fetch response with sheet properties
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        sheets: [
          { properties: { sheetId: 123, title: "עמדות" } },
          { properties: { sheetId: 456, title: "שבצק-04.11.24" } }
        ]
      })
    });

    const result = await store.checkSheetExists("שבצק-04.11.24");
    
    expect(result).toBe(true);
  });

  test("checkSheetExists returns false when sheet doesn't exist", async () => {
    const store = useGAPIStore();
    
    // Initialize the store first
    await store.load();
    
    // Mock successful authentication by triggering the callback
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    // Mock fetch response with sheet properties
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        sheets: [
          { properties: { sheetId: 123, title: "עמדות" } }
        ]
      })
    });

    const result = await store.checkSheetExists("שבצק-99.99.99");
    
    expect(result).toBe(false);
  });

  test("duplicateSheet creates new sheet at the end", async () => {
    const store = useGAPIStore();
    
    // Initialize the store first
    await store.load();
    
    // Mock successful authentication by triggering the callback
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    // Reset mock to count only the calls we care about
    mockFetch.mockClear();

    // Mock fetch responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sheets: [
            { properties: { sheetId: 123, title: "עמדות" } },
            { properties: { sheetId: 456, title: "existing-sheet" } }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

    await store.duplicateSheet("עמדות", "שבצק-04.11.24");
    
    // Verify the duplicate request was made correctly
    expect(mockFetch).toHaveBeenNthCalledWith(2, 
      expect.stringContaining("batchUpdate"),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          requests: [{
            duplicateSheet: {
              sourceSheetId: 123,
              newSheetName: "שבצק-04.11.24",
              insertSheetIndex: 2 // Should be at the end (after 2 existing sheets)
            }
          }]
        })
      })
    );
  });

  test("loadPositionsForDate creates sheet if it doesn't exist", async () => {
    const store = useGAPIStore();
    
    // Initialize the store first
    await store.load();
    
    // Mock successful authentication by triggering the callback
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    // Reset mock to count only the calls we care about
    mockFetch.mockClear();

    const testDate = new Date(2024, 10, 4); // November 4, 2024

    // Mock sequence of fetch calls:
    // 1. Check if sheet exists (returns empty sheets - doesn't exist)
    // 2. Get sheet info for duplication (source sheet exists)
    // 3. Duplicate sheet
    // 4. Load positions from new sheet
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sheets: [
            { properties: { sheetId: 123, title: "עמדות" } }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sheets: [
            { properties: { sheetId: 123, title: "עמדות" } }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          values: positionsRaw
        })
      });

    await store.loadPositionsForDate(testDate);
    
    // Should have called duplicateSheet and then loaded positions
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(store.positions).toHaveLength(positionsDto.length);
  });

  test("loadPositionsForDate loads from existing sheet when it exists", async () => {
    const store = useGAPIStore();
    
    // Initialize the store first
    await store.load();
    
    // Mock successful authentication by triggering the callback
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    // Reset mock to count only the calls we care about
    mockFetch.mockClear();

    const testDate = new Date(2024, 10, 4); // November 4, 2024

    // Mock sequence of fetch calls:
    // 1. Check if sheet exists (returns the sheet - exists)
    // 2. Load positions from existing sheet
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sheets: [
            { properties: { sheetId: 123, title: "עמדות" } },
            { properties: { sheetId: 456, title: "שבצק-04.11.24" } }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          values: positionsRaw
        })
      });

    await store.loadPositionsForDate(testDate);
    
    // Should have skipped duplication and just loaded positions
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(store.positions).toHaveLength(positionsDto.length);
  });

  test("loadPositionsForDate falls back to template sheet on error", async () => {
    const store = useGAPIStore();
    
    // Initialize the store first
    await store.load();
    
    // Mock successful authentication by triggering the callback
    const callback = (mockInitTokenClient as any).mock.calls[0]?.[0]?.callback;
    if (callback) {
      await callback({ access_token: 'test-token', token_type: 'Bearer', expires_in: 3600 });
    }

    // Reset mock to count only the calls we care about
    mockFetch.mockClear();

    const testDate = new Date(2024, 10, 4); // November 4, 2024

    // Mock sequence of fetch calls:
    // 1. Check if sheet exists (fails)
    // 2. Try to get sheet info for duplication (fails)
    // 3. Load from template sheet (fallback - succeeds)
    mockFetch
      .mockRejectedValueOnce(new Error("API Error"))
      .mockRejectedValueOnce(new Error("API Error"))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          values: positionsRaw
        })
      });

    await store.loadPositionsForDate(testDate);
    
    // Should have attempted check, attempted duplication, then fallen back to template sheet
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(store.positions).toHaveLength(positionsDto.length);
  });
});
