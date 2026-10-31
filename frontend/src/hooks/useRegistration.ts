import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getConfig,
  checkTeamName,
  registerTeam,
  type GetConfigResponse,
  type RegisterPayload,
  type RegisterResponse,
  type MemberPayload,
} from '../services/api';
import {
  validateStep1,
  validateMember,
  validateDob,
  validateDuplicates,
  validateStep4,
  validateTeamName,
  type RegistrationFormData,
  type MemberFormData,
} from '../lib/validation';
import { collapseWhitespace, cleanPhone } from '../lib/utils';

const DRAFT_STORAGE_KEY = 'masoulen:draft';
const CONFIRMATION_STORAGE_KEY = 'masoulen:confirmation';

const initialMember = (): MemberFormData => ({
  fullName: '',
  email: '',
  phone: '',
  dob: '',
  college: '',
  course: '',
  courseOther: '',
  branch: '',
  year: '',
  profileLink: '',
});

const initialFormData = (): RegistrationFormData => ({
  teamName: '',
  college: {
    name: '',
    address: '',
    city: '',
    state: '',
    pin: '',
  },
  howHeard: '',
  consent: {
    data: false,
    venue: false,
  },
  members: [initialMember(), initialMember(), initialMember(), initialMember()],
  memberCollegeSameAsCaptain: [true, true, true],
});

