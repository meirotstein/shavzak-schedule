import { addDays, parse, subDays, format } from "date-fns";
import { defineStore } from "pinia";
import { reactive, ref, readonly, computed } from "vue";
import { useRoute } from "vue-router";
import { SchedulerError } from "../errors/scheduler-error";
import {
  AssignmentDefDto,
  PositionDto,
  PresenceDto,
  SoldierDto,
  SoldierPresenceDto,
} from "../types/client-dto";
import { ShiftHours } from "../types/shift-hours";

export const useGAPIStore = defineStore("gapi", () => {
  const SCOPE =
    "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.metadata.readonly";

  const SHEETS = {
    SETTINGS: "settings",
    SOLDIERS: "חיילים",
    POSITIONS: "עמדות",
    PRESENCE: "נוכחות",
  };

  const TITLES = {
    POSITION: "עמדה",
    ROLE: "תפקיד",
    SHIFT: "משמרת",
    ASSIGNMENT: "שיבוץ",
  };

  const route = useRoute();
  const isSignedIn = ref<boolean>(false);
  const userInfo = ref<{ name?: string; email?: string; picture?: string } | null>(null);
  let accessToken = ref<string>("");
  let tokenClient: google.accounts.oauth2.TokenClient | null = null;
  let tokenExpirationTime: number = 0;

  // Token persistence constants
  const TOKEN_STORAGE_KEY = 'google_access_token';
  const TOKEN_EXPIRY_STORAGE_KEY = 'google_token_expiry';

  const settings = reactive({
    soldiersMaxAmount: 200,
    presenceNameColumn: 2,
    presenceNameFirstRow: 13,
    dayStart: "14:00" as ShiftHours, // Default value, will be overridden from settings sheet H1
  });

  // Separate reactive ref for dayStart to ensure proper reactivity
  const dayStartRef = ref<ShiftHours>("14:00");
  
  // Computed property for dayStart to ensure Vue reactivity tracking
  const dayStartComputed = computed(() => dayStartRef.value);

  const soldiers = reactive<SoldierDto[]>([]);
  const positions = reactive<PositionDto[]>([]);
  const presence = reactive<PresenceDto>({
    start: undefined,
    end: undefined,
    soldiersPresence: {},
  });

  // Track which dates have been loaded to enable incremental loading
  const loadedDates = reactive<Set<string>>(new Set());
  
  // Historical positions storage (keyed by date string for efficient lookup)
  const historicalPositions = reactive<Map<string, PositionDto[]>>(new Map());

  // Track the date currently being processed for assignments
  const currentProcessingDate = ref<Date | null>(null);

  // Flag to prevent template loading during date change operations
  let isDateChangeInProgress = false;

  // Function to set date change in progress state
  function setDateChangeInProgress(inProgress: boolean) {
    isDateChangeInProgress = inProgress;
    console.log(`📅 Date change operation ${inProgress ? 'started' : 'completed'}`);
  }

  // Function to store token in localStorage
  function storeToken(token: string, expiresIn: number) {
    console.log('💾 Storing token in localStorage:', {
      tokenPreview: `${token.substring(0, 20)}...`,
      expiresIn: expiresIn,
      expiresAt: new Date(Date.now() + (expiresIn * 1000)).toLocaleString()
    });
    
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    const expirationTime = Date.now() + (expiresIn * 1000); // Convert seconds to milliseconds
    localStorage.setItem(TOKEN_EXPIRY_STORAGE_KEY, expirationTime.toString());
    tokenExpirationTime = expirationTime;
    accessToken.value = token;
    
    // Also store user info if available
    if (userInfo.value) {
      localStorage.setItem('google_user_info', JSON.stringify(userInfo.value));
    }
    
    console.log('✅ Token and user info stored successfully');
  }

  // Function to retrieve stored token
  function getStoredToken(): string | null {
    console.log('📦 Attempting to retrieve stored token...');
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_STORAGE_KEY);
    const storedUserInfo = localStorage.getItem('google_user_info');
    
    console.log('🔍 Token retrieval results:', {
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'null',
      hasExpiry: !!expiryStr,
      hasUserInfo: !!storedUserInfo
    });
    
    if (!token || !expiryStr) {
      console.log('⚠️ Missing token or expiry data');
      return null;
    }

    const expirationTime = parseInt(expiryStr, 10);
    const now = Date.now();
    const timeUntilExpiry = expirationTime - now;
    const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
    
    console.log('⏰ Token expiry check:', {
      now: new Date(now).toLocaleString(),
      expiresAt: new Date(expirationTime).toLocaleString(),
      minutesUntilExpiry: minutesUntilExpiry,
      isExpiredWithBuffer: now >= (expirationTime - 5 * 60 * 1000)
    });
    
    // Check if token is expired (with 5 minute buffer)
    if (now >= (expirationTime - 5 * 60 * 1000)) {
      console.log('⌛ Token is expired or close to expiry, clearing it');
      clearStoredToken();
      return null;
    }

    // Restore user info if available
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo);
        console.log('👤 Restored user info from storage');
      } catch (error) {
        console.error('Failed to parse stored user info:', error);
      }
    }

    console.log('✅ Token is valid, setting access token');
    tokenExpirationTime = expirationTime;
    accessToken.value = token;
    return token;
  }

  // Function to clear stored token
  function clearStoredToken() {
    console.log('🗑️ Clearing stored token and user info from localStorage');
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_STORAGE_KEY);
    localStorage.removeItem('google_user_info');
    accessToken.value = "";
    tokenExpirationTime = 0;
    userInfo.value = null;
    console.log('✅ Token and user info cleared successfully');
  }

  async function load(): Promise<void> {
    return new Promise((resolve) => {
      // Wait for the GIS SDK to load
      if (typeof google === 'undefined') {
        const checkGoogleLoaded = () => {
          if (typeof google !== 'undefined') {
            initializeTokenClient();
            checkExistingAuth();
            resolve();
          } else {
            setTimeout(checkGoogleLoaded, 100);
          }
        };
        checkGoogleLoaded();
      } else {
        initializeTokenClient();
        checkExistingAuth();
        resolve();
      }
    });
  }

  // Check for existing authentication on page load
  async function checkExistingAuth() {
    console.log('🔍 Checking for existing authentication...');
    const storedToken = getStoredToken();
    if (storedToken) {
      console.log('✅ Found stored token, attempting to restore session');
      console.log('📅 Token expires at:', new Date(tokenExpirationTime).toLocaleString());
      
      // Test the token by making a simple API call
      try {
        await testTokenValidity();
        await updateSignInStatus(true);
        console.log('🎉 Successfully restored authentication from stored token');
        return;
      } catch (error) {
        console.error('❌ Stored token validation failed:', error);
        clearStoredToken();
        await updateSignInStatus(false);
      }
    } else {
      console.log('🚫 No stored token found');
    }
    
    // Only show One Tap if we have no token and no user info
    if (!isSignedIn.value && !userInfo.value) {
      console.log('🔒 No active session or user info, showing One Tap sign-in');
      google.accounts.id.prompt();
    }
  }

  // Test if the current token is still valid
  async function testTokenValidity(): Promise<void> {
    if (!accessToken.value) {
      throw new Error('No access token available');
    }

    console.log('🧪 Testing token validity...');
    
    // First, try a simple API call that doesn't require a specific spreadsheet
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v1/tokeninfo',
        {
          headers: {
            'Authorization': `Bearer ${accessToken.value}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Token info request failed: ${response.status} ${response.statusText}`);
      }

      const tokenInfo = await response.json();
      console.log('🔑 Token validation successful:', {
        audience: tokenInfo.audience,
        scope: tokenInfo.scope,
        expires_in: tokenInfo.expires_in
      });

      // If we have a spreadsheet ID, also test access to it
      const spreadsheetId = route.params.id as string;
      if (spreadsheetId) {
        console.log('📊 Testing spreadsheet access...');
        const sheetResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken.value}`,
            },
          }
        );

        if (!sheetResponse.ok) {
          throw new Error(`Spreadsheet access failed: ${sheetResponse.status} ${sheetResponse.statusText}`);
        }
        console.log('📊 Spreadsheet access confirmed');
      }

    } catch (error) {
      console.error('🚨 Token validation error:', error);
      throw error;
    }
  }

  function initializeTokenClient() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_APP_GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: async (tokenResponse: google.accounts.oauth2.TokenResponse) => {
        if (tokenResponse.error) {
          console.error('Token request failed:', tokenResponse.error);
          await updateSignInStatus(false);
          return;
        }
        
        // Store the token with expiration info
        storeToken(tokenResponse.access_token, tokenResponse.expires_in || 3600);
        await updateSignInStatus(true);
      },
    });

    // Initialize Google One Tap
    initializeOneTap();
  }

  function initializeOneTap() {
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_APP_GOOGLE_CLIENT_ID,
      callback: async (credentialResponse: google.accounts.id.CredentialResponse) => {
        console.log('🔐 One Tap sign-in successful');
        
        // Decode the JWT to get user info
        try {
          const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
          userInfo.value = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture
          };
          console.log('👤 User identified via One Tap:', userInfo.value);
          
          // Automatically request API access after successful One Tap sign-in
          console.log('🔑 Automatically requesting API access after One Tap sign-in');
          if (tokenClient) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
          }
          
        } catch (error) {
          console.error('Could not decode One Tap credential:', error);
        }
      },
      auto_prompt: false,
      cancel_on_tap_outside: false,
    });

  }

  function requestApiAccess() {
    // This function can be called by the UI when user wants to grant API access
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }

  function triggerOneTap() {
    // Manual trigger for One Tap (can be called from UI)
    google.accounts.id.prompt();
  }

  async function loadSettings(): Promise<void> {
    verifyReadiness();

    const settingsRaw = await fetchSheetValues(SHEETS.SETTINGS, "A1", "L50");
    if (!settingsRaw.length) {
      console.error("unexpected settings response");
      return;
    }
    
    settings.soldiersMaxAmount = settingsRaw[0][5];
    settings.presenceNameColumn = settingsRaw[0][1];
    settings.presenceNameFirstRow = settingsRaw[1][1];
    
    // Read dayStart from cell H1 (index 7), fall back to default if not available
    const dayStartFromSheet = settingsRaw[0][7];
    
    if (dayStartFromSheet && typeof dayStartFromSheet === 'string' && dayStartFromSheet.trim()) {
      const newDayStart = dayStartFromSheet.trim() as ShiftHours;
      settings.dayStart = newDayStart;
      dayStartRef.value = newDayStart;

    }
    // If H1 is empty or invalid, keep the default value
  }

  function login() {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }

  function logout() {
    if (accessToken.value) {
      google.accounts.oauth2.revoke(accessToken.value, () => {
        console.log('Access token revoked');
      });
      clearStoredToken();
      updateSignInStatus(false);
      
      // Clear user info as well
      userInfo.value = null;
    }
  }

  async function fetchSheetValues(
    name: string,
    fromCell: string,
    toCell: string
  ) {
    verifyReadiness();
    
    const spreadsheetId = route.params.id as string;
    const range = `${name}!${fromCell}:${toCell}`;
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet values: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.values || [];
  }

  async function updateSheetValues(
    name: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    verifyReadiness();

    const spreadsheetId = route.params.id as string;
    const fullRange = `${name}!${range}`;
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(fullRange)}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update sheet values: ${response.status} ${response.statusText}`);
    }
  }

  async function batchUpdateSheetValues(
    name: string,
    updates: Array<{ range: string; values: any[][] }>
  ): Promise<void> {
    verifyReadiness();

    const spreadsheetId = route.params.id as string;
    
    const data = updates.map((update) => ({
      range: `${name}!${update.range}`,
      values: update.values,
    }));

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: "RAW",
          data: data,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to batch update sheet values: ${response.status} ${response.statusText}`);
    }
  }

  function verifyReadiness() {
    // Check if token has expired
    if (tokenExpirationTime > 0 && Date.now() >= tokenExpirationTime) {
      console.log('Token has expired, clearing stored token');
      clearStoredToken();
      updateSignInStatus(false);
      throw new Error('Access token has expired, please login again');
    }

    if (!isSignedIn.value || !route.params.id || !accessToken.value) {
      throw new Error(
        `cannot fetch data from google , spid: ${route.params.id}, isSignedIn: ${isSignedIn.value}, hasToken: ${!!accessToken.value}`
      );
    }
  }

  async function updateSignInStatus(signedIn: boolean) {
    isSignedIn.value = signedIn;
    
    // Debug: track what triggered this call
    const stack = new Error().stack?.split('\n').slice(1, 4).join(' -> ') || 'unknown';
    console.log(`🔑 updateSignInStatus called: ${signedIn ? "signed in" : "signed out"}`);
    console.log(`📍 Triggered by: ${stack}`);

    if (signedIn) {
      await loadSettings();
      await loadSoldiers();
      
      // More robust check to prevent template loading after real data has been processed
      const hasHistoricalData = historicalPositions.size > 0;
      const hasCurrentPositions = positions.length > 0;
      const hasLoadedDates = loadedDates.size > 0;
      
      // Additional check: see if any positions have soldier assignments (indicating real data)
      const hasRealAssignmentData = positions.some(p => 
        p.shifts.some(s => s.soldierIds && s.soldierIds.some(id => id && id.trim() !== ""))
      ) || Array.from(historicalPositions.values()).some(datePositions =>
        datePositions.some(p => p.shifts.some(s => s.soldierIds && s.soldierIds.some(id => id && id.trim() !== "")))
      );
      
      // Don't load template if a date change operation is in progress
      const shouldSkipTemplateLoad = hasCurrentPositions || hasHistoricalData || hasLoadedDates || hasRealAssignmentData || isDateChangeInProgress;
      
      console.log(`🔍 Template load decision: skip=${shouldSkipTemplateLoad} (current: ${hasCurrentPositions}, historical: ${hasHistoricalData}, loaded dates: ${hasLoadedDates}, real data: ${hasRealAssignmentData}, date change in progress: ${isDateChangeInProgress})`);
      
      if (!shouldSkipTemplateLoad) {
        console.log(`📋 No existing positions or historical data, loading from template initially`);
        await loadPositionsForDate(); // This will load from template initially
      } else {
        console.log(`✅ Positions or historical data already exists (current: ${positions.length}, historical: ${historicalPositions.size}, loaded dates: ${loadedDates.size}, has real data: ${hasRealAssignmentData}), skipping template load`);
      }
      
      await loadPresence();
    } else {
      // Clear data when signed out
      soldiers.splice(0);
      positions.splice(0);
      presence.start = undefined;
      presence.end = undefined;
      presence.soldiersPresence = {};
    }
  }

  async function loadSoldiers(): Promise<void> {
    if (!isSignedIn.value) return;

    const soldiersListOffset = 3;
    const soldiersRaw = await fetchSheetValues(
      SHEETS.SOLDIERS,
      "A3",
      `E${settings.soldiersMaxAmount + soldiersListOffset}`
    );

    console.log("soldiers loaded", soldiersRaw.length);

    const soldiersArr = soldiersRaw as Array<
      Array<
        [
          /* id */ number,
          /* full name */ string,
          /* platoon */ number | string,
          /* role */ string,
          /* description */ string
        ]
      >
    >;

    soldiers.splice(0); // Clear existing data
    
    const processedSoldiers = soldiersArr
      .filter((soldier) => soldier.length === 5) // filter empty rows
      .map((soldier) => ({
        id: soldier[0] + "",
        name: soldier[1] + "",
        platoon: soldier[2] + "",
        role: soldier[3] + "",
        description: soldier[4] + "",
      }));
    
    console.log(`👥 Processed ${processedSoldiers.length} soldiers from ${soldiersArr.length} raw rows`);
    console.log(`👥 Soldier IDs loaded: ${processedSoldiers.slice(0, 10).map(s => s.id).join(', ')}${processedSoldiers.length > 10 ? '...' : ''}`);
    
    soldiers.push(...processedSoldiers);
  }

  async function loadPresence(): Promise<void> {
    verifyReadiness();

    const presenceRaw = await fetchSheetValues(
      SHEETS.PRESENCE,
      "A1",
      // TODO: calculate the end column by fetching dates and calculate period length (require additional API call)
      `ZA${
        Number(settings.soldiersMaxAmount) +
        Number(settings.presenceNameFirstRow)
      }`
    );

    console.log("presence loaded", presenceRaw);

    if (!presenceRaw.length) {
      console.error("unexpected presence response");
      return;
    }

    presence.start = parse(presenceRaw[0][1], "yyyy-MM-dd", new Date());
    presence.end = parse(presenceRaw[1][1], "yyyy-MM-dd", new Date());
    presence.soldiersPresence = {}; // Clear existing data

    for (
      let i = settings.presenceNameFirstRow - 1;
      i < presenceRaw.length;
      ++i
    ) {
      const row = presenceRaw[i];
      const soldierDescription = row[settings.presenceNameColumn - 1];
      if (!soldierDescription) {
        continue;
      }

      const soldier = soldiers.find(
        (s) => s.description.trim() === soldierDescription.trim()
      );

      if (!soldier) {
        console.error("soldier not found", soldierDescription);
        continue;
      }

      const soldierPresence: SoldierPresenceDto = {
        presence: [],
      };

      let currentDay = presence.start;

      for (let j = settings.presenceNameColumn; j < row.length; ++j) {
        const presenceStateValue = row[j];

        soldierPresence.presence.push({
          day: currentDay,
          presence: presenceStateValue,
        });

        currentDay = addDays(currentDay, 1);
      }

      presence.soldiersPresence[soldier.id] = soldierPresence;
    }

    console.log("presence parsed", presence);
  }

  /**
   * Generate sheet name from date in the format "שבצק-DD.MM.YY"
   */
  function generateSheetNameFromDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().substr(-2);
    return `שבצק-${day}.${month}.${year}`;
  }

  /**
   * Get sheet ID by sheet name using GIS fetch approach
   */
  async function getSheetIdByName(sheetName: string): Promise<number | null> {
    try {
      verifyReadiness();
      
      const spreadsheetId = route.params.id as string;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get spreadsheet info: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const sheet = data.sheets?.find((s: any) => 
        s.properties?.title === sheetName
      );
      
      return sheet?.properties?.sheetId ?? null;
    } catch (error: any) {
      console.error(`❌ Error getting sheet ID for "${sheetName}":`, error);
      return null;
    }
  }

  /**
   * Check if a sheet exists by name
   */
  async function checkSheetExists(sheetName: string): Promise<boolean> {
    const sheetId = await getSheetIdByName(sheetName);
    return sheetId !== null;
  }

  /**
   * Duplicate a sheet within the same spreadsheet using GIS fetch approach
   */
  async function duplicateSheet(sourceSheetName: string, newSheetName: string): Promise<void> {
    try {
      verifyReadiness();
      
      // Get source sheet ID and current sheet count
      const spreadsheetId = route.params.id as string;
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get spreadsheet info: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const sheets = data.sheets || [];
      
      // Find source sheet
      const sourceSheet = sheets.find((s: any) => s.properties?.title === sourceSheetName);
      if (!sourceSheet) {
        throw new Error(`Source sheet "${sourceSheetName}" not found`);
      }
      
      const sourceSheetId = sourceSheet.properties.sheetId;
      const currentSheetCount = sheets.length;
      
      console.log(`📊 Current spreadsheet has ${currentSheetCount} sheets, adding new sheet at the end`);

      // Duplicate the sheet at the end
      const requests = [{
        duplicateSheet: {
          sourceSheetId: sourceSheetId,
          newSheetName: newSheetName,
          insertSheetIndex: currentSheetCount, // Insert at the end (0-based index)
        }
      }];

      const duplicateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests }),
        }
      );

      if (!duplicateResponse.ok) {
        throw new Error(`Failed to duplicate sheet: ${duplicateResponse.status} ${duplicateResponse.statusText}`);
      }

      console.log(`✅ Sheet duplicated: "${sourceSheetName}" → "${newSheetName}" (added at position ${currentSheetCount + 1})`);
    } catch (error) {
      console.error('❌ Error duplicating sheet:', error);
      throw error;
    }
  }

  /**
   * Get the current sheet name based on schedule date
   */
  function getCurrentSheetName(scheduleDate?: Date): string {
    return scheduleDate ? generateSheetNameFromDate(scheduleDate) : SHEETS.POSITIONS;
  }

  async function loadPositions(): Promise<void> {
    if (!isSignedIn.value) return;

    const positionsRaw: Array<Array<string>> = await fetchSheetValues(
      SHEETS.POSITIONS,
      "A1",
      "AZ100"
    );

    console.log("positions loaded", positionsRaw);

    if (!positionsRaw.length) {
      console.warn("no positions def found");
      return;
    }

    type positionState = {
      index: number;
      position: PositionDto;
      currentTitle?: string;
      currentShiftId?: string;
      overrideAssignments?: boolean;
      defaultAssignments: AssignmentDefDto[];
      assignmentIndex?: number;
      totalAssignmentSlots?: number;
    };

    const positionsState: Array<positionState> = [];
    const positionsRow = positionsRaw[0];
    for (let i = 0; i < positionsRow.length; ++i) {
      if (positionsRow[i] === TITLES.POSITION) {
        positionsState.push({
          index: i,
          position: {
            id: `pos-${i}`,
            name: positionsRow[i + 1],
            shifts: [],
          },
          defaultAssignments: [],
          assignmentIndex: undefined,
          totalAssignmentSlots: undefined,
        });
      }
    }

    positionsRaw.slice(1).forEach((row, rowIdx) => {
      let state: positionState | undefined;
      for (let i = 0; i < row.length; ++i) {
        switch (row[i]) {
          case TITLES.ROLE:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(`positions: wrong ${TITLES.ROLE} index`);
            }
            state.currentTitle = TITLES.ROLE;
            if (!state.currentShiftId) {
              state.defaultAssignments.push({ roles: [] });
            } else {
              const shift = state.position.shifts.find(
                (s) => s.id === state!.currentShiftId
              )!;
              if (!state.overrideAssignments) {
                state.overrideAssignments = true;
                shift.assignmentDefs = [{ roles: [] }];
              } else {
                shift.assignmentDefs.push({ roles: [] });
              }
            }
            break;
          case TITLES.SHIFT:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(
                `positions: wrong ${TITLES.SHIFT} index`
              );
            }
            state.overrideAssignments = false;
            state.currentTitle = TITLES.SHIFT;
            state.currentShiftId = `${state.position.id}-shift-${rowIdx}`;
            state.position.shifts.push({
              id: state.currentShiftId,
              startTime: row[i + 1] as ShiftHours,
              endTime: row[i + 2] as ShiftHours,
              assignmentDefs: state.defaultAssignments,
              soldierIds: [],
            });
            break;
          case TITLES.ASSIGNMENT:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(
                `positions: wrong ${TITLES.ASSIGNMENT} index`
              );
            }
            state.currentTitle = TITLES.ASSIGNMENT;
            
            // Only initialize assignment tracking once per position (not for every שיבוץ row)
            if (state.assignmentIndex === undefined) {
              state.assignmentIndex = 0;
              // Pre-calculate total assignment slots for this position
              state.totalAssignmentSlots = state.position.shifts.reduce(
                (total, shift) => total + shift.assignmentDefs.length, 
                0
              );
              // Initialize soldierIds arrays with proper length for each shift
              state.position.shifts.forEach(shift => {
                if (!shift.soldierIds) {
                  shift.soldierIds = [];
                }
                // Pre-fill with empty strings to match assignment slots
                while (shift.soldierIds.length < shift.assignmentDefs.length) {
                  shift.soldierIds.push("");
                }
              });
            }
            
            // Process this שיבוץ row as an assignment
            const assignmentIndex = state.assignmentIndex || 0;
            const assignmentValue = row[i + 1] || ""; // Get value from next column, or empty
            
            console.log(`🔍 Loading assignment ${assignmentIndex}: "${assignmentValue}" for position ${state.position.name}`);
            console.log(`📊 Position has ${state.position.shifts.length} shifts:`);
            state.position.shifts.forEach((shift, idx) => {
              console.log(`   Shift ${idx} (${shift.id}): ${shift.assignmentDefs.length} slots`);
            });
            
            // Find the shift and spot index based on sequential assignment index
            let currentIndex = assignmentIndex;
            let targetShift = null;
            let targetSpotIndex = -1;
            
            console.log(`🔢 Calculating placement for assignment index ${assignmentIndex}:`);
            
            for (let shiftIdx = 0; shiftIdx < state.position.shifts.length; shiftIdx++) {
              const shift = state.position.shifts[shiftIdx];
              const shiftSlots = shift.assignmentDefs.length;
              console.log(`   Checking shift ${shiftIdx} (${shift.id}): currentIndex=${currentIndex}, shiftSlots=${shiftSlots}`);
              if (currentIndex < shiftSlots) {
                targetShift = shift;
                targetSpotIndex = currentIndex;
                console.log(`   ✅ Found target: shift ${shiftIdx} (${shift.id}), spot ${targetSpotIndex}`);
                break;
              }
              currentIndex -= shiftSlots;
              console.log(`   ⏭️ Moving to next shift, remaining currentIndex=${currentIndex}`);
            }
            
            if (targetShift && targetSpotIndex >= 0) {
              console.log(`📍 Placing "${assignmentValue}" in shift ${targetShift.id} at spot ${targetSpotIndex}`);
              
              // Place the soldier in the exact spot (preserving empty spots)
              if (!targetShift.soldierIds) {
                targetShift.soldierIds = [];
              }
              // Ensure the array is long enough
              while (targetShift.soldierIds.length <= targetSpotIndex) {
                targetShift.soldierIds.push("");
              }
              // Store the soldier ID or empty string
              targetShift.soldierIds[targetSpotIndex] = assignmentValue;
              
              console.log(`✅ Result: shift ${targetShift.id} soldierIds: [${targetShift.soldierIds.join(', ')}]`);
              
              // Increment assignment index for next assignment
              state.assignmentIndex = (state.assignmentIndex || 0) + 1;
            }
            break;
          default:
            if (!state) break;
            if (state.currentTitle === TITLES.ROLE) {
              if (!row[i]) break; // Skip empty roles
              if (state.currentShiftId) {
                const shift = state.position.shifts.find(
                  (s) => s.id === state!.currentShiftId
                )!;
                const assignment =
                  shift.assignmentDefs[shift.assignmentDefs.length - 1];
                assignment.roles.push(row[i]);
              } else {
                const defaultAssignments =
                  state.defaultAssignments[state.defaultAssignments.length - 1];
                defaultAssignments.roles.push(row[i]);
              }
            }
        }
      }
    });

    console.log("positions data", positionsState);

    positions.splice(0); // Clear existing data
    positions.push(...positionsState.map((p) => p.position));
    console.log("positions store", positions);
  }

  /**
   * Load positions from a specific sheet (refactored from loadPositions)
   */
  async function loadPositionsFromSheet(sheetName: string): Promise<void> {
    verifyReadiness();

    const positionsRaw: Array<Array<string>> = await fetchSheetValues(
      sheetName,
      "A1",
      "AZ100"
    );

    console.log("positions loaded from", sheetName, positionsRaw);

    if (!positionsRaw.length) {
      console.warn("no positions def found");
      return;
    }

    type positionState = {
      index: number;
      position: PositionDto;
      currentTitle?: string;
      currentShiftId?: string;
      overrideAssignments?: boolean;
      defaultAssignments: AssignmentDefDto[];
      assignmentIndex?: number;
      totalAssignmentSlots?: number;
    };

    const positionsState: Array<positionState> = [];
    const positionsRow = positionsRaw[0];
    for (let i = 0; i < positionsRow.length; ++i) {
      if (positionsRow[i] === TITLES.POSITION) {
        positionsState.push({
          index: i,
          position: {
            id: `pos-${i}`,
            name: positionsRow[i + 1],
            shifts: [],
          },
          defaultAssignments: [],
          assignmentIndex: undefined,
          totalAssignmentSlots: undefined,
        });
      }
    }

    positionsRaw.slice(1).forEach((row, rowIdx) => {
      let state: positionState | undefined;
      for (let i = 0; i < row.length; ++i) {
        switch (row[i]) {
          case TITLES.ROLE:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(`positions: wrong ${TITLES.ROLE} index`);
            }
            state.currentTitle = TITLES.ROLE;
            if (!state.currentShiftId) {
              state.defaultAssignments.push({ roles: [] });
            } else {
              const shift = state.position.shifts.find(
                (s) => s.id === state!.currentShiftId
              )!;
              if (!state.overrideAssignments) {
                state.overrideAssignments = true;
                shift.assignmentDefs = [{ roles: [] }];
              } else {
                shift.assignmentDefs.push({ roles: [] });
              }
            }
            break;
          case TITLES.SHIFT:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(
                `positions: wrong ${TITLES.SHIFT} index`
              );
            }
            state.overrideAssignments = false;
            state.currentTitle = TITLES.SHIFT;
            state.currentShiftId = `${state.position.id}-shift-${rowIdx}`;
            state.position.shifts.push({
              id: state.currentShiftId,
              startTime: row[i + 1] as ShiftHours,
              endTime: row[i + 2] as ShiftHours,
              assignmentDefs: state.defaultAssignments,
              soldierIds: [],
            });
            break;
          case TITLES.ASSIGNMENT:
            state = positionsState.find((p) => p.index === i);
            if (!state) {
              throw new SchedulerError(
                `positions: wrong ${TITLES.ASSIGNMENT} index`
              );
            }
            state.currentTitle = TITLES.ASSIGNMENT;
            
            // Only initialize assignment tracking once per position (not for every שיבוץ row)
            if (state.assignmentIndex === undefined) {
              state.assignmentIndex = 0;
              // Pre-calculate total assignment slots for this position
              state.totalAssignmentSlots = state.position.shifts.reduce(
                (total, shift) => total + shift.assignmentDefs.length, 
                0
              );
              // Initialize soldierIds arrays with proper length for each shift
              state.position.shifts.forEach(shift => {
                if (!shift.soldierIds) {
                  shift.soldierIds = [];
                }
                // Pre-fill with empty strings to match assignment slots
                while (shift.soldierIds.length < shift.assignmentDefs.length) {
                  shift.soldierIds.push("");
                }
              });
            }
            
            // Process this שיבוץ row as an assignment
            const assignmentIndex = state.assignmentIndex || 0;
            const assignmentValue = row[i + 1] || ""; // Get value from next column, or empty
            
            // Find the shift and spot index based on sequential assignment index
            let currentIndex = assignmentIndex;
            let targetShift = null;
            let targetSpotIndex = -1;
            
            for (let shiftIdx = 0; shiftIdx < state.position.shifts.length; shiftIdx++) {
              const shift = state.position.shifts[shiftIdx];
              const shiftSlots = shift.assignmentDefs.length;
              if (currentIndex < shiftSlots) {
                targetShift = shift;
                targetSpotIndex = currentIndex;
                break;
              }
              currentIndex -= shiftSlots;
            }
            
            if (targetShift && targetSpotIndex >= 0) {
              // Place the soldier in the exact spot (preserving empty spots)
              if (!targetShift.soldierIds) {
                targetShift.soldierIds = [];
              }
              // Ensure the array is long enough
              while (targetShift.soldierIds.length <= targetSpotIndex) {
                targetShift.soldierIds.push("");
              }
              // Store the soldier ID or empty string
              targetShift.soldierIds[targetSpotIndex] = assignmentValue;
              
              // Increment assignment index for next assignment
              state.assignmentIndex = (state.assignmentIndex || 0) + 1;
            }
            break;
          default:
            if (!state) break;
            if (state.currentTitle === TITLES.ROLE) {
              if (!row[i]) break; // Skip empty roles
              if (state.currentShiftId) {
                const shift = state.position.shifts.find(
                  (s) => s.id === state!.currentShiftId
                )!;
                const assignment =
                  shift.assignmentDefs[shift.assignmentDefs.length - 1];
                assignment.roles.push(row[i]);
              } else {
                const defaultAssignments =
                  state.defaultAssignments[state.defaultAssignments.length - 1];
                defaultAssignments.roles.push(row[i]);
              }
            }
        }
      }
    });

    console.log("positions data", positionsState);

    positions.splice(0); // Clear existing data
    positions.push(...positionsState.map((p) => p.position));
    console.log("positions store", positions);
  }

  /**
   * Load positions for a specific date - creates sheet if it doesn't exist
   */
  async function loadPositionsForDate(scheduleDate?: Date): Promise<void> {
    if (!isSignedIn.value) return;

    // Clear existing positions
    positions.splice(0, positions.length);

    const targetSheetName = getCurrentSheetName(scheduleDate);
    console.log(`🔍 Loading positions for sheet: "${targetSheetName}"`);

    try {
      // Check if date-specific sheet exists
      const sheetExists = await checkSheetExists(targetSheetName);
      
      if (!sheetExists && scheduleDate) {
        console.log(`📋 Creating new sheet from template: "${targetSheetName}"`);
        await duplicateSheet(SHEETS.POSITIONS, targetSheetName);
      }

      // Load positions from the appropriate sheet
      await loadPositionsFromSheet(targetSheetName);
      
    } catch (error) {
      console.error('❌ Error loading positions for date:', error);
      console.log('🔄 Falling back to template sheet...');
      
      // Fallback to template sheet
      await loadPositionsFromSheet(SHEETS.POSITIONS);
    }
  }

  /**
   * Convert date to string key for tracking loaded dates
   */
  function getDateKey(date: Date): string {
    return format(date, 'yyyy-MM-dd');
  }

  /**
   * Load positions for a single date and store in historical positions
   */
  async function loadPositionsForSingleDate(date: Date): Promise<PositionDto[]> {
    if (!isSignedIn.value) return [];

    const dateKey = getDateKey(date);
    const targetSheetName = getCurrentSheetName(date);
    
    console.log(`📅 Loading positions for date: ${dateKey} (sheet: "${targetSheetName}")`);

    try {
      // Check if date-specific sheet exists
      const sheetExists = await checkSheetExists(targetSheetName);
      
      if (!sheetExists) {
        console.log(`📋 Creating new sheet from template: "${targetSheetName}"`);
        await duplicateSheet(SHEETS.POSITIONS, targetSheetName);
      }

      // Load positions from the existing sheet with date context
      const tempPositions: PositionDto[] = [];
      await loadPositionsFromSheetIntoArray(targetSheetName, tempPositions, date);
      
      // Store in historical positions
      historicalPositions.set(dateKey, tempPositions);
      loadedDates.add(dateKey);
      
      console.log(`✅ Loaded ${tempPositions.length} positions for date: ${dateKey}`);
      return tempPositions;
      
    } catch (error) {
      console.error(`❌ Error loading positions for date ${dateKey}:`, error);
      
      // Check if we already have successfully loaded data for this date in historicalPositions
      const existingData = historicalPositions.get(dateKey);
      if (existingData && existingData.length > 0) {
        console.log(`✅ Using previously loaded data for date ${dateKey} (${existingData.length} positions)`);
        return existingData;
      }
      
      console.log('🔄 Falling back to template sheet...');
      
      try {
        // Fallback to template sheet
        const tempPositions: PositionDto[] = [];
        await loadPositionsFromSheetIntoArray(SHEETS.POSITIONS, tempPositions, date);
        
        // Store template positions in historical data
        historicalPositions.set(dateKey, tempPositions);
        loadedDates.add(dateKey);
        
        console.log(`✅ Loaded ${tempPositions.length} positions from template for date: ${dateKey}`);
        return tempPositions;
      } catch (fallbackError) {
        console.error(`❌ Even template fallback failed for date ${dateKey}:`, fallbackError);
        
        // Store empty positions to avoid retrying
        const emptyPositions: PositionDto[] = [];
        historicalPositions.set(dateKey, emptyPositions);
        loadedDates.add(dateKey);
        return emptyPositions;
      }
    }
  }

  /**
   * Load positions from sheet into a specific array (doesn't affect main positions array)
   */
  async function loadPositionsFromSheetIntoArray(sheetName: string, targetArray: PositionDto[], dateContext?: Date): Promise<void> {
    console.log(`🔍 Loading positions from sheet: "${sheetName}"`);
    
    // Save the current positions and processing date
    const originalPositions = [...positions];
    const originalProcessingDate = currentProcessingDate.value;
    
    try {
      // Set the processing date context if provided
      if (dateContext) {
        currentProcessingDate.value = dateContext;
        console.log(`📅 Set processing date context: ${format(dateContext, 'yyyy-MM-dd')}`);
      }
      
      // Use the existing parsing logic by loading into main positions array
      await loadPositionsFromSheet(sheetName);
      
      // Copy the parsed positions to our target array
      targetArray.push(...positions);
      
      console.log(`📊 Final positions array for ${sheetName}:`, targetArray);
    } finally {
      // Restore original positions and processing date
      positions.splice(0, positions.length, ...originalPositions);
      currentProcessingDate.value = originalProcessingDate;
    }
  }

  /**
   * Load positions for a date range (current date + past days)
   */
  async function loadPositionsForDateRange(currentDate: Date, pastDays: number = 3): Promise<void> {
    if (!isSignedIn.value) return;

    console.log(`📅 Loading positions for date range: ${pastDays} days before ${getDateKey(currentDate)}`);

    // Generate the dates to load (past days + current day) 
    const datesToLoad: Date[] = [];
    for (let i = pastDays; i >= 0; i--) {
      datesToLoad.push(subDays(currentDate, i));
    }

    console.log(`📋 Dates to load: ${datesToLoad.map(d => getDateKey(d)).join(', ')}`);

    // Load all dates in parallel
    await Promise.all(datesToLoad.map(date => loadPositionsForSingleDate(date)));

    // Update main positions array with current date positions
    const currentDatePositions = historicalPositions.get(getDateKey(currentDate)) || [];
    positions.splice(0, positions.length, ...currentDatePositions);

    console.log(`✅ Date range loading complete. Main positions updated with ${positions.length} positions`);
  }

  /**
   * Incremental loading - only load missing dates in the new range
   */
  async function loadPositionsIncremental(newCurrentDate: Date, pastDays: number = 3): Promise<void> {
    if (!isSignedIn.value) return;

    console.log(`🔄 Incremental loading for date: ${getDateKey(newCurrentDate)} (${pastDays} days history)`);

    // Generate the required date range
    const requiredDates: Date[] = [];
    for (let i = pastDays; i >= 0; i--) {
      requiredDates.push(subDays(newCurrentDate, i));
    }

    // Find missing dates that haven't been loaded yet
    const missingDates = requiredDates.filter(date => !loadedDates.has(getDateKey(date)));

    if (missingDates.length === 0) {
      console.log(`✅ All required dates already loaded, just updating main positions`);
    } else {
      console.log(`📋 Missing dates to load: ${missingDates.map(d => getDateKey(d)).join(', ')}`);
      
      // Load only the missing dates
      await Promise.all(missingDates.map(date => loadPositionsForSingleDate(date)));
    }

    // Update main positions array with current date positions
    const currentDatePositions = historicalPositions.get(getDateKey(newCurrentDate)) || [];
    
    // Debug: Check if current date positions have soldier assignments
    console.log(`🔍 Current date positions summary:`, currentDatePositions.map(pos => ({
      name: pos.name,
      shifts: pos.shifts.map(shift => ({
        id: shift.id,
        soldierIds: shift.soldierIds || [],
        hasAssignments: (shift.soldierIds || []).some(id => id && id.trim() !== ""),
        assignmentDetails: (shift.soldierIds || []).filter(id => id && id.trim() !== "")
      }))
    })));
    
    // Log which soldiers are assigned in current date positions
    const currentDateAssignedSoldiers = new Set<string>();
    currentDatePositions.forEach(pos => {
      pos.shifts.forEach(shift => {
        (shift.soldierIds || []).forEach(id => {
          if (id && id.trim() !== "") {
            currentDateAssignedSoldiers.add(id);
          }
        });
      });
    });
    
    console.log(`👥 Soldiers assigned in current date (${getDateKey(newCurrentDate)}) positions:`, Array.from(currentDateAssignedSoldiers));
    
    // Set processing date context for current date before updating positions
    currentProcessingDate.value = newCurrentDate;
    console.log(`📅 Set processing date context for current date: ${format(newCurrentDate, 'yyyy-MM-dd')}`);
    
    positions.splice(0, positions.length, ...currentDatePositions);
    
    // Clear processing date context after update
    currentProcessingDate.value = null;

    console.log(`✅ Incremental loading complete. Main positions updated with ${positions.length} positions`);
  }

  /**
   * Get historical positions for a specific date
   */
  function getHistoricalPositions(date: Date): PositionDto[] {
    const dateKey = getDateKey(date);
    return historicalPositions.get(dateKey) || [];
  }

  /**
   * Get all loaded dates
   */
  function getLoadedDates(): Date[] {
    return Array.from(loadedDates).map(dateKey => new Date(dateKey));
  }

  /**
   * Clear historical data (useful for memory management)
   */
  function clearHistoricalData() {
    console.log('🗑️ Clearing historical positions data');
    historicalPositions.clear();
    loadedDates.clear();
  }

  return {
    load,
    login,
    logout,
    triggerOneTap,
    requestApiAccess,
    fetchSheetValues,
    updateSheetValues,
    batchUpdateSheetValues,
    loadSettings,
    loadSoldiers,
    loadPositions,
    loadPresence,
    soldiers,
    positions,
    presence,
    isSignedIn,
    userInfo,
    settings,
    SHEETS,
    TITLES,
    // Sheet management functions for date-specific sheets
    generateSheetNameFromDate,
    checkSheetExists,
    getSheetIdByName,
    duplicateSheet,
    getCurrentSheetName,
    loadPositionsForDate,
    // Date range loading functions
    getDateKey,
    loadPositionsForSingleDate,
    loadPositionsFromSheetIntoArray,
    loadPositionsForDateRange,
    loadPositionsIncremental,
    getHistoricalPositions,
    getLoadedDates,
    clearHistoricalData,
    // Date context for processing assignments
    currentProcessingDate: readonly(currentProcessingDate),
    setDateChangeInProgress, // Add this function for date change coordination
    
    // Computed property for dayStart to ensure proper Vue reactivity
    dayStart: dayStartComputed,
  };
});
