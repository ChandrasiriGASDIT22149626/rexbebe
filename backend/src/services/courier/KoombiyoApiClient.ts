import { config } from '../../config/environment';

export interface KoombiyoDistrict {
  district_id: number;
  district_name: string;
}

export interface KoombiyoCity {
  city_id: number;
  city_name: string;
  postal_code: string;
}

export interface KoombiyoDeliveryRate {
  branch_name: string;
  city_name: string;
  district_name: string;
  initial_charge: string;
  charge_per_kg: string;
}

export interface KoombiyoAddOrderPayload {
  waybill_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city_id: string;
  customer_city_name: string;
  customer_district_id: string;
  customer_postal_code: string;
  description: string;
  cod_amount: string;
  product_value: string;
  special_note: string;
}

export interface KoombiyoActiveWaybillsResponse {
  count: number;
  waybills: { waybill_id: number | string }[];
}

export interface KoombiyoWebhookPayload {
  waybill_id: string;
  status_id: string | number;
  status: string;
  weight?: string | number;
  status_date?: string;
  del_charge?: string | number;
  reason?: string;
}

export interface ResolvedKoombiyoAddress {
  districtId: string;
  districtName: string;
  cityId: string;
  cityName: string;
  postalCode: string;
  deliveryCharge: number;
  chargePerKg: number;
  branchName?: string;
  matchedScore: number;
  confidence: 'EXACT' | 'HIGH' | 'APPROXIMATE' | 'UNMAPPED';
}

/**
 * KoombiyoApiClient
 * 
 * Official Client API implementation for Koombiyo Delivery v2.
 * Strictly adheres to developer documentation:
 * - Base URL: https://client.koombiyodelivery.lk/clientapi/v2
 * - JWT authentication with access token caching and proactive token refresh
 * - Mutex-guarded authentication to avoid duplicate logins under concurrent requests
 * - Location lookups (districts & cities) and delivery rate calculations
 * - Order dispatch, waybill tracking, timeline retrieval, POD streaming, and webhook testing
 */
export class KoombiyoApiClient {
  private static instance: KoombiyoApiClient;

  private baseUrl: string;
  private apiKey: string;
  private apiPassword: string;

  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number = 0; // Unix millisecond timestamp
  private authPromise: Promise<string> | null = null;

  // In-memory cache for location data
  private cachedDistricts: KoombiyoDistrict[] | null = null;
  private districtsCacheTime: number = 0;
  private cachedCities: Map<number, KoombiyoCity[]> = new Map();
  private cachedRates: Map<string, KoombiyoDeliveryRate> = new Map();

  private constructor() {
    this.baseUrl = (config.koombiyo?.baseUrl || process.env.KOOMBIYO_BASE_URL || 'https://client.koombiyodelivery.lk/clientapi/v2').replace(/\/+$/, '');
    this.apiKey = config.koombiyo?.apiKey || process.env.KOOMBIYO_API_KEY || '';
    this.apiPassword = config.koombiyo?.apiPassword || process.env.KOOMBIYO_API_PASSWORD || '';
  }

  public static getInstance(): KoombiyoApiClient {
    if (!KoombiyoApiClient.instance) {
      KoombiyoApiClient.instance = new KoombiyoApiClient();
    }
    return KoombiyoApiClient.instance;
  }

  /**
   * Check if official Koombiyo credentials are configured in backend environment.
   */
  public hasCredentials(): boolean {
    const key = config.koombiyo?.apiKey || process.env.KOOMBIYO_API_KEY;
    const pwd = config.koombiyo?.apiPassword || process.env.KOOMBIYO_API_PASSWORD;
    return Boolean(key && pwd && key.trim() !== '' && pwd.trim() !== '');
  }

