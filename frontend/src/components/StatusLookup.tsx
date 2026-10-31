import React, { useState } from 'react';
import { lookupStatus, type LookupStatusResponse } from '../services/api';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

export const StatusLookup: React.FC = () => {
  const [teamId, setTeamId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<LookupStatusResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = teamId.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanId || !cleanEmail) {
      setErrorMessage('Please enter both Team ID and Captain Email.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setResult(null);

    const res = await lookupStatus(cleanId, cleanEmail);
    setLoading(false);

    if (res.success) {
      setResult(res);
    } else {
      if (res.error === 'NOT_FOUND') {
        setErrorMessage('No registration found with those details. Please verify your Team ID and Captain Email.');
      } else if (res.error === 'THROTTLED') {
        setErrorMessage('Too many failed lookup attempts. Please wait 15 minutes before trying again.');
      } else {
        setErrorMessage(res.message || 'Unable to check status at this time. Please try again.');
      }
    }
  };

  const handleReset = () => {
    setTeamId('');
    setEmail('');
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-theme-panel border border-theme-border p-6 rounded shadow-md">
        <h1 className="text-2xl font-bold text-theme-text mb-1">Check Registration Status</h1>
        <p className="text-xs text-theme-muted mb-6">
          Enter your Team ID and the captain’s email address used during registration.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                id="teamId"
                label="Team ID"
                placeholder="CASE-XXXX"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value.toUpperCase())}
                autoCapitalize="characters"
                required
              />
            </div>

            <div>
              <Input
                id="email"
                type="email"
                label="Captain's Email"
                placeholder="captain@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-950/50 border border-theme-red rounded text-xs text-theme-red-light leading-relaxed">
                {errorMessage}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? 'Searching...' : 'Check Status'}
            </Button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="bg-theme-surface border border-theme-border p-4 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs text-theme-muted uppercase font-semibold">Team ID</span>
                <p className="text-2xl font-mono font-bold text-theme-red">{result.teamId}</p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded font-medium capitalize border ${
                    result.status === 'confirmed'
                      ? 'bg-green-950/60 border-green-800 text-green-300'
                      : 'bg-red-950/60 border-theme-red text-theme-red-light'
                  }`}
                >
                  Status: {result.status}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded font-medium border ${
                    result.checkedIn
                      ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                      : 'bg-theme-panel border-theme-border text-theme-muted'
                  }`}
                >
                  {result.checkedIn ? 'Checked In' : 'Not Checked In'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-theme-muted uppercase font-semibold">Team Name</span>
              <p className="text-lg font-bold text-theme-text">{result.teamName}</p>
            </div>

            <div>
              <span className="text-xs text-theme-muted uppercase font-semibold block mb-2">Registered Members</span>
              <ul className="divide-y divide-theme-border bg-theme-surface/50 border border-theme-border rounded">
                {result.members.map((mem, idx) => (
                  <li key={idx} className="p-3 flex items-center justify-between text-sm">
                    <span className="font-medium text-theme-text">{mem.fullName}</span>
                    <span className="text-xs px-2 py-0.5 rounded capitalize bg-theme-panel border border-theme-border text-theme-muted">
                      {mem.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              <Button onClick={handleReset} variant="secondary" className="w-full text-sm">
                Check Another Registration
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <a href="/" className="text-xs text-theme-muted hover:text-theme-text transition-colors">
          &larr; Back to Home
        </a>
      </div>
    </div>
  );
};
