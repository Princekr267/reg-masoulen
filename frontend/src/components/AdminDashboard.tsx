import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  adminLogin,
  adminGetData,
  adminCancel,
  adminSwapMember,
  adminChangeCaptain,
  adminEditMember,
  adminCheckin,
  adminLogExport,
  adminLogout,
  adminRetryEmail,
  type TeamView,
  type AdminMemberView,
  type AdminStats,
  type MemberPayload,
  getConfig,
  type GetConfigResponse,
} from '../services/api';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { sanitizeCsvCell, downloadCsvFile, copyToClipboard } from '../lib/utils';

const ADMIN_STORAGE_KEY = 'masoulen:admin';

interface AdminSession {
  token: string;
  name: string;
  adminId: string;
  role: string;
  expiresAt: number;
}

export const AdminDashboard: React.FC = () => {
  // Session State
  const [session, setSession] = useState<AdminSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          return parsed;
        }
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
    return null;
  });

  // Login form state
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data state
  const [teams, setTeams] = useState<TeamView[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [config, setConfig] = useState<GetConfigResponse | null>(null);

  // Active view tab: 'teams' | 'event-day' | 'stats'
  const [activeTab, setActiveTab] = useState<'teams' | 'event-day' | 'stats'>('teams');

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCheckin, setFilterCheckin] = useState('all');
  const [filterEmailStatus, setFilterEmailStatus] = useState('all');

  // Modals & Panels
  const [selectedTeam, setSelectedTeam] = useState<TeamView | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelNote, setCancelNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Member Action Modals
  const [editingMember, setEditingMember] = useState<{ member: AdminMemberView; teamId: string } | null>(null);
  const [swappingMember, setSwappingMember] = useState<{ member: AdminMemberView; teamId: string } | null>(null);

  // Export notification
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const isViewer = session?.role === 'viewer';

  // Session handler: clears session on logout or AUTH_REQUIRED
  const clearSession = useCallback(() => {
    try {
      sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    } catch {
      // Ignore
    }
    setSession(null);
    setTeams([]);
    setStats(null);
    setSelectedTeam(null);
  }, []);

  // Fetch admin data
  const fetchData = useCallback(
    async (token: string) => {
      setLoadingData(true);
      setActionError(null);
      const res = await adminGetData(token);
      setLoadingData(false);

      if (res.success) {
        setTeams(res.teams);
        setStats(res.stats);
      } else {
        if (res.error === 'AUTH_REQUIRED') {
          clearSession();
        } else {
          setActionError(res.message || 'Failed to load admin data.');
        }
      }
    },
    [clearSession]
  );

  // Load config for dropdowns
  useEffect(() => {
    getConfig().then((res) => {
      if (res.success) setConfig(res);
    });
  }, []);

  // Load data on login or session load
  useEffect(() => {
    if (session?.token) {
      fetchData(session.token);
    }
  }, [session?.token, fetchData]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (cancelModalOpen) {
          setCancelModalOpen(false);
        } else if (editingMember) {
          setEditingMember(null);
        } else if (swappingMember) {
          setSwappingMember(null);
        } else if (selectedTeam) {
          setSelectedTeam(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelModalOpen, editingMember, swappingMember, selectedTeam]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both Admin ID and Password.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    const res = await adminLogin(loginId.trim(), loginPassword);
    setLoginLoading(false);

    if (res.success) {
      const expiresAt = Date.now() + res.expiresInSeconds * 1000;
      const newSession: AdminSession = {
        token: res.token,
        name: res.name,
        adminId: res.adminId,
        role: res.role,
        expiresAt,
      };
      try {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(newSession));
      } catch {
        // Ignore
      }
      setSession(newSession);
      setLoginPassword('');
    } else {
      setLoginError(res.message || 'Authentication failed. Please verify credentials.');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (session?.token) {
      await adminLogout(session.token);
    }
    clearSession();
  };

  // Replace a team in local state after write
  const replaceTeamInState = (updatedTeam: TeamView) => {
    setTeams((prev) => prev.map((t) => (t.teamId === updatedTeam.teamId ? updatedTeam : t)));
    if (selectedTeam?.teamId === updatedTeam.teamId) {
      setSelectedTeam(updatedTeam);
    }
  };

  // Checkin Toggle
  const handleCheckinToggle = async (team: TeamView) => {
    if (isViewer || !session?.token || team.status === 'cancelled') return;
    setActionLoading(true);
    const newChecked = !team.checkedIn;
    const res = await adminCheckin(session.token, team.teamId, newChecked);
    setActionLoading(false);

    if (res.success) {
      replaceTeamInState(res.team);
    } else if (res.error === 'AUTH_REQUIRED') {
      clearSession();
    } else {
      alert(res.message || 'Check-in update failed.');
    }
  };

  // Cancel Team
  const handleCancelTeam = async () => {
    if (isViewer || !session?.token || !selectedTeam) return;
    setActionLoading(true);
    const note = cancelNote.trim() ? cancelNote.trim().slice(0, 200) : undefined;
    const res = await adminCancel(session.token, selectedTeam.teamId, note);
    setActionLoading(false);

    if (res.success) {
      replaceTeamInState(res.team);
      setCancelModalOpen(false);
      setCancelNote('');
    } else if (res.error === 'AUTH_REQUIRED') {
      clearSession();
    } else {
      setActionError(res.message || 'Failed to cancel team.');
    }
  };

  // Retry Email
  const handleRetryEmail = async (teamId: string) => {
    if (isViewer || !session?.token) return;
    setActionLoading(true);
    const res = await adminRetryEmail(session.token, teamId);
    setActionLoading(false);

    if (res.success) {
      replaceTeamInState(res.team);
      alert('Email retry queued.');
    } else if (res.error === 'AUTH_REQUIRED') {
      clearSession();
    } else {
      alert(res.message || 'Email retry failed.');
    }
  };

  // Make Captain
  const handleMakeCaptain = async (teamId: string, email: string) => {
    if (isViewer || !session?.token) return;
    if (!confirm(`Are you sure you want to promote ${email} to Captain?`)) return;

    setActionLoading(true);
    const res = await adminChangeCaptain(session.token, teamId, email);
    setActionLoading(false);

    if (res.success) {
      replaceTeamInState(res.team);
    } else if (res.error === 'AUTH_REQUIRED') {
      clearSession();
    } else {
      alert(res.message || 'Failed to change captain.');
    }
  };

  // Filtered Teams List
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      // Search query matches Team ID, team name, member name, or college
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = t.teamId.toLowerCase().includes(q);
        const matchesTeamName = t.teamName.toLowerCase().includes(q);
        const matchesCollege = t.college.name.toLowerCase().includes(q);
        const matchesMember = t.members.some((m) => m.fullName.toLowerCase().includes(q));
        if (!matchesId && !matchesTeamName && !matchesCollege && !matchesMember) return false;
      }

      // State Filter
      if (filterState !== 'all' && t.college.state !== filterState) return false;

      // Status Filter
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;

      // Checkin Filter
      if (filterCheckin === 'checked-in' && !t.checkedIn) return false;
      if (filterCheckin === 'not-checked-in' && t.checkedIn) return false;

      // Email Status Filter
      if (filterEmailStatus !== 'all' && t.emailStatus !== filterEmailStatus) return false;

      return true;
    });
  }, [teams, searchQuery, filterState, filterStatus, filterCheckin, filterEmailStatus]);

  // Export Handlers
  const handleExportCsv = async (kind: 'csv_all' | 'csv_captains') => {
    if (!session?.token) return;

    // Filter out cancelled teams for exports per rule
    const eligibleTeams = filteredTeams.filter((t) => t.status !== 'cancelled');
    const rows: Array<{
      teamId: string;
      teamName: string;
      role: string;
      fullName: string;
      email: string;
      phone: string;
      ageOnEvent: number;
      college: string;
      course: string;
      courseOther?: string;
      branch?: string;
      year: string;
      state: string;
    }> = [];

    eligibleTeams.forEach((t) => {
      t.members.forEach((m) => {
        if (kind === 'csv_captains' && m.role !== 'captain') return;
        rows.push({
          teamId: t.teamId,
          teamName: t.teamName,
          role: m.role,
          fullName: m.fullName,
          email: m.email,
          phone: m.phone,
          ageOnEvent: m.ageOnEvent,
          college: m.college || t.college.name,
          course: m.course,
          courseOther: m.courseOther,
          branch: m.branch,
          year: m.year,
          state: t.college.state,
        });
      });
    });

    // 1. Log export with backend first
    const logRes = await adminLogExport(session.token, kind, rows.length);
    if (!logRes.success) {
      alert(logRes.message || 'Failed to log export. Export aborted.');
      return;
    }

    // 2. Build CSV with UTF-8 BOM and formula sanitization
    const headers = [
      'TeamID',
      'TeamName',
      'Role',
      'FullName',
      'Email',
      'Phone',
      'AgeOnEvent',
      'College',
      'Course',
      'CourseOther',
      'Branch',
      'Year',
      'State',
    ];

    const csvLines = [headers.join(',')];
    rows.forEach((r) => {
      const line = [
        sanitizeCsvCell(r.teamId),
        sanitizeCsvCell(r.teamName),
        sanitizeCsvCell(r.role),
        sanitizeCsvCell(r.fullName),
        sanitizeCsvCell(r.email),
        sanitizeCsvCell(r.phone),
        sanitizeCsvCell(r.ageOnEvent),
        sanitizeCsvCell(r.college),
        sanitizeCsvCell(r.course),
        sanitizeCsvCell(r.courseOther || ''),
        sanitizeCsvCell(r.branch || ''),
        sanitizeCsvCell(r.year),
        sanitizeCsvCell(r.state),
      ].join(',');
      csvLines.push(line);
    });

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const filename = `masoulen_${kind}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsvFile(filename, csvContent);
  };

  const handleCopyEmails = async () => {
    if (!session?.token) return;

    const eligibleTeams = filteredTeams.filter((t) => t.status !== 'cancelled');
    const emailsSet = new Set<string>();
    eligibleTeams.forEach((t) => {
      t.members.forEach((m) => {
        if (m.email) emailsSet.add(m.email.toLowerCase().trim());
      });
    });

    const emailList = Array.from(emailsSet);

    // Call log export first
    const logRes = await adminLogExport(session.token, 'copy_emails', emailList.length);
    if (!logRes.success) {
      alert(logRes.message || 'Failed to log export.');
      return;
    }

    const textToCopy = emailList.join(', ');
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setExportNotice(`Copied ${emailList.length} emails to clipboard.`);
      setTimeout(() => setExportNotice(null), 3000);
    }
  };

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <div className="max-w-md mx-auto my-12 bg-theme-panel border border-theme-border p-8 rounded shadow-lg">
        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-theme-red font-semibold">Organizers Only</span>
          <h1 className="text-2xl font-bold text-theme-text mt-1">masoulen Admin</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Input
              id="adminId"
              label="Admin ID"
              placeholder="admin"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </div>

          {loginError && (
            <div className="p-3 bg-red-950/50 border border-theme-red rounded text-xs text-theme-red-light leading-relaxed">
              {loginError}
            </div>
          )}

          <Button type="submit" variant="primary" disabled={loginLoading} className="w-full">
            {loginLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    );
  }

  // --- DASHBOARD SCREEN ---
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-theme-panel border border-theme-border p-4 rounded flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-theme-red">masoulen Admin</h1>
          <span className="text-xs px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-text">
            {session.name} ({session.role})
          </span>
          {isViewer && (
            <span className="text-xs px-2 py-0.5 rounded bg-yellow-950/50 border border-yellow-800 text-yellow-300">
              View-Only
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => session.token && fetchData(session.token)}
            variant="secondary"
            className="text-xs"
            disabled={loadingData}
          >
            {loadingData ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button onClick={handleLogout} variant="secondary" className="text-xs text-theme-muted hover:text-theme-text">
            Logout
          </Button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded bg-green-950/60 border border-green-800 text-xs text-green-300">
          {exportNotice}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-theme-border text-sm font-medium gap-4">
        <button
          onClick={() => setActiveTab('teams')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'teams'
              ? 'border-theme-red text-theme-red font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-text'
          }`}
        >
          Teams &amp; Management ({filteredTeams.length})
        </button>
        <button
          onClick={() => setActiveTab('event-day')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'event-day'
              ? 'border-theme-red text-theme-red font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-text'
          }`}
        >
          Event-Day Mode
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-2 border-b-2 transition-colors ${
            activeTab === 'stats'
              ? 'border-theme-red text-theme-red font-bold'
              : 'border-transparent text-theme-muted hover:text-theme-text'
          }`}
        >
          Statistics
        </button>
      </div>

      {/* TAB 1: TEAMS & MANAGEMENT */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-theme-panel border border-theme-border p-3.5 rounded">
              <span className="text-xs text-theme-muted block font-medium">Total Teams</span>
              <span className="text-xl font-bold text-theme-text">{teams.length}</span>
            </div>
            <div className="bg-theme-panel border border-theme-border p-3.5 rounded">
              <span className="text-xs text-theme-muted block font-medium">Checked In</span>
              <span className="text-xl font-bold text-green-400">
                {teams.filter((t) => t.checkedIn).length}
              </span>
            </div>
            <div className="bg-theme-panel border border-theme-border p-3.5 rounded">
              <span className="text-xs text-theme-muted block font-medium">Cancelled</span>
              <span className="text-xl font-bold text-theme-red">
                {teams.filter((t) => t.status === 'cancelled').length}
              </span>
            </div>
            <div className="bg-theme-panel border border-theme-border p-3.5 rounded">
              <span className="text-xs text-theme-muted block font-medium">Emails Pending / Failed</span>
              <span className="text-xl font-bold text-yellow-400">
                {teams.filter((t) => t.emailStatus === 'pending').length} /{' '}
                {teams.filter((t) => t.emailStatus === 'failed').length}
              </span>
            </div>
          </div>

          {/* Filters & Export Toolbar */}
          <div className="bg-theme-panel border border-theme-border p-4 rounded space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <Input
                  id="adminSearch"
                  placeholder="Search Team ID, Team Name, Member, College..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <Select
                  id="filterState"
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                >
                  <option value="all">All States</option>
                  {config?.states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Select
                  id="filterStatus"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>

              <div>
                <Select
                  id="filterCheckin"
                  value={filterCheckin}
                  onChange={(e) => setFilterCheckin(e.target.value)}
                >
                  <option value="all">All Check-in</option>
                  <option value="checked-in">Checked In</option>
                  <option value="not-checked-in">Not Checked In</option>
                </Select>
              </div>

              <div>
                <Select
                  id="filterEmailStatus"
                  value={filterEmailStatus}
                  onChange={(e) => setFilterEmailStatus(e.target.value)}
                >
                  <option value="all">All Email Status</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between border-t border-theme-border pt-3 gap-2 text-xs">
              <div className="text-theme-muted">
                Showing {filteredTeams.length} of {teams.length} teams
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleExportCsv('csv_all')}
                  variant="secondary"
                  className="text-xs"
                >
                  Export Contacts CSV
                </Button>
                <Button
                  onClick={() => handleExportCsv('csv_captains')}
                  variant="secondary"
                  className="text-xs"
                >
                  Export Captains CSV
                </Button>
                <Button
                  onClick={handleCopyEmails}
                  variant="secondary"
                  className="text-xs"
                >
                  Copy Filtered Emails
                </Button>
              </div>
            </div>
          </div>

          {/* Teams Table */}
          <div className="bg-theme-panel border border-theme-border rounded overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-theme-surface/60 border-b border-theme-border text-theme-muted uppercase tracking-wider">
                <tr>
                  <th className="p-3">Team ID</th>
                  <th className="p-3">Team Name</th>
                  <th className="p-3">College</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Check-in</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {filteredTeams.map((t) => (
                  <tr key={t.teamId} className="hover:bg-theme-surface/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-theme-red">{t.teamId}</td>
                    <td className="p-3 font-semibold text-theme-text">{t.teamName}</td>
                    <td className="p-3 text-theme-muted max-w-xs truncate">{t.college.name}</td>
                    <td className="p-3 text-theme-muted">{t.college.state}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded capitalize ${
                          t.status === 'confirmed'
                            ? 'bg-green-950/50 border border-green-800 text-green-300'
                            : 'bg-red-950/50 border border-theme-red text-theme-red-light'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded capitalize ${
                          t.emailStatus === 'sent'
                            ? 'text-green-400'
                            : t.emailStatus === 'failed'
                            ? 'text-theme-red-light'
                            : 'text-yellow-400'
                        }`}
                      >
                        {t.emailStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleCheckinToggle(t)}
                        disabled={isViewer || t.status === 'cancelled' || actionLoading}
                        className={`px-2.5 py-1 rounded font-medium transition-colors ${
                          t.checkedIn
                            ? 'bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-200'
                            : 'bg-theme-surface hover:bg-theme-panel border border-theme-border text-theme-muted'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {t.checkedIn ? 'Checked In' : 'Not Checked'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        onClick={() => setSelectedTeam(t)}
                        variant="secondary"
                        className="text-xs px-2.5 py-1"
                      >
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredTeams.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-theme-muted">
                      No teams match your search or filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EVENT-DAY CHECK-IN MODE */}
      {activeTab === 'event-day' && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="bg-theme-panel border border-theme-border p-4 rounded">
            <span className="text-xs font-semibold text-theme-red uppercase tracking-wider block mb-1">
              Event-Day Check-in
            </span>
            <Input
              id="eventDaySearch"
              placeholder="Search Team ID (CASE-XXXX) or Captain Name..."
              className="text-lg py-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-3">
            {filteredTeams.map((t) => (
              <div
                key={t.teamId}
                className="bg-theme-panel border border-theme-border p-4 rounded shadow flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-theme-red">{t.teamId}</span>
                    <span className="text-xs px-2 py-0.5 rounded capitalize bg-theme-surface border border-theme-border">
                      {t.status}
                    </span>
                  </div>
                  <p className="font-semibold text-theme-text text-base mt-0.5">{t.teamName}</p>
                  <p className="text-xs text-theme-muted">
                    Captain: {t.members[0]?.fullName} ({t.members[0]?.phone})
                  </p>
                  <p className="text-xs text-theme-muted">{t.college.name}</p>
                </div>

                <div>
                  <button
                    onClick={() => handleCheckinToggle(t)}
                    disabled={isViewer || t.status === 'cancelled' || actionLoading}
                    className={`px-5 py-3 rounded-lg font-bold text-sm transition-colors shadow ${
                      t.checkedIn
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-theme-surface hover:bg-theme-panel border border-theme-border text-theme-text'
                    } disabled:opacity-50`}
                  >
                    {t.checkedIn ? 'Checked In' : 'Tap to Check In'}
                  </button>
                </div>
              </div>
            ))}
            {filteredTeams.length === 0 && (
              <div className="bg-theme-panel border border-theme-border p-8 rounded text-center text-theme-muted text-sm">
                No teams found matching search.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STATS (PURE CSS BARS) */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registered & Check-in Summary */}
            <div className="bg-theme-panel border border-theme-border p-5 rounded space-y-4">
              <h3 className="font-bold text-theme-text border-b border-theme-border pb-2">
                Registration Overview
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Registered Teams</span>
                  <span className="font-bold text-theme-text">{stats.registered.teams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Total Participants</span>
                  <span className="font-bold text-theme-text">{stats.registered.participants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Cancelled Teams</span>
                  <span className="font-bold text-theme-red">{stats.registered.cancelledTeams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Checked In</span>
                  <span className="font-bold text-green-400">
                    {stats.checkIn.checkedIn} / {stats.checkIn.registered}
                  </span>
                </div>
              </div>
            </div>

            {/* Email Queue */}
            <div className="bg-theme-panel border border-theme-border p-5 rounded space-y-4">
              <h3 className="font-bold text-theme-text border-b border-theme-border pb-2">
                Email Queue
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Pending</span>
                  <span className="font-bold text-yellow-400">{stats.emailQueue.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Sent</span>
                  <span className="font-bold text-green-400">{stats.emailQueue.sent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Failed</span>
                  <span className="font-bold text-theme-red">{stats.emailQueue.failed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Age Buckets Bar Chart */}
          <div className="bg-theme-panel border border-theme-border p-5 rounded space-y-3">
            <h3 className="font-bold text-theme-text text-sm">Age Distribution</h3>
            <div className="space-y-2">
              {stats.ageBuckets.map((bucket) => {
                const max = Math.max(...stats.ageBuckets.map((b) => b.count), 1);
                const pct = Math.round((bucket.count / max) * 100);
                return (
                  <div key={bucket.label} className="text-xs space-y-1">
                    <div className="flex justify-between text-theme-muted">
                      <span>{bucket.label}</span>
                      <span>{bucket.count}</span>
                    </div>
                    <div className="w-full bg-theme-surface h-2 rounded overflow-hidden">
                      <div className="bg-theme-red h-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* State Distribution */}
          <div className="bg-theme-panel border border-theme-border p-5 rounded space-y-3">
            <h3 className="font-bold text-theme-text text-sm">Distribution by State</h3>
            <div className="space-y-2">
              {stats.states.slice(0, 10).map((st) => {
                const max = Math.max(...stats.states.map((s) => s.count), 1);
                const pct = Math.round((st.count / max) * 100);
                return (
                  <div key={st.name} className="text-xs space-y-1">
                    <div className="flex justify-between text-theme-muted">
                      <span>{st.name}</span>
                      <span>{st.count}</span>
                    </div>
                    <div className="w-full bg-theme-surface h-2 rounded overflow-hidden">
                      <div className="bg-theme-red h-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Colleges */}
          <div className="bg-theme-panel border border-theme-border p-5 rounded space-y-3">
            <h3 className="font-bold text-theme-text text-sm">Top 15 Colleges</h3>
            <div className="space-y-2">
              {stats.topColleges.map((col) => {
                const max = Math.max(...stats.topColleges.map((c) => c.count), 1);
                const pct = Math.round((col.count / max) * 100);
                return (
                  <div key={col.name} className="text-xs space-y-1">
                    <div className="flex justify-between text-theme-muted">
                      <span className="truncate max-w-md">{col.name}</span>
                      <span>{col.count}</span>
                    </div>
                    <div className="w-full bg-theme-surface h-2 rounded overflow-hidden">
                      <div className="bg-theme-red h-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TEAM DETAIL MODAL (ESC TO CLOSE) */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-theme-panel border border-theme-border w-full max-w-3xl rounded-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto relative">
            <div className="flex justify-between items-start border-b border-theme-border pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-theme-red">{selectedTeam.teamId}</span>
                <h2 className="text-2xl font-bold text-theme-text">{selectedTeam.teamName}</h2>
                <p className="text-xs text-theme-muted">{selectedTeam.college.name} &bull; {selectedTeam.college.city}, {selectedTeam.college.state}</p>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-theme-muted hover:text-theme-text text-xl font-bold px-2"
              >
                &times;
              </button>
            </div>

            {/* Team Actions */}
            {!isViewer && (
              <div className="flex flex-wrap gap-2 pt-1 border-b border-theme-border pb-4">
                <Button
                  onClick={() => handleCheckinToggle(selectedTeam)}
                  variant="secondary"
                  className="text-xs"
                  disabled={selectedTeam.status === 'cancelled' || actionLoading}
                >
                  {selectedTeam.checkedIn ? 'Undo Check-in' : 'Check In Team'}
                </Button>

                {selectedTeam.emailStatus === 'failed' && (
                  <Button
                    onClick={() => handleRetryEmail(selectedTeam.teamId)}
                    variant="secondary"
                    className="text-xs"
                    disabled={actionLoading}
                  >
                    Retry Confirmation Email
                  </Button>
                )}

                {selectedTeam.status !== 'cancelled' && (
                  <Button
                    onClick={() => setCancelModalOpen(true)}
                    variant="danger"
                    className="text-xs"
                    disabled={actionLoading}
                  >
                    Cancel Team
                  </Button>
                )}
              </div>
            )}

            {/* Members Section */}
            <div>
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-wider mb-3">
                Team Members (4)
              </h3>
              <div className="space-y-3">
                {selectedTeam.members.map((m) => (
                  <div
                    key={m.email}
                    className="bg-theme-surface/40 border border-theme-border p-4 rounded space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-theme-text">{m.fullName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded capitalize font-medium ${
                            m.role === 'captain'
                              ? 'bg-theme-red text-white'
                              : 'bg-theme-panel border border-theme-border text-theme-muted'
                          }`}
                        >
                          {m.role}
                        </span>
                      </div>
                      <span className="text-theme-muted font-medium">Age on event: {m.ageOnEvent}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-theme-muted">
                      <div>Email: <span className="text-theme-text">{m.email}</span></div>
                      <div>Phone: <span className="text-theme-text">{m.phone}</span></div>
                      <div>College: <span className="text-theme-text">{m.college || selectedTeam.college.name}</span></div>
                      <div>Course: <span className="text-theme-text">{m.course} {m.branch ? `(${m.branch})` : ''} - Year {m.year}</span></div>
                    </div>

                    {/* Member Actions */}
                    {!isViewer && selectedTeam.status !== 'cancelled' && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-theme-border">
                        {m.role !== 'captain' && (
                          <Button
                            onClick={() => handleMakeCaptain(selectedTeam.teamId, m.email)}
                            variant="secondary"
                            className="text-[11px] px-2 py-1"
                            disabled={actionLoading}
                          >
                            Make Captain
                          </Button>
                        )}
                        {m.role !== 'captain' && (
                          <Button
                            onClick={() => setSwappingMember({ member: m, teamId: selectedTeam.teamId })}
                            variant="secondary"
                            className="text-[11px] px-2 py-1"
                            disabled={actionLoading}
                          >
                            Swap Member
                          </Button>
                        )}
                        <Button
                          onClick={() => setEditingMember({ member: m, teamId: selectedTeam.teamId })}
                          variant="secondary"
                          className="text-[11px] px-2 py-1"
                          disabled={actionLoading}
                        >
                          Edit Details
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-theme-border">
              <Button onClick={() => setSelectedTeam(null)} variant="secondary" className="text-xs">
                Close (Esc)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL TEAM CONFIRMATION MODAL */}
      {cancelModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-theme-panel border border-theme-red w-full max-w-md rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-bold text-theme-red">Cancel Team Registration</h3>
            <p className="text-xs text-theme-muted leading-relaxed">
              Cancelling team <strong className="text-theme-text">{selectedTeam.teamId} ({selectedTeam.teamName})</strong> will free member emails and phones, but the team name will remain reserved.
            </p>

            <div>
              <Input
                id="cancelNote"
                label="Cancellation Note (Optional, max 200 chars)"
                placeholder="Reason for cancellation..."
                maxLength={200}
                value={cancelNote}
                onChange={(e) => setCancelNote(e.target.value)}
              />
            </div>

            {actionError && (
              <p className="text-xs text-theme-red-light">{actionError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                onClick={() => setCancelModalOpen(false)}
                variant="secondary"
                disabled={actionLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleCancelTeam}
                variant="danger"
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
        <EditMemberModal
          member={editingMember.member}
          teamId={editingMember.teamId}
          token={session.token}
          config={config}
          onClose={() => setEditingMember(null)}
          onSuccess={(updated) => {
            replaceTeamInState(updated);
            setEditingMember(null);
          }}
        />
      )}

      {/* SWAP MEMBER MODAL */}
      {swappingMember && (
        <SwapMemberModal
          oldMember={swappingMember.member}
          teamId={swappingMember.teamId}
          token={session.token}
          config={config}
          onClose={() => setSwappingMember(null)}
          onSuccess={(updated) => {
            replaceTeamInState(updated);
            setSwappingMember(null);
          }}
        />
      )}
    </div>
  );
};

// --- SUBMODAL: EDIT MEMBER ---
interface EditMemberModalProps {
  member: AdminMemberView;
  teamId: string;
  token: string;
  config: GetConfigResponse | null;
  onClose: () => void;
  onSuccess: (team: TeamView) => void;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({
  member,
  teamId,
  token,
  config,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState(member.fullName);
  const [phone, setPhone] = useState(member.phone);
  const [course, setCourse] = useState(member.course);
  const [courseOther, setCourseOther] = useState(member.courseOther || '');
  const [branch, setBranch] = useState(member.branch || '');
  const [year, setYear] = useState(member.year);
  const [profileLink, setProfileLink] = useState(member.profileLink || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fields: Partial<MemberPayload> = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      course: course.trim(),
      year: year.trim(),
    };
    if (courseOther.trim()) fields.courseOther = courseOther.trim();
    if (branch.trim()) fields.branch = branch.trim();
    if (profileLink.trim()) fields.profileLink = profileLink.trim();

    const res = await adminEditMember(token, teamId, member.email, fields);
    setLoading(false);

    if (res.success) {
      onSuccess(res.team);
    } else {
      setError(res.message || 'Failed to update member.');
    }
  };

  const selectedCourseConfig = config?.courses.find((c) => c.name === course);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-theme-panel border border-theme-border w-full max-w-lg rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-theme-text">Edit Member Details</h3>
        <p className="text-xs text-theme-muted">{member.email}</p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <Input
              id="editFullName"
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              id="editPhone"
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <Select
              id="editCourse"
              label="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            >
              <option value="">Select course...</option>
              {config?.courses.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {selectedCourseConfig?.needsOther && (
            <div>
              <Input
                id="editCourseOther"
                label="Course Other"
                value={courseOther}
                onChange={(e) => setCourseOther(e.target.value)}
              />
            </div>
          )}

          {selectedCourseConfig?.needsBranch && (
            <div>
              <Select
                id="editBranch"
                label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="">Select branch...</option>
                {config?.branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Select
              id="editYear"
              label="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Select year...</option>
              {selectedCourseConfig?.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              id="editProfileLink"
              label="Profile Link"
              value={profileLink}
              onChange={(e) => setProfileLink(e.target.value)}
            />
          </div>

          {error && <p className="text-theme-red-light">{error}</p>}

          <div className="flex justify-end gap-3 pt-3">
            <Button onClick={onClose} variant="secondary" type="button" disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- SUBMODAL: SWAP MEMBER ---
interface SwapMemberModalProps {
  oldMember: AdminMemberView;
  teamId: string;
  token: string;
  config: GetConfigResponse | null;
  onClose: () => void;
  onSuccess: (team: TeamView) => void;
}

const SwapMemberModal: React.FC<SwapMemberModalProps> = ({
  oldMember,
  teamId,
  token,
  config,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [college, setCollege] = useState(oldMember.college);
  const [course, setCourse] = useState('');
  const [courseOther, setCourseOther] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const newMember: MemberPayload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      dob: dob.trim(),
      college: college.trim(),
      course: course.trim(),
      year: year.trim(),
    };
    if (courseOther.trim()) newMember.courseOther = courseOther.trim();
    if (branch.trim()) newMember.branch = branch.trim();
    if (profileLink.trim()) newMember.profileLink = profileLink.trim();

    const res = await adminSwapMember(token, teamId, oldMember.email, newMember);
    setLoading(false);

    if (res.success) {
      onSuccess(res.team);
    } else {
      setError(res.message || 'Failed to swap member.');
    }
  };

  const selectedCourseConfig = config?.courses.find((c) => c.name === course);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-theme-panel border border-theme-border w-full max-w-lg rounded-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-theme-text">Swap Team Member</h3>
        <p className="text-xs text-theme-muted">
          Replacing <strong className="text-theme-text">{oldMember.fullName}</strong> ({oldMember.email})
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <Input
              id="swapFullName"
              label="New Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              id="swapEmail"
              type="email"
              label="New Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              id="swapPhone"
              label="New Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              id="swapDob"
              type="date"
              label="Date of Birth"
              min={config?.dobMin}
              max={config?.dobMax}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
          </div>

          <div>
            <Input
              id="swapCollege"
              label="College Name"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              required
            />
          </div>

          <div>
            <Select
              id="swapCourse"
              label="Course"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            >
              <option value="">Select course...</option>
              {config?.courses.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {selectedCourseConfig?.needsOther && (
            <div>
              <Input
                id="swapCourseOther"
                label="Course Other"
                value={courseOther}
                onChange={(e) => setCourseOther(e.target.value)}
              />
            </div>
          )}

          {selectedCourseConfig?.needsBranch && (
            <div>
              <Select
                id="swapBranch"
                label="Branch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              >
                <option value="">Select branch...</option>
                {config?.branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <Select
              id="swapYear"
              label="Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            >
              <option value="">Select year...</option>
              {selectedCourseConfig?.years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              id="swapProfileLink"
              label="Profile Link"
              value={profileLink}
              onChange={(e) => setProfileLink(e.target.value)}
            />
          </div>

          {error && <p className="text-theme-red-light">{error}</p>}

          <div className="flex justify-end gap-3 pt-3">
            <Button onClick={onClose} variant="secondary" type="button" disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Swapping...' : 'Confirm Swap'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
