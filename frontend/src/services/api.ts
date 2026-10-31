import { GAS_API_URL } from '../config/constants';

// --- Shared Types ---

export interface ApiFieldError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  errors?: ApiFieldError[];
}

export type ApiResponse<T> = (T & { success: true }) | ApiErrorResponse;

// --- Config Types ---

export interface CourseConfig {
  name: string;
  years: string[];
  needsBranch: boolean;
  needsOther: boolean;
}

export interface GetConfigResponse {
  eventName: string;
  eventDates: string;
  eventDay: string; // YYYY-MM-DD
  regCloseAt: string;
  serverTime: string;
  open: boolean;
  teamSize: number;
  minAge: number;
  maxAge: number;
  dobMin: string;
  dobMax: string;
  courses: CourseConfig[];
  branches: string[];
  states: string[];
  howHeardOptions: string[];
}

// --- Team Name Check Types ---

export interface CheckTeamNameResponse {
  available: boolean;
  reason?: 'FORMAT' | 'TEAM_NAME_TAKEN';
  message?: string;
}

// --- Register Types ---

export interface CollegePayload {
  name: string;
  address?: string;
  city: string;
  state: string;
  pin: string;
}

export interface ConsentPayload {
  data: true;
  venue: true;
}

export interface MemberPayload {
  fullName: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  college: string;
  course: string;
  courseOther?: string;
  branch?: string;
  year: string;
  profileLink?: string;
}

export interface RegisterPayload {
  idempotencyKey: string;
  website: '';
  teamName: string;
  college: CollegePayload;
  howHeard: string;
  consent: ConsentPayload;
  members: MemberPayload[];
}

export interface MemberSummary {
  role: 'captain' | 'member';
  fullName: string;
}

export interface RegisterResponse {
  teamId: string;
  teamName: string;
  status: 'confirmed';
  members: MemberSummary[];
  emailStatus: 'pending';
  groupLink: string;
}

// --- Status Types ---

export interface LookupStatusResponse {
  teamId: string;
  teamName: string;
  status: string;
  checkedIn: boolean;
  members: MemberSummary[];
}

// --- Admin Types ---

export interface AdminLoginResponse {
  token: string;
  name: string;
  adminId: string;
  role: 'owner' | 'viewer' | string;
  expiresInSeconds: number;
}

export interface AdminMemberView {
  role: 'captain' | 'member';
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  ageOnEvent: number;
  college: string;
  course: string;
  courseOther?: string;
  branch?: string;
  year: string;
  profileLink?: string;
}

export interface TeamView {
  teamId: string;
  timestamp: string;
  teamName: string;
  college: CollegePayload;
  howHeard: string;
  status: 'confirmed' | 'cancelled';
  checkedIn: boolean;
  checkedInAt?: string;
  emailStatus: 'pending' | 'sent' | 'failed';
  emailTries?: number;
  emailSentAt?: string;
  updatedAt?: string;
  members: AdminMemberView[];
}

export interface AdminStats {
  registered: {
    teams: number;
    participants: number;
    cancelledTeams: number;
  };
  perDay: Array<{ date: string; count: number }>;
  ageBuckets: Array<{ label: string; count: number }>;
  courses: Array<{ course: string; count: number; years: Array<{ year: string; count: number }> }>;
  branches: Array<{ name: string; count: number }>;
  states: Array<{ name: string; count: number }>;
  topColleges: Array<{ name: string; count: number }>;
  howHeard: Array<{ name: string; count: number }>;
  checkIn: { checkedIn: number; registered: number };
  emailQueue: { pending: number; sent: number; failed: number };
}

export interface AdminGetDataResponse {
  serverTime: string;
  teams: TeamView[];
  stats: AdminStats;
}

export interface AdminTeamActionResponse {
  team: TeamView;
}

export interface AdminLogExportResponse {
  logged: true;
}

export interface AdminLogoutResponse {
  success: true;
}

// --- Transport & Client Implementation ---

const TIMEOUT_MS = 25_000;
const RETRYABLE_ERRORS = new Set(['NETWORK_ERROR', 'TIMEOUT', 'BUSY', 'SERVER_ERROR']);
const MAX_RETRIES = 3;

/**
 * Base POST transport:
 * - Content-Type: text/plain (avoids CORS preflights on Apps Script)
 * - Follows redirects
 * - 25s timeout
 * - Never logs request or response bodies
 */
