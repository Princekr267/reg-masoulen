import React, { useState } from 'react';
import { useRegistration } from '../hooks/useRegistration';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { FieldError } from './ui/FieldError';
import { copyToClipboard } from '../lib/utils';
import type { CourseConfig } from '../services/api';

export const RegistrationForm: React.FC = () => {
  const {
    step,
    config,
    configLoading,
    configError,
    formData,
    touchedFields,
    fieldErrors,
    generalError,
    isSubmitting,
    isRegistrationClosed,
    teamNameStatus,
    confirmation,
    updateTeamName,
    updateCollege,
    updateHowHeard,
    updateMember,
    setSameCollegeAsCaptain,
    updateConsent,
    setFieldTouched,
    goToNextStep,
    goToPrevStep,
    submitRegistration,
  } = useRegistration();

  const [copied, setCopied] = useState(false);

  // --- Loading / Config Error Screen ---
  if (configLoading) {
    return (
      <div className="bg-theme-panel border border-theme-border p-8 rounded text-center">
        <p className="text-theme-muted animate-pulse">Loading registration parameters...</p>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="bg-theme-panel border border-theme-border p-8 rounded text-center">
        <h2 className="text-xl font-bold text-theme-red mb-2">Service Unavailable</h2>
        <p className="text-theme-muted mb-4">{configError}</p>
        <Button onClick={() => window.location.reload()} variant="secondary">
          Reload Page
        </Button>
      </div>
    );
  }

  // --- Closed Screen ---
  if (isRegistrationClosed || (config && !config.open)) {
    return (
      <div className="bg-theme-panel border border-theme-border p-8 rounded text-center max-w-xl mx-auto">
        <div className="inline-block px-3 py-1 rounded bg-theme-surface text-theme-red text-sm font-semibold mb-4 border border-theme-border">
          Registration Closed
        </div>
        <h1 className="text-3xl font-bold text-theme-text mb-3">Registration is Now Closed</h1>
        <p className="text-theme-muted mb-6 leading-relaxed">
          The deadline for masoulen registration has passed. Teams already registered can check their registration status
          using their Team ID and captain email.
        </p>
        <div className="flex justify-center gap-4">
          <a
            href="/status"
            className="px-5 py-2 rounded bg-theme-surface hover:bg-theme-panel border border-theme-border text-theme-text font-medium text-sm transition-colors"
          >
            Check Status
          </a>
          <a
            href="/"
            className="px-5 py-2 rounded bg-theme-surface hover:bg-theme-panel border border-theme-border text-theme-text font-medium text-sm transition-colors"
          >
            Home
          </a>
        </div>
      </div>
    );
  }

  // --- Confirmation Screen ---
  if (confirmation) {
    const handleCopy = async () => {
      const ok = await copyToClipboard(confirmation.teamId);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <div className="space-y-6">
        <div className="print-slip bg-theme-panel border border-theme-border p-6 md:p-8 rounded shadow-lg">
          <div className="border-b border-theme-border pb-4 mb-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-theme-red">
              Registration Slip
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-theme-text mt-1">
              Registration Confirmed
            </h1>
            <p className="text-sm text-theme-muted mt-1">
              masoulen | 21–22 November 2026 | Delhi
            </p>
          </div>

          <div className="bg-theme-surface border border-theme-border p-4 rounded mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-theme-muted uppercase tracking-wider font-medium">Team ID</p>
              <p className="text-3xl font-mono font-bold text-theme-red tracking-wider mt-0.5">
                {confirmation.teamId}
              </p>
            </div>
            <div className="no-print">
              <Button onClick={handleCopy} variant="secondary" className="text-sm">
                {copied ? 'Copied!' : 'Copy Team ID'}
              </Button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <p className="text-xs text-theme-muted uppercase font-medium">Team Name</p>
              <p className="text-lg font-semibold text-theme-text">{confirmation.teamName}</p>
            </div>

            <div>
              <p className="text-xs text-theme-muted uppercase font-medium mb-2">Team Members</p>
              <ul className="divide-y divide-theme-border bg-theme-surface/50 border border-theme-border rounded">
                {confirmation.members.map((member, idx) => (
                  <li key={idx} className="p-3 flex items-center justify-between">
                    <span className="font-medium text-theme-text">{member.fullName}</span>
                    <span className="text-xs px-2 py-0.5 rounded capitalize bg-theme-panel border border-theme-border text-theme-muted">
                      {member.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-4 bg-theme-surface/50 border border-theme-border rounded text-xs text-theme-muted leading-relaxed mb-6">
            <strong className="text-theme-text">Important:</strong> Keep your Team ID safe. You will need it along with the captain’s email to verify registration and check in at the venue. Carry valid photo IDs for all 4 members.
          </div>

          <div className="no-print flex flex-wrap gap-4 pt-2">
            {confirmation.groupLink && (
              <a
                href={confirmation.groupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 rounded bg-green-700 hover:bg-green-800 text-white font-medium text-sm transition-colors inline-flex items-center gap-2"
              >
                Join WhatsApp Group
              </a>
            )}
            <Button onClick={() => window.print()} variant="secondary" className="text-sm">
              Print Slip
            </Button>
            <a
              href={`/status`}
              className="px-5 py-2.5 rounded border border-theme-border text-theme-muted hover:text-theme-text text-sm transition-colors inline-flex items-center"
            >
              Go to Status Page
            </a>
          </div>
        </div>
      </div>
    );
  }

  // --- Active Registration Form ---
  const renderCourseInputs = (
    memberIndex: 0 | 1 | 2 | 3,
    member: typeof formData.members[0]
  ) => {
    const coursePrefix = `members.${memberIndex}`;
    const selectedCourseConfig: CourseConfig | undefined = config?.courses.find(
      (c) => c.name === member.course
    );

    return (
      <div className="space-y-4">
        <div>
          <Select
            id={`${coursePrefix}.course`}
            label="Course"
            value={member.course}
            error={touchedFields[`${coursePrefix}.course`] ? fieldErrors[`${coursePrefix}.course`] : undefined}
            onBlur={() => setFieldTouched(`${coursePrefix}.course`)}
            onChange={(e) => updateMember(memberIndex, 'course', e.target.value)}
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
              id={`${coursePrefix}.courseOther`}
              label="Specify Course Name"
              placeholder="e.g. B.Des / B.Arch"
              value={member.courseOther || ''}
              error={touchedFields[`${coursePrefix}.courseOther`] ? fieldErrors[`${coursePrefix}.courseOther`] : undefined}
              onBlur={() => setFieldTouched(`${coursePrefix}.courseOther`)}
              onChange={(e) => updateMember(memberIndex, 'courseOther', e.target.value)}
            />
          </div>
        )}

        {selectedCourseConfig?.needsBranch && (
          <div>
            <Select
              id={`${coursePrefix}.branch`}
              label="Branch / Specialization"
              value={member.branch || ''}
              error={touchedFields[`${coursePrefix}.branch`] ? fieldErrors[`${coursePrefix}.branch`] : undefined}
              onBlur={() => setFieldTouched(`${coursePrefix}.branch`)}
              onChange={(e) => updateMember(memberIndex, 'branch', e.target.value)}
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
            id={`${coursePrefix}.year`}
            label="Year of Study"
            value={member.year}
            error={touchedFields[`${coursePrefix}.year`] ? fieldErrors[`${coursePrefix}.year`] : undefined}
            onBlur={() => setFieldTouched(`${coursePrefix}.year`)}
            onChange={(e) => updateMember(memberIndex, 'year', e.target.value)}
            disabled={!member.course}
          >
            <option value="">Select year...</option>
            {selectedCourseConfig?.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Venue Banner */}
      <div className="p-4 rounded bg-theme-panel border-l-4 border-theme-red border-theme-border text-sm leading-relaxed">
        <p className="font-semibold text-theme-text">Important Notice:</p>
        <p className="text-theme-muted mt-1">
          Venue in Delhi, no accommodation, no food, no merch. Ages 16 to 30 on the event day. Every member must carry a valid photo ID (school or college ID).
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b border-theme-border pb-3 text-xs md:text-sm">
        {[
          { num: 1, label: 'Team & College' },
          { num: 2, label: 'Captain' },
          { num: 3, label: 'Members 2–4' },
          { num: 4, label: 'Review & Submit' },
        ].map((s) => (
          <div
            key={s.num}
            className={`flex items-center gap-1.5 font-medium ${
              step === s.num
                ? 'text-theme-red font-bold'
                : step > s.num
                ? 'text-theme-text'
                : 'text-theme-muted'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                step === s.num
                  ? 'bg-theme-red text-white'
                  : step > s.num
                  ? 'bg-theme-surface border border-theme-border text-theme-text'
                  : 'bg-theme-panel border border-theme-border text-theme-muted'
              }`}
            >
              {s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-theme-panel border border-theme-border p-6 rounded">
        {/* Step 1: Team and College */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-theme-text">Step 1: Team &amp; College Information</h2>

            <div>
              <Input
                id="teamName"
                label="Team Name"
                placeholder="e.g. ByteDetectives"
                value={formData.teamName}
                error={touchedFields.teamName ? fieldErrors.teamName : undefined}
                onBlur={() => setFieldTouched('teamName')}
                onChange={(e) => updateTeamName(e.target.value)}
              />
              {teamNameStatus.checking && (
                <p className="text-xs text-theme-muted mt-1">Checking name availability...</p>
              )}
              {!teamNameStatus.checking && teamNameStatus.message && (
                <p
                  className={`text-xs mt-1 ${
                    teamNameStatus.available ? 'text-green-400' : 'text-theme-red-light'
                  }`}
                >
                  {teamNameStatus.message}
                </p>
              )}
            </div>

            <div>
              <Input
                id="college.name"
                label="College / School Name"
                placeholder="e.g. Delhi Technological University"
                value={formData.college.name}
                error={touchedFields['college.name'] ? fieldErrors['college.name'] : undefined}
                onBlur={() => setFieldTouched('college.name')}
                onChange={(e) => updateCollege('name', e.target.value)}
              />
            </div>

            <div>
              <Input
                id="college.address"
                label="College Address (Optional)"
                placeholder="Campus address or landmark"
                value={formData.college.address || ''}
                error={touchedFields['college.address'] ? fieldErrors['college.address'] : undefined}
                onBlur={() => setFieldTouched('college.address')}
                onChange={(e) => updateCollege('address', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Input
                  id="college.city"
                  label="City"
                  placeholder="e.g. New Delhi"
                  value={formData.college.city}
                  error={touchedFields['college.city'] ? fieldErrors['college.city'] : undefined}
                  onBlur={() => setFieldTouched('college.city')}
                  onChange={(e) => updateCollege('city', e.target.value)}
                />
              </div>

              <div>
                <Select
                  id="college.state"
                  label="State / UT"
                  value={formData.college.state}
                  error={touchedFields['college.state'] ? fieldErrors['college.state'] : undefined}
                  onBlur={() => setFieldTouched('college.state')}
                  onChange={(e) => updateCollege('state', e.target.value)}
                >
                  <option value="">Select state...</option>
                  {config?.states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Input
                  id="college.pin"
                  label="PIN Code"
                  placeholder="6-digit PIN"
                  maxLength={6}
                  value={formData.college.pin}
                  error={touchedFields['college.pin'] ? fieldErrors['college.pin'] : undefined}
                  onBlur={() => setFieldTouched('college.pin')}
                  onChange={(e) => updateCollege('pin', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Select
                id="howHeard"
                label="How did you hear about masoulen?"
                value={formData.howHeard}
                error={touchedFields.howHeard ? fieldErrors.howHeard : undefined}
                onBlur={() => setFieldTouched('howHeard')}
                onChange={(e) => updateHowHeard(e.target.value)}
              >
                <option value="">Select an option...</option>
                {config?.howHeardOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Captain */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-red uppercase tracking-wider">
                Team Captain
              </span>
              <h2 className="text-xl font-bold text-theme-text mt-1">Step 2: Captain Details</h2>
              <p className="text-xs text-theme-muted mt-0.5">
                Confirmation emails and status updates will be sent to the captain.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id="members.0.fullName"
                  label="Full Name"
                  placeholder="As shown on photo ID"
                  value={formData.members[0].fullName}
                  error={touchedFields['members.0.fullName'] ? fieldErrors['members.0.fullName'] : undefined}
                  onBlur={() => setFieldTouched('members.0.fullName')}
                  onChange={(e) => updateMember(0, 'fullName', e.target.value)}
                />
              </div>

              <div>
                <Input
                  id="members.0.email"
                  type="email"
                  label="Email Address"
                  placeholder="captain@example.com"
                  value={formData.members[0].email}
                  error={touchedFields['members.0.email'] ? fieldErrors['members.0.email'] : undefined}
                  onBlur={() => setFieldTouched('members.0.email')}
                  onChange={(e) => updateMember(0, 'email', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  id="members.0.phone"
                  type="tel"
                  label="Phone Number"
                  placeholder="10-digit mobile number"
                  maxLength={13}
                  value={formData.members[0].phone}
                  error={touchedFields['members.0.phone'] ? fieldErrors['members.0.phone'] : undefined}
                  onBlur={() => setFieldTouched('members.0.phone')}
                  onChange={(e) => updateMember(0, 'phone', e.target.value)}
                />
              </div>

              <div>
                <Input
                  id="members.0.dob"
                  type="date"
                  label="Date of Birth (Ages 16–30 on 21 Nov 2026)"
                  min={config?.dobMin}
                  max={config?.dobMax}
                  value={formData.members[0].dob}
                  error={touchedFields['members.0.dob'] ? fieldErrors['members.0.dob'] : undefined}
                  onBlur={() => setFieldTouched('members.0.dob')}
                  onChange={(e) => updateMember(0, 'dob', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Input
                id="members.0.college"
                label="College / School Name"
                value={formData.members[0].college || formData.college.name}
                disabled
                className="opacity-75 cursor-not-allowed bg-theme-surface"
              />
              <p className="text-xs text-theme-muted mt-1">Captain&apos;s college matches the team college.</p>
            </div>

            {renderCourseInputs(0, formData.members[0])}

            <div>
              <Input
                id="members.0.profileLink"
                type="url"
                label="GitHub or LinkedIn Profile (Optional)"
                placeholder="https://github.com/username"
                value={formData.members[0].profileLink || ''}
                error={touchedFields['members.0.profileLink'] ? fieldErrors['members.0.profileLink'] : undefined}
                onBlur={() => setFieldTouched('members.0.profileLink')}
                onChange={(e) => updateMember(0, 'profileLink', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3: Members 2 to 4 */}
        {step === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-theme-text">Step 3: Team Members (2, 3, and 4)</h2>
              <p className="text-xs text-theme-muted mt-1">
                Teams must have exactly 4 members. Every member must be between 16 and 30 years old on 21 Nov 2026.
              </p>
            </div>

            {([1, 2, 3] as const).map((mIdx) => {
              const mem = formData.members[mIdx];
              const prefix = `members.${mIdx}`;
              const sameCollege = formData.memberCollegeSameAsCaptain[mIdx - 1];

              return (
                <div key={mIdx} className="border border-theme-border bg-theme-surface/30 p-5 rounded space-y-4">
                  <div className="flex items-center justify-between border-b border-theme-border pb-2">
                    <h3 className="font-semibold text-theme-text">Member {mIdx + 1}</h3>
                    <label className="flex items-center gap-2 text-xs text-theme-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameCollege}
                        onChange={(e) => setSameCollegeAsCaptain((mIdx - 1) as 0 | 1 | 2, e.target.checked)}
                        className="rounded border-theme-border text-theme-red focus:ring-0"
                      />
                      Same college as captain
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        id={`${prefix}.fullName`}
                        label="Full Name"
                        placeholder="As shown on photo ID"
                        value={mem.fullName}
                        error={touchedFields[`${prefix}.fullName`] ? fieldErrors[`${prefix}.fullName`] : undefined}
                        onBlur={() => setFieldTouched(`${prefix}.fullName`)}
                        onChange={(e) => updateMember(mIdx, 'fullName', e.target.value)}
                      />
                    </div>

                    <div>
                      <Input
                        id={`${prefix}.email`}
                        type="email"
                        label="Email Address"
                        placeholder={`member${mIdx + 1}@example.com`}
                        value={mem.email}
                        error={touchedFields[`${prefix}.email`] ? fieldErrors[`${prefix}.email`] : undefined}
                        onBlur={() => setFieldTouched(`${prefix}.email`)}
                        onChange={(e) => updateMember(mIdx, 'email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        id={`${prefix}.phone`}
                        type="tel"
                        label="Phone Number"
                        placeholder="10-digit mobile number"
                        maxLength={13}
                        value={mem.phone}
                        error={touchedFields[`${prefix}.phone`] ? fieldErrors[`${prefix}.phone`] : undefined}
                        onBlur={() => setFieldTouched(`${prefix}.phone`)}
                        onChange={(e) => updateMember(mIdx, 'phone', e.target.value)}
                      />
                    </div>

                    <div>
                      <Input
                        id={`${prefix}.dob`}
                        type="date"
                        label="Date of Birth"
                        min={config?.dobMin}
                        max={config?.dobMax}
                        value={mem.dob}
                        error={touchedFields[`${prefix}.dob`] ? fieldErrors[`${prefix}.dob`] : undefined}
                        onBlur={() => setFieldTouched(`${prefix}.dob`)}
                        onChange={(e) => updateMember(mIdx, 'dob', e.target.value)}
                      />
                    </div>
                  </div>

                  {!sameCollege && (
                    <div>
                      <Input
                        id={`${prefix}.college`}
                        label="College / School Name"
                        placeholder="College name"
                        value={mem.college}
                        error={touchedFields[`${prefix}.college`] ? fieldErrors[`${prefix}.college`] : undefined}
                        onBlur={() => setFieldTouched(`${prefix}.college`)}
                        onChange={(e) => updateMember(mIdx, 'college', e.target.value)}
                      />
                    </div>
                  )}

                  {renderCourseInputs(mIdx, mem)}

                  <div>
                    <Input
                      id={`${prefix}.profileLink`}
                      type="url"
                      label="GitHub or LinkedIn Profile (Optional)"
                      placeholder="https://github.com/username"
                      value={mem.profileLink || ''}
                      error={touchedFields[`${prefix}.profileLink`] ? fieldErrors[`${prefix}.profileLink`] : undefined}
                      onBlur={() => setFieldTouched(`${prefix}.profileLink`)}
                      onChange={(e) => updateMember(mIdx, 'profileLink', e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Step 4: Review and Consents */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-theme-text">Step 4: Review &amp; Submit</h2>
              <p className="text-xs text-theme-muted mt-1">
                Please verify your details before submitting. Both consents are mandatory.
              </p>
            </div>

            {/* Team Summary */}
            <div className="bg-theme-surface/40 border border-theme-border p-4 rounded space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between border-b border-theme-border pb-2">
                <div>
                  <p className="text-xs text-theme-muted uppercase font-medium">Team Name</p>
                  <p className="text-lg font-bold text-theme-red">{formData.teamName}</p>
                </div>
                <div className="mt-2 sm:mt-0 sm:text-right">
                  <p className="text-xs text-theme-muted uppercase font-medium">College / School</p>
                  <p className="text-sm font-semibold text-theme-text">{formData.college.name}</p>
                  <p className="text-xs text-theme-muted">
                    {formData.college.city}, {formData.college.state} - {formData.college.pin}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-theme-muted uppercase font-medium mb-2">Team Members</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {formData.members.map((m, idx) => (
                    <div key={idx} className="p-2.5 rounded bg-theme-panel border border-theme-border text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-theme-text">{m.fullName || `Member ${idx + 1}`}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-theme-surface text-theme-muted uppercase">
                          {idx === 0 ? 'Captain' : `Member ${idx + 1}`}
                        </span>
                      </div>
                      <p className="text-theme-muted">{m.email}</p>
                      <p className="text-theme-muted">{m.phone} | DOB: {m.dob}</p>
                      <p className="text-theme-muted">{m.course} {m.year ? `(${m.year})` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Consents */}
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  id="consent.data"
                  type="checkbox"
                  checked={formData.consent.data}
                  onChange={(e) => updateConsent('data', e.target.checked)}
                  className="mt-1 rounded border-theme-border text-theme-red focus:ring-0"
                />
                <span className="text-xs leading-relaxed text-theme-text">
                  All listed members agreed to share their details with the organizers, and I accept the rules.
                </span>
              </label>
              <FieldError error={touchedFields['consent.data'] ? fieldErrors['consent.data'] : undefined} />

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  id="consent.venue"
                  type="checkbox"
                  checked={formData.consent.venue}
                  onChange={(e) => updateConsent('venue', e.target.checked)}
                  className="mt-1 rounded border-theme-border text-theme-red focus:ring-0"
                />
                <span className="text-xs leading-relaxed text-theme-text">
                  I understand the venue is in Delhi, with no accommodation, no food and no merch, and all members are between 16 and 30 on the event day and will carry a valid photo ID (school or college ID).
                </span>
              </label>
              <FieldError error={touchedFields['consent.venue'] ? fieldErrors['consent.venue'] : undefined} />
            </div>

            {generalError && (
              <div className="p-3 bg-red-950/50 border border-theme-red rounded text-sm text-theme-red-light">
                {generalError}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 mt-6 border-t border-theme-border">
          {step > 1 ? (
            <Button onClick={goToPrevStep} variant="secondary" disabled={isSubmitting}>
              Previous
            </Button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <Button onClick={goToNextStep} variant="primary">
              Next Step
            </Button>
          ) : (
            <Button onClick={submitRegistration} variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting Registration...' : 'Submit Registration'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