export function useRegistration() {
  const [step, setStep] = useState<number>(1);
  const [config, setConfig] = useState<GetConfigResponse | null>(null);
  const [configLoading, setConfigLoading] = useState<boolean>(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);

  const [formData, setFormData] = useState<RegistrationFormData>(() => {
    // Check confirmation first
    const savedConfirmation = sessionStorage.getItem(CONFIRMATION_STORAGE_KEY);
    if (savedConfirmation) return initialFormData();

    // Try restoring draft
    try {
      const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        return {
          teamName: parsed.teamName || '',
          college: parsed.college || { name: '', address: '', city: '', state: '', pin: '' },
          howHeard: parsed.howHeard || '',
          consent: { data: false, venue: false }, // Never restore consent
          members: Array.isArray(parsed.members) && parsed.members.length === 4
            ? (parsed.members as [MemberFormData, MemberFormData, MemberFormData, MemberFormData])
            : [initialMember(), initialMember(), initialMember(), initialMember()],
          memberCollegeSameAsCaptain: Array.isArray(parsed.memberCollegeSameAsCaptain) && parsed.memberCollegeSameAsCaptain.length === 3
            ? (parsed.memberCollegeSameAsCaptain as [boolean, boolean, boolean])
            : [true, true, true],
        };
      }
    } catch {
      // Ignore parse failure
    }
    return initialFormData();
  });

  const [confirmation, setConfirmation] = useState<RegisterResponse | null>(() => {
    try {
      const saved = sessionStorage.getItem(CONFIRMATION_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return null;
  });

  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRegistrationClosed, setIsRegistrationClosed] = useState<boolean>(false);

  // Live team name checking
  const [teamNameStatus, setTeamNameStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  // Idempotency Key
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  const formModifiedAfterErrorRef = useRef<boolean>(false);

  // Load config on mount
  useEffect(() => {
    let mounted = true;
    async function fetchConfig() {
      setConfigLoading(true);
      const res = await getConfig();
      if (!mounted) return;
      setConfigLoading(false);

      if (res.success) {
        setConfig(res);
        if (!res.open) {
          setIsRegistrationClosed(true);
        }
        if (res.serverTime) {
          const serverTimeMs = new Date(res.serverTime).getTime();
          setServerOffsetMs(serverTimeMs - Date.now());
        }
      } else {
        setConfigError(res.message || 'Failed to load configuration.');
      }
    }
    fetchConfig();
    return () => {
      mounted = false;
    };
  }, []);

  // Autosave draft on form change (never includes consent)
  useEffect(() => {
    if (confirmation) return;
    try {
      const draftPayload = {
        teamName: formData.teamName,
        college: formData.college,
        howHeard: formData.howHeard,
        members: formData.members,
        memberCollegeSameAsCaptain: formData.memberCollegeSameAsCaptain,
        step,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
    } catch {
      // Storage quota or disabled
    }
  }, [formData, step, confirmation]);

  // Debounced check_team_name
  const teamNameCheckTimerRef = useRef<number | null>(null);
  useEffect(() => {
    const rawName = formData.teamName;
    const formatErr = validateTeamName(rawName);

    if (teamNameCheckTimerRef.current) {
      clearTimeout(teamNameCheckTimerRef.current);
    }

    if (formatErr || !rawName.trim()) {
      setTeamNameStatus({ checking: false });
      return;
    }

    setTeamNameStatus({ checking: true });
    teamNameCheckTimerRef.current = window.setTimeout(async () => {
      const res = await checkTeamName(collapseWhitespace(rawName));
      if (res.success) {
        setTeamNameStatus({
          checking: false,
          available: res.available,
          message: res.message || (res.available ? 'Team name is available' : 'Team name is taken'),
        });
      } else {
        setTeamNameStatus({
          checking: false,
          available: false,
          message: res.message || 'Unable to check name availability',
        });
      }
    }, 500);

    return () => {
      if (teamNameCheckTimerRef.current) clearTimeout(teamNameCheckTimerRef.current);
    };
  }, [formData.teamName]);

  // Form field update helpers
  const markDirty = () => {
    if (formModifiedAfterErrorRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
      formModifiedAfterErrorRef.current = false;
    }
  };

  const updateTeamName = (name: string) => {
    markDirty();
    setFormData((prev) => ({ ...prev, teamName: name }));
  };

  const updateCollege = (field: keyof typeof formData.college, value: string) => {
    markDirty();
    setFormData((prev) => {
      const updatedCollege = { ...prev.college, [field]: value };
      const updatedMembers = [...prev.members] as [MemberFormData, MemberFormData, MemberFormData, MemberFormData];

      // Captain college always equals team college
      if (field === 'name') {
        updatedMembers[0] = { ...updatedMembers[0], college: value };
        // Sync members with "same college" toggle
        for (let i = 1; i <= 3; i++) {
          if (prev.memberCollegeSameAsCaptain[i - 1]) {
            updatedMembers[i] = { ...updatedMembers[i], college: value };
          }
        }
      }

      return {
        ...prev,
        college: updatedCollege,
        members: updatedMembers,
      };
    });
  };

  const updateHowHeard = (howHeard: string) => {
    markDirty();
    setFormData((prev) => ({ ...prev, howHeard }));
  };

  const updateMember = (
    index: 0 | 1 | 2 | 3,
    field: keyof MemberFormData,
    value: string
  ) => {
    markDirty();

    // Show DOB error immediately as soon as entered
    if (field === 'dob') {
      const prefix = `members.${index}.dob`;
      setTouchedFields((prev) => ({ ...prev, [prefix]: true }));
      const dobErr = validateDob(value, config);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (dobErr) next[prefix] = dobErr;
        else delete next[prefix];
        return next;
      });
    }

    setFormData((prev) => {
      const updatedMembers = [...prev.members] as [MemberFormData, MemberFormData, MemberFormData, MemberFormData];
      const member = { ...updatedMembers[index], [field]: value };

      // Handle course change cascading clears
      if (field === 'course') {
        const courseConfig = config?.courses.find((c) => c.name === value);
        if (courseConfig) {
          if (!courseConfig.needsBranch) member.branch = '';
          if (!courseConfig.needsOther) member.courseOther = '';
          if (member.year && !courseConfig.years.includes(member.year)) {
            member.year = '';
          }
        } else {
          member.branch = '';
          member.courseOther = '';
          member.year = '';
        }
      }

      updatedMembers[index] = member;

      // If captain's college was somehow changed directly, sync team college
      let updatedCollege = prev.college;
      if (index === 0 && field === 'college') {
        updatedCollege = { ...prev.college, name: value };
        for (let i = 1; i <= 3; i++) {
          if (prev.memberCollegeSameAsCaptain[i - 1]) {
            updatedMembers[i] = { ...updatedMembers[i], college: value };
          }
        }
      }

      return {
        ...prev,
        college: updatedCollege,
        members: updatedMembers,
      };
    });
  };

  const setSameCollegeAsCaptain = (memberIndexOffset: 0 | 1 | 2, same: boolean) => {
    markDirty();
    setFormData((prev) => {
      const toggles = [...prev.memberCollegeSameAsCaptain] as [boolean, boolean, boolean];
      toggles[memberIndexOffset] = same;

      const updatedMembers = [...prev.members] as [MemberFormData, MemberFormData, MemberFormData, MemberFormData];
      const targetIndex = memberIndexOffset + 1;
      if (same) {
        updatedMembers[targetIndex] = {
          ...updatedMembers[targetIndex],
          college: prev.college.name,
        };
      }

      return {
        ...prev,
        memberCollegeSameAsCaptain: toggles,
        members: updatedMembers,
      };
    });
  };

  const updateConsent = (type: 'data' | 'venue', checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      consent: {
        ...prev.consent,
        [type]: checked,
      },
    }));
  };

  const setFieldTouched = (field: string) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // Scroll to first error helper
  const scrollToFirstError = useCallback((errors: Record<string, string>) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;
    const firstKey = errorKeys[0];
    const el = document.getElementById(firstKey) || document.querySelector(`[name="${firstKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLElement).focus?.();
    }
  }, []);

  // Step transition validations
  const goToNextStep = () => {
    setGeneralError(null);
    let stepErrors: Record<string, string> = {};

    if (step === 1) {
      stepErrors = validateStep1(formData, config);
      if (teamNameStatus.available === false) {
        stepErrors.teamName = teamNameStatus.message || 'Team name is already taken.';
      }
    } else if (step === 2) {
      stepErrors = validateMember(formData.members[0], 0, config);
    } else if (step === 3) {
      for (let i = 1; i <= 3; i++) {
        const memberErrs = validateMember(formData.members[i], i, config);
        Object.assign(stepErrors, memberErrs);
      }
      const duplicateErrs = validateDuplicates(formData.members);
      Object.assign(stepErrors, duplicateErrs);
    }

    if (Object.keys(stepErrors).length > 0) {
      // Touch all relevant fields so errors are visible
      const newTouched = { ...touchedFields };
      for (const key of Object.keys(stepErrors)) {
        newTouched[key] = true;
      }
      setTouchedFields(newTouched);
      setFieldErrors(stepErrors);
      scrollToFirstError(stepErrors);
      return;
    }

    setFieldErrors({});
    setStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevStep = () => {
    setGeneralError(null);
    setFieldErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Form submission
  const submitRegistration = async () => {
    if (isSubmitting) return;

    // Validate all 4 steps
    const step1Errs = validateStep1(formData, config);
    if (teamNameStatus.available === false) {
      step1Errs.teamName = teamNameStatus.message || 'Team name is already taken.';
    }
    const member0Errs = validateMember(formData.members[0], 0, config);
    const memberOthersErrs: Record<string, string> = {};
    for (let i = 1; i <= 3; i++) {
      Object.assign(memberOthersErrs, validateMember(formData.members[i], i, config));
    }
    const dupErrs = validateDuplicates(formData.members);
    const step4Errs = validateStep4(formData.consent);

    const allErrors = {
      ...step1Errs,
      ...member0Errs,
      ...memberOthersErrs,
      ...dupErrs,
      ...step4Errs,
    };

    if (Object.keys(allErrors).length > 0) {
      const newTouched = { ...touchedFields };
      for (const key of Object.keys(allErrors)) {
        newTouched[key] = true;
      }
      setTouchedFields(newTouched);
      setFieldErrors(allErrors);

      // Determine which step has the first error
      if (Object.keys(step1Errs).length > 0) setStep(1);
      else if (Object.keys(member0Errs).length > 0) setStep(2);
      else if (Object.keys(memberOthersErrs).length > 0 || Object.keys(dupErrs).length > 0) setStep(3);
      else setStep(4);

      setTimeout(() => scrollToFirstError(allErrors), 50);
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    // Build payload field-by-field per CODEMAP.md:
    const collegePayload = {
      name: collapseWhitespace(formData.college.name),
      city: collapseWhitespace(formData.college.city),
      state: collapseWhitespace(formData.college.state),
      pin: formData.college.pin.trim(),
      ...(formData.college.address && formData.college.address.trim()
        ? { address: collapseWhitespace(formData.college.address) }
        : {}),
    };

    const membersPayload: MemberPayload[] = formData.members.map((m) => {
      const courseConfig = config?.courses.find((c) => c.name === collapseWhitespace(m.course));
      const needsBranch = courseConfig ? courseConfig.needsBranch : false;
      const needsOther = courseConfig ? courseConfig.needsOther : false;

      const mem: MemberPayload = {
        fullName: collapseWhitespace(m.fullName),
        email: m.email.trim().toLowerCase(),
        phone: cleanPhone(m.phone),
        dob: m.dob.trim(),
        college: collapseWhitespace(m.college),
        course: collapseWhitespace(m.course),
        year: collapseWhitespace(m.year),
      };

      if (needsOther && m.courseOther && m.courseOther.trim()) {
        mem.courseOther = collapseWhitespace(m.courseOther);
      }
      if (needsBranch && m.branch && m.branch.trim()) {
        mem.branch = collapseWhitespace(m.branch);
      }
      if (m.profileLink && m.profileLink.trim()) {
        mem.profileLink = m.profileLink.trim();
      }

      return mem;
    });

    const payload: RegisterPayload = {
      idempotencyKey: idempotencyKeyRef.current,
      website: '',
      teamName: collapseWhitespace(formData.teamName),
      college: collegePayload,
      howHeard: collapseWhitespace(formData.howHeard),
      consent: {
        data: true,
        venue: true,
      },
      members: membersPayload,
    };

    const res = await registerTeam(payload);
    setIsSubmitting(false);

    if (res.success) {
      // Clear draft
      try {
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }

      const conf: RegisterResponse = {
        teamId: res.teamId,
        teamName: res.teamName,
        status: res.status,
        members: res.members,
        emailStatus: res.emailStatus,
        groupLink: res.groupLink,
      };

      setConfirmation(conf);
      try {
        sessionStorage.setItem(CONFIRMATION_STORAGE_KEY, JSON.stringify(conf));
      } catch {
        // Ignore
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Handle failure
      formModifiedAfterErrorRef.current = true;

      if (res.error === 'REGISTRATION_CLOSED') {
        setIsRegistrationClosed(true);
        return;
      }

      if (res.errors && res.errors.length > 0) {
        const mappedErrors: Record<string, string> = {};
        for (const err of res.errors) {
          mappedErrors[err.field] = err.message;
        }
        setFieldErrors(mappedErrors);

        // Highlight fields
        const newTouched = { ...touchedFields };
        for (const key of Object.keys(mappedErrors)) {
          newTouched[key] = true;
        }
        setTouchedFields(newTouched);

        // Navigate to the step containing the first error
        const firstField = res.errors[0].field;
        if (firstField.startsWith('teamName') || firstField.startsWith('college') || firstField === 'howHeard') {
          setStep(1);
        } else if (firstField.startsWith('members.0')) {
          setStep(2);
        } else if (firstField.startsWith('members.')) {
          setStep(3);
        } else if (firstField.startsWith('consent')) {
          setStep(4);
        }
        setTimeout(() => scrollToFirstError(mappedErrors), 50);
      } else {
        setGeneralError(res.message || 'Registration failed. Please check your details and try again.');
      }
    }
  };

  return {
    step,
    config,
    configLoading,
    configError,
    serverOffsetMs,
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
  };
}