async function postRaw(body: object): Promise<ApiResponse<any>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GAS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(body),
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      return {
        success: false,
        error: 'SERVER_ERROR',
        message: `HTTP error ${response.status}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return {
        success: false,
        error: 'TIMEOUT',
        message: 'Request timed out after 25 seconds',
      };
    }
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: err.message || 'Network request failed',
    };
  }
}

/**
 * Executes a request with auto-retry logic:
 * - Only retries NETWORK_ERROR, TIMEOUT, BUSY, SERVER_ERROR
 * - Up to 3 tries total with short exponential backoff
 */
async function executeWithRetry<T>(body: object): Promise<ApiResponse<T>> {
  let attempt = 0;
  let lastResult: ApiResponse<T>;

  while (attempt < MAX_RETRIES) {
    attempt++;
    lastResult = await postRaw(body);

    if (lastResult.success) {
      return lastResult;
    }

    if (!RETRYABLE_ERRORS.has(lastResult.error) || attempt >= MAX_RETRIES) {
      return lastResult;
    }

    // Short backoff (e.g. 500ms, 1000ms)
    await new Promise((resolve) => setTimeout(resolve, attempt * 500));
  }

  return lastResult!;
}

// --- Public API Functions ---

export async function getConfig(): Promise<ApiResponse<GetConfigResponse>> {
  return executeWithRetry<GetConfigResponse>({ action: 'get_config' });
}

export async function checkTeamName(teamName: string): Promise<ApiResponse<CheckTeamNameResponse>> {
  return executeWithRetry<CheckTeamNameResponse>({ action: 'check_team_name', teamName });
}

export async function registerTeam(payload: RegisterPayload): Promise<ApiResponse<RegisterResponse>> {
  // Retries use the EXACT same payload (including idempotencyKey)
  return executeWithRetry<RegisterResponse>({
    action: 'register',
    ...payload,
  });
}

export async function lookupStatus(teamId: string, email: string): Promise<ApiResponse<LookupStatusResponse>> {
  return executeWithRetry<LookupStatusResponse>({
    action: 'lookup_status',
    teamId: teamId.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
  });
}

// --- Admin API Functions ---

export async function adminLogin(adminId: string, password: string): Promise<ApiResponse<AdminLoginResponse>> {
  return executeWithRetry<AdminLoginResponse>({
    action: 'admin_login',
    adminId,
    password,
  });
}

export async function adminGetData(token: string): Promise<ApiResponse<AdminGetDataResponse>> {
  return executeWithRetry<AdminGetDataResponse>({
    action: 'admin_get_data',
    token,
  });
}

export async function adminCancel(token: string, teamId: string, note?: string): Promise<ApiResponse<AdminTeamActionResponse>> {
  const body: Record<string, any> = { action: 'admin_cancel', token, teamId };
  if (note !== undefined && note !== '') body.note = note;
  return executeWithRetry<AdminTeamActionResponse>(body);
}

export async function adminSwapMember(
  token: string,
  teamId: string,
  oldEmail: string,
  newMember: MemberPayload
): Promise<ApiResponse<AdminTeamActionResponse>> {
  return executeWithRetry<AdminTeamActionResponse>({
    action: 'admin_swap_member',
    token,
    teamId,
    oldEmail,
    newMember,
  });
}

export async function adminChangeCaptain(
  token: string,
  teamId: string,
  email: string
): Promise<ApiResponse<AdminTeamActionResponse>> {
  return executeWithRetry<AdminTeamActionResponse>({
    action: 'admin_change_captain',
    token,
    teamId,
    email,
  });
}

export async function adminEditMember(
  token: string,
  teamId: string,
  email: string,
  fields: Partial<MemberPayload>
): Promise<ApiResponse<AdminTeamActionResponse>> {
  return executeWithRetry<AdminTeamActionResponse>({
    action: 'admin_edit_member',
    token,
    teamId,
    email,
    fields,
  });
}

export async function adminCheckin(
  token: string,
  teamId: string,
  checkedIn: boolean
): Promise<ApiResponse<AdminTeamActionResponse>> {
  return executeWithRetry<AdminTeamActionResponse>({
    action: 'admin_checkin',
    token,
    teamId,
    checkedIn,
  });
}

export async function adminLogExport(
  token: string,
  kind: 'csv_all' | 'csv_captains' | 'copy_emails',
  count: number
): Promise<ApiResponse<AdminLogExportResponse>> {
  return executeWithRetry<AdminLogExportResponse>({
    action: 'admin_log_export',
    token,
    kind,
    count,
  });
}

export async function adminLogout(token: string): Promise<ApiResponse<AdminLogoutResponse>> {
  return executeWithRetry<AdminLogoutResponse>({
    action: 'admin_logout',
    token,
  });
}

export async function adminRetryEmail(token: string, teamId: string): Promise<ApiResponse<AdminTeamActionResponse>> {
  return executeWithRetry<AdminTeamActionResponse>({
    action: 'admin_retry_email',
    token,
    teamId,
  });
}