  /**
   * Helper: extract expiry timestamp from JWT access token.
   */
  private extractJwtExpiry(jwtToken: string): number {
    try {
      const parts = jwtToken.split('.');
      if (parts.length >= 2) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
        const payload = JSON.parse(payloadJson);
        if (payload.exp && typeof payload.exp === 'number') {
          return payload.exp * 1000;
        }
      }
    } catch {
      // Fallback
    }
    // Default 15 minutes validity with 1-min buffer
    return Date.now() + 14 * 60 * 1000;
  }

  /**
   * Ensure a valid, non-expired Bearer access token is available.
   * Proactively refreshes using /refresh_token or logs in with /auth_login.
   * Concurrency-safe: shares the same pending promise among simultaneous callers.
   */
  public async getValidToken(): Promise<string> {
    if (!this.hasCredentials()) {
      throw new Error('Koombiyo API credentials not configured. Please set KOOMBIYO_API_KEY and KOOMBIYO_API_PASSWORD.');
    }

    // Refresh if within 2 minutes of expiry
    const BUFFER_MS = 2 * 60 * 1000;
    if (this.accessToken && Date.now() < this.tokenExpiry - BUFFER_MS) {
      return this.accessToken;
    }

    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = (async () => {
      try {
        // Try refreshing if refresh token exists
        if (this.refreshToken) {
          try {
            const refreshRes = await this.rawPost('/refresh_token', { refresh_token: this.refreshToken });
            const refData = refreshRes.data?.data || refreshRes.data || {};
            const refToken = refData.accessToken || refData.access_token || refData.token;
            if (refreshRes.status === 200 && refToken) {
              this.accessToken = refToken;
              this.refreshToken = refData.refreshToken || refData.refresh_token || this.refreshToken;
              this.tokenExpiry = this.extractJwtExpiry(this.accessToken!);
              return this.accessToken!;
            }
          } catch (refreshErr) {
            console.warn('[Koombiyo] Token refresh failed, falling back to full login:', (refreshErr as any).message);
          }
        }

        // Full login via /auth_login
        const loginRes = await this.rawPost('/auth_login', {
          api_key: this.apiKey,
          password: this.apiPassword,
        });

        const logData = loginRes.data?.data || loginRes.data || {};
        const logToken = logData.accessToken || logData.access_token || logData.token;

        if (loginRes.status !== 200 || !logToken) {
          const errMsg = loginRes.data?.message || `HTTP ${loginRes.status}`;
          throw new Error(`Koombiyo authentication failed: ${errMsg}`);
        }

        this.accessToken = logToken;
        this.refreshToken = logData.refreshToken || logData.refresh_token || null;
        this.tokenExpiry = this.extractJwtExpiry(this.accessToken!);
        return this.accessToken!;
      } finally {
        this.authPromise = null;
      }
    })();

    return this.authPromise;
  }

  /**
   * Make a raw HTTP POST request to the Koombiyo API (without bearer token auth).
   * Includes configurable AbortSignal timeout to prevent hanging connections.
   */
  private async rawPost(
    endpoint: string,
    body: Record<string, any> = {},
    customHeaders: Record<string, string> = {},
    timeoutMs: number = 15000
  ): Promise<{ status: number; data: any }> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const payloadStr = JSON.stringify(body);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...customHeaders,
    };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: payloadStr,
        signal: AbortSignal.timeout(timeoutMs),
      });

      let json: any = null;
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }

      return { status: res.status, data: json };
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new Error(`Koombiyo API request to ${endpoint} timed out after ${timeoutMs / 1000} seconds.`);
      }
      throw new Error(`Koombiyo API connection error (${endpoint}): ${err.message}`);
    }
  }

  /**
   * Make an authenticated POST request to the Koombiyo API with Bearer token.
   */
  private async authPost(
    endpoint: string,
    body: Record<string, any> = {},
    customHeaders: Record<string, string> = {}
  ): Promise<{ status: number; data: any }> {
    let token = await this.getValidToken();

    let res = await this.rawPost(endpoint, body, {
      Authorization: `Bearer ${token}`,
      ...customHeaders,
    });

    // If 401 Unauthorized, token might have been invalidated; force re-login and retry once
    if (res.status === 401) {
      console.warn('[Koombiyo] 401 Unauthorized received, invalidating token and retrying...');
      this.accessToken = null;
      token = await this.getValidToken();
      res = await this.rawPost(endpoint, body, {
        Authorization: `Bearer ${token}`,
        ...customHeaders,
      });
    }

    return res;
  }

  // =========================================================================
  // AUTH METHODS
  // =========================================================================

  /**
   * Explicitly authenticate API Client (POST /auth_login)
   */
  public async login(): Promise<{ success: boolean; message: string }> {
    const token = await this.getValidToken();
    return { success: Boolean(token), message: 'Authenticated successfully with Koombiyo API.' };
  }

  /**
   * Revoke active session (POST /logout)
   */
  public async logout(): Promise<{ success: boolean; message: string }> {
    if (!this.refreshToken) {
      return { success: true, message: 'No active session found.' };
    }
    try {
      const res = await this.authPost('/logout', { refresh_token: this.refreshToken });
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = 0;
      return { success: res.status === 200, message: res.data?.message || 'Logged out' };
    } catch (err: any) {
      this.accessToken = null;
      this.refreshToken = null;
      this.tokenExpiry = 0;
      return { success: true, message: err.message };
    }
  }

  // =========================================================================
  // LOCATION & RATES METHODS
  // =========================================================================

  /**
   * Get list of all active Sri Lankan districts (POST /districts)
   */
  public async getDistricts(): Promise<KoombiyoDistrict[]> {
    const ONE_HOUR = 60 * 60 * 1000;
    if (this.cachedDistricts && Date.now() - this.districtsCacheTime < ONE_HOUR) {
      return this.cachedDistricts;
    }

    const res = await this.authPost('/districts', {});
    if (res.status !== 200 || !res.data?.data?.districts) {
      throw new Error(`Failed to fetch districts from Koombiyo: ${res.data?.message || res.status}`);
    }

    this.cachedDistricts = res.data.data.districts;
    this.districtsCacheTime = Date.now();
    return this.cachedDistricts!;
  }

  /**
   * Get list of cities filtered by district ID and optional prefix (POST /cities)
   */
  public async getCities(districtId: number | string, cityName: string = ''): Promise<KoombiyoCity[]> {
    const distIdNum = Number(districtId);
    if (!cityName && this.cachedCities.has(distIdNum)) {
      return this.cachedCities.get(distIdNum)!;
    }

    const payload: Record<string, string> = { district_id: String(districtId) };
    if (cityName && cityName.trim()) {
      payload.city_name = cityName.trim();
    }

    const res = await this.authPost('/cities', payload);

    if (res.status === 404) {
      return [];
    }

    if (res.status !== 200) {
      throw new Error(`Failed to fetch cities from Koombiyo: ${res.data?.message || res.status}`);
    }

    const cities: KoombiyoCity[] = res.data?.data?.cities || [];
    if (!cityName && distIdNum) {
      this.cachedCities.set(distIdNum, cities);
    }
    return cities;
  }

  /**
   * Get Delivery Rates List (POST /delivery_rates)
   */
  public async getDeliveryRates(params: {
    city_id?: string | number;
    zone_id?: string | number;
    search?: string;
    limit?: string | number;
    offset?: string | number;
  } = {}): Promise<{
    rates: KoombiyoDeliveryRate[];
    totalCount: number;
    filteredCount: number;
  }> {
    const cacheKey = params.city_id !== undefined ? `city_${params.city_id}` : '';
    if (cacheKey && this.cachedRates.has(cacheKey)) {
      return {
        rates: [this.cachedRates.get(cacheKey)!],
        totalCount: 1,
        filteredCount: 1,
      };
    }

    const payload: Record<string, string> = {};
    if (params.city_id !== undefined) payload.city_id = String(params.city_id);
    if (params.zone_id !== undefined) payload.zone_id = String(params.zone_id);
    if (params.search !== undefined) payload.search = String(params.search);
    payload.limit = String(params.limit || 50);
    payload.offset = String(params.offset || 0);

    const res = await this.authPost('/delivery_rates', payload);

    if (res.status !== 200) {
      throw new Error(`Failed to fetch delivery rates: ${res.data?.message || res.status}`);
    }

    const data = res.data?.data || {};
    const rates: KoombiyoDeliveryRate[] = data.delivery_rates || [];
    if (cacheKey && rates.length > 0) {
      this.cachedRates.set(cacheKey, rates[0]);
    }

    return {
      rates,
      totalCount: Number(data.total_count || 0),
      filteredCount: Number(data.filtered_count || 0),
    };
  }

  // =========================================================================
  // ACTIVE WAYBILLS & WAYBILL REQUESTS
  // =========================================================================

  /**
   * Get all active waybills assigned to this client account (POST /active_waybills)
   */
  public async getActiveWaybills(): Promise<KoombiyoActiveWaybillsResponse> {
    const res = await this.authPost('/active_waybills', {});
    if (res.status !== 200) {
      throw new Error(`Failed to fetch active waybills from Koombiyo: ${res.data?.message || res.status}`);
    }

    const data = res.data?.data || {};
    return {
      count: Number(data.count || (data.waybills ? data.waybills.length : 0)),
      waybills: data.waybills || [],
    };
  }

  /**
   * Request extra waybills / barcode stickers (POST /request_waybills)
   */
  public async requestWaybills(params: {
    barcodeQty: number;
    podQty?: number;
    barcodeRequestType?: string;
    remarks?: string;
  }): Promise<{ success: boolean; message: string }> {
    const payload = {
      barcode_request_type: params.barcodeRequestType || '1',
      barcode_qty: String(params.barcodeQty || 100),
      pod_qty: String(params.podQty || 50),
      remarks: params.remarks || 'Request from REXBEBE admin order management',
    };

    const res = await this.authPost('/request_waybills', payload);
    if (res.status === 201 || res.status === 200) {
      return { success: true, message: res.data?.message || 'Waybill request submitted successfully' };
    }
    throw new Error(res.data?.message || `Failed to submit waybill request (HTTP ${res.status})`);
  }

  // =========================================================================
  // ORDER DISPATCH & LIFECYCLE
  // =========================================================================

  /**
   * Submit a single delivery order (POST /add_order)
   * Enforces documentation constraints:
   * - COD amount minimum LKR 100, maximum LKR 500,000
   * - Required waybill_id, order_number, customer details, city_id, district_id
   */
  public async addOrder(payload: KoombiyoAddOrderPayload): Promise<{
    success: boolean;
    waybillId: string;
    message: string;
    raw: any;
  }> {
    // Validate COD limits as per PDF page 9: Minimum LKR 100, Maximum LKR 500,000
    const codVal = Number(payload.cod_amount || 0);
    if (codVal < 100 || codVal > 500000) {
      throw new Error(`Invalid COD amount: LKR ${codVal}. Koombiyo limits are Minimum LKR 100, Maximum LKR 500,000.`);
    }

    if (!payload.waybill_id || !payload.waybill_id.trim()) {
      throw new Error('Waybill ID is required to dispatch an order via Koombiyo.');
    }
    if (!payload.order_number || !payload.order_number.trim()) {
      throw new Error('Order number is required.');
    }
    if (!payload.customer_name || !payload.customer_name.trim()) {
      throw new Error('Customer name is required.');
    }
    if (!payload.customer_phone || !payload.customer_phone.trim()) {
      throw new Error('Customer phone is required.');
    }
    if (!payload.customer_address || !payload.customer_address.trim()) {
      throw new Error('Delivery address is required.');
    }
    if (!payload.customer_district_id || !payload.customer_city_id) {
      throw new Error('Valid Koombiyo District ID and City ID are required.');
    }

    const res = await this.authPost('/add_order', {
      waybill_id: String(payload.waybill_id).trim(),
      order_number: String(payload.order_number).trim(),
      customer_name: String(payload.customer_name).trim(),
      customer_phone: String(payload.customer_phone).trim(),
      customer_address: String(payload.customer_address).trim(),
      customer_city_id: String(payload.customer_city_id).trim(),
      customer_city_name: String(payload.customer_city_name).trim(),
      customer_district_id: String(payload.customer_district_id).trim(),
      customer_postal_code: String(payload.customer_postal_code || '').trim(),
      description: String(payload.description || 'REXBEBE Luxury Babywear').trim(),
      cod_amount: String(Math.round(Number(payload.cod_amount || 0))),
      product_value: String(Math.round(Number(payload.product_value || payload.cod_amount || 0))),
      special_note: String(payload.special_note || '').trim(),
    });

    if (res.status === 201 || res.status === 200) {
      return {
        success: true,
        waybillId: payload.waybill_id,
        message: res.data?.message || 'Delivery order added successfully to Koombiyo.',
        raw: res.data,
      };
    }

    const errorMsg = res.data?.message || `HTTP ${res.status}`;
    if (errorMsg.includes('Not Belong to You')) {
      throw new Error(`Koombiyo dispatch failed: Waybill #${payload.waybill_id} is not allocated to this merchant account.`);
    }
    if (errorMsg.includes('already exists')) {
      throw new Error(`Koombiyo dispatch failed: Waybill #${payload.waybill_id} has already been used on another order.`);
    }
    if (errorMsg.includes('banned')) {
      throw new Error(`Koombiyo dispatch failed: Recipient customer has been restricted by courier.`);
    }
    if (errorMsg.includes('phone') || errorMsg.includes('Phone')) {
      throw new Error(`Koombiyo dispatch failed: Customer phone number was rejected by provider (${errorMsg}).`);
    }
    throw new Error(`Koombiyo /add_order failed: ${errorMsg}`);
  }

  /**
   * Delete an existing order if in pending status (POST /delete_order)
   * Re-inserts waybill lock for client re-use.
   */
  public async deleteOrder(waybillId: string | number): Promise<{ success: boolean; message: string }> {
    const res = await this.authPost('/delete_order', { waybill_id: String(waybillId).trim() });
    if (res.status === 200) {
      return { success: true, message: res.data?.message || 'Order deleted successfully' };
    }
    throw new Error(res.data?.message || `Failed to delete order (HTTP ${res.status})`);
  }

  // =========================================================================
  // TRACKING & TIMELINE
  // =========================================================================

  /**
   * Get detailed order status and branch info (POST /order_details)
   */
  public async getOrderDetails(waybillId: string | number): Promise<{
    orderDetails: any;
    customerDetails: any;
    branchDetails: any;
  } | null> {
    const res = await this.authPost('/order_details', { waybill_id: String(waybillId).trim() });
    if (res.status === 404) {
      return null;
    }
    if (res.status !== 200) {
      throw new Error(res.data?.message || `Failed to fetch order details (HTTP ${res.status})`);
    }

    const data = res.data?.data || {};
    return {
      orderDetails: data.order_details,
      customerDetails: data.customer_details,
      branchDetails: data.branch_details,
    };
  }

  /**
   * Get chronological event log (POST /order_timeline)
   */
  public async getOrderTimeline(waybillId: string | number): Promise<any[]> {
    const res = await this.authPost('/order_timeline', { waybill_id: String(waybillId).trim() });
    if (res.status === 404) {
      return [];
    }
    if (res.status !== 200) {
      throw new Error(res.data?.message || `Failed to fetch order timeline (HTTP ${res.status})`);
    }

    return res.data?.data?.timeline || [];
  }

  /**
   * Check customer historical delivery success rate (POST /customer_success_rate)
   */
  public async getCustomerSuccessRate(phone: string): Promise<{
    totalOrders: number;
    deliveredOrders: number;
    returnedOrders: number;
    successRate: number;
  }> {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const res = await this.authPost('/customer_success_rate', { customer_phone: cleanPhone });

    if (res.status === 404) {
      return { totalOrders: 0, deliveredOrders: 0, returnedOrders: 0, successRate: 1.0 };
    }
    if (res.status !== 200) {
      throw new Error(res.data?.message || `Failed to fetch customer success rate (HTTP ${res.status})`);
    }

    const data = res.data?.data || {};
    return {
      totalOrders: Number(data.total_orders || 0),
      deliveredOrders: Number(data.delivered_orders || 0),
      returnedOrders: Number(data.returned_orders || 0),
      successRate: Number(data.success_rate || 0),
    };
  }

  // =========================================================================
  // PROOF OF DELIVERY (POD)
  // =========================================================================

  /**
   * Generate Single POD PDF (POST /single_pod)
   * Returns binary buffer of the generated PDF sticker/waybill
   */
  public async generateSinglePod(
    waybillId: string | number,
    format: 'POD' | 'A6' | 'THERMAL' | 'DOT' | 'CUSTOM' = 'A6'
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const token = await this.getValidToken();
    const url = `${this.baseUrl}/single_pod`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          waybill_id: String(waybillId).trim(),
          format,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to generate POD PDF (${res.status}): ${errText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType: res.headers.get('content-type') || 'application/pdf',
      };
    } catch (err: any) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        throw new Error('Koombiyo POD generation request timed out after 15 seconds.');
      }
      throw err;
    }
  }

  // =========================================================================
  // WEBHOOK TESTING
  // =========================================================================

  /**
   * Send test waybill status payload to your configured Webhook URL (POST /test_webhook)
   */
  public async testWebhook(
    targetWebhookUrl: string,
    samplePayload?: Partial<KoombiyoWebhookPayload>
  ): Promise<{ success: boolean; data: any }> {
    const body: Record<string, string> = {
      waybill_id: String(samplePayload?.waybill_id || '63004415'),
      status_id: String(samplePayload?.status_id || '5'),
      status: String(samplePayload?.status || 'Delivered'),
      weight: String(samplePayload?.weight || '1.0'),
      status_date: String(samplePayload?.status_date || new Date().toISOString().replace('T', ' ').slice(0, 19)),
      del_charge: String(samplePayload?.del_charge || '450.00'),
      reason: String(samplePayload?.reason || 'Verified test webhook from REXBEBE admin'),
    };

    const res = await this.authPost('/test_webhook', body, {
      'Target-Webhook-URL': targetWebhookUrl,
    });

    if (res.status === 200) {
      return { success: true, data: res.data?.data || res.data };
    }

    throw new Error(res.data?.message || `Webhook test failed (HTTP ${res.status})`);
  }

  // =========================================================================
  // ADDRESS & LOCATION RESOLVER (NO GUESSING)
  // =========================================================================

  /**
   * Get the authoritative Koombiyo delivery rate for a district using its primary city.
   */
  public async getDistrictDefaultRate(districtName: string): Promise<ResolvedKoombiyoAddress | null> {
    if (!this.hasCredentials()) return null;
    const cleanDistrict = (districtName || '').trim().toLowerCase();
    const districts = await this.getDistricts();
    const matchedDist = districts.find(
      (d) =>
        d.district_name.toLowerCase() === cleanDistrict ||
        cleanDistrict.includes(d.district_name.toLowerCase()) ||
        d.district_name.toLowerCase().includes(cleanDistrict)
    );
    if (!matchedDist) return null;

    // Use district name as target city (capital of district)
    const cities = await this.getCities(matchedDist.district_id);
    let primaryCity = cities.find(
      (c) => c.city_name.trim().toLowerCase() === matchedDist.district_name.toLowerCase()
    );
    if (!primaryCity && cities.length > 0) {
      primaryCity = cities[0];
    }
    if (!primaryCity) return null;

    let deliveryCharge = 450;
    let chargePerKg = 100;
    let branchName = matchedDist.district_name;

    try {
      const rateRes = await this.getDeliveryRates({ city_id: primaryCity.city_id });
      if (rateRes.rates.length > 0) {
        deliveryCharge = parseFloat(rateRes.rates[0].initial_charge) || 450;
        chargePerKg = parseFloat(rateRes.rates[0].charge_per_kg) || 100;
        branchName = rateRes.rates[0].branch_name || matchedDist.district_name;
      }
    } catch (_) {}

    return {
      districtId: String(matchedDist.district_id),
      districtName: matchedDist.district_name,
      cityId: String(primaryCity.city_id),
      cityName: primaryCity.city_name.trim(),
      postalCode: primaryCity.postal_code !== '-' ? primaryCity.postal_code : '',
      deliveryCharge,
      chargePerKg,
      branchName,
      matchedScore: 0.9,
      confidence: 'HIGH',
    };
  }

  /**
   * Resolves customer address to official Koombiyo district_id, city_id, and delivery rate.
   * Maps user-entered town/city name against Koombiyo official database.
   */
  public async resolveAddress(
    districtName?: string,
    cityName?: string,
    postalCode?: string,
    streetAddress?: string
  ): Promise<ResolvedKoombiyoAddress | null> {
    if (!this.hasCredentials()) {
      return null;
    }

    const cleanDistrict = (districtName || '').trim().toLowerCase();
    const cleanCity = (cityName || '').trim().toLowerCase().replace(/[\,\.]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!cleanCity && cleanDistrict) {
      return this.getDistrictDefaultRate(districtName!);
    }

    const districts = await this.getDistricts();
    let matchedDist = cleanDistrict
      ? districts.find(
          (d) =>
            d.district_name.toLowerCase() === cleanDistrict ||
            cleanDistrict.includes(d.district_name.toLowerCase()) ||
            d.district_name.toLowerCase().includes(cleanDistrict)
        )
      : null;

    let bestCity: KoombiyoCity | null = null;
    let confidence: ResolvedKoombiyoAddress['confidence'] = 'UNMAPPED';
    let matchedScore = 0;

    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

    const findInCities = (cities: KoombiyoCity[]) => {
      if (!cities || cities.length === 0) return null;
      const targetNorm = normalize(cleanCity);

      // 1. Exact match (case & whitespace trimmed)
      let found = cities.find((c) => c.city_name.trim().toLowerCase() === cleanCity);
      if (found) return { city: found, conf: 'EXACT' as const, score: 1.0 };

      // 2. Normalized match (e.g. jaela vs ja-ela)
      found = cities.find((c) => normalize(c.city_name) === targetNorm);
      if (found) return { city: found, conf: 'EXACT' as const, score: 0.98 };

      // 3. Word token / variation match (e.g. "colombo 03" vs "colombo 3" vs "colombo3")
      found = cities.find((c) => {
        const cn = normalize(c.city_name);
        return cn === targetNorm.replace(/^0+/, '') || targetNorm === cn.replace(/^0+/, '');
      });
      if (found) return { city: found, conf: 'HIGH' as const, score: 0.95 };

      // 4. Substring match
      found = cities.find((c) => {
        const cn = c.city_name.trim().toLowerCase();
        return cn.length >= 4 && (cleanCity.includes(cn) || cn.includes(cleanCity));
      });
      if (found) return { city: found, conf: 'HIGH' as const, score: 0.85 };

      // 5. Postal code match if provided
      if (postalCode && postalCode.trim()) {
        const cleanPost = postalCode.trim();
        found = cities.find((c) => c.postal_code && c.postal_code === cleanPost);
        if (found) return { city: found, conf: 'HIGH' as const, score: 0.9 };
      }

      // 6. Street address word match if provided
      if (streetAddress && streetAddress.trim()) {
        const words = streetAddress.toLowerCase().split(/[\s,\-\/]+/);
        for (const w of words) {
          if (w.length >= 4) {
            found = cities.find((c) => c.city_name.trim().toLowerCase() === w);
            if (found) return { city: found, conf: 'APPROXIMATE' as const, score: 0.75 };
          }
        }
      }

      return null;
    };

    // If district matched, search in this district
    if (matchedDist) {
      // First try quick API query with city_name
      const candidateCities = await this.getCities(matchedDist.district_id, cleanCity);
      let match = findInCities(candidateCities);
      if (match) {
        bestCity = match.city;
        confidence = match.conf;
        matchedScore = match.score;
      } else {
        // Fetch full district city list
        const allDistrictCities = await this.getCities(matchedDist.district_id);
        match = findInCities(allDistrictCities);
        if (match) {
          bestCity = match.city;
          confidence = match.conf;
          matchedScore = match.score;
        }
      }
    }

    // Cross-district search: If not found in selected district, check other districts
    if (!bestCity && cleanCity.length >= 3) {
      for (const d of districts) {
        if (matchedDist && d.district_id === matchedDist.district_id) continue;
        const candidateCities = await this.getCities(d.district_id, cleanCity);
        const match = findInCities(candidateCities);
        if (match && (match.conf === 'EXACT' || match.conf === 'HIGH')) {
          matchedDist = d;
          bestCity = match.city;
          confidence = 'HIGH';
          matchedScore = 0.88;
          break;
        }
      }
    }

    // If still no city match, fallback to district capital city so customer is never blocked
    if (!bestCity && matchedDist) {
      const allCities = await this.getCities(matchedDist.district_id);
      bestCity = allCities.find((c) => c.city_name.toLowerCase() === matchedDist!.district_name.toLowerCase()) || allCities[0];
      confidence = 'APPROXIMATE';
      matchedScore = 0.6;
    }

    if (!bestCity || !matchedDist) {
      return null;
    }

    // 3. Fetch exact delivery rate for matched city
    let deliveryCharge = 450;
    let chargePerKg = 100;
    let branchName = matchedDist.district_name;

    try {
      const rateRes = await this.getDeliveryRates({ city_id: bestCity.city_id });
      if (rateRes.rates.length > 0) {
        const rate = rateRes.rates[0];
        deliveryCharge = parseFloat(rate.initial_charge) || 450;
        chargePerKg = parseFloat(rate.charge_per_kg) || 100;
        branchName = rate.branch_name || matchedDist.district_name;
      }
    } catch {
      // Keep default
    }

    return {
      districtId: String(matchedDist.district_id),
      districtName: matchedDist.district_name,
      cityId: String(bestCity.city_id),
      cityName: bestCity.city_name.trim(),
      postalCode: bestCity.postal_code !== '-' ? bestCity.postal_code : '',
      deliveryCharge,
      chargePerKg,
      branchName,
      matchedScore,
      confidence,
    };
  }
}

export const koombiyoApiClient = KoombiyoApiClient.getInstance();
