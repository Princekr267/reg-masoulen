import { collapseWhitespace, cleanPhone, canonicalizeEmail } from './utils';
import type { GetConfigResponse } from '../services/api';

// Regular expressions with Unicode property escapes
const TEAM_NAME_REGEX = /^\p{L}[\p{L}\p{M}\p{N} \-_.&'!]*$/u;
const GENERAL_TEXT_REGEX = /^\p{L}[\p{L}\p{M}\p{N} .'&()-]*$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CLEANED_REGEX = /^[6-9]\d{9}$/;
const PIN_REGEX = /^[1-9][0-9]{5}$/;
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PROFILE_LINK_REGEX = /^https:\/\/(?:www\.)?(?:github\.com|linkedin\.com)\/.+$/i;

export interface MemberFormData {
  fullName: string;
  email: string;
  phone: string;
  dob: string;
  college: string;
  course: string;
  courseOther?: string;
  branch?: string;
  year: string;
  profileLink?: string;
}

export interface CollegeFormData {
  name: string;
  address?: string;
  city: string;
  state: string;
  pin: string;
}

export interface RegistrationFormData {
  teamName: string;
  college: CollegeFormData;
  howHeard: string;
  consent: {
    data: boolean;
    venue: boolean;
  };
  members: [MemberFormData, MemberFormData, MemberFormData, MemberFormData];
  memberCollegeSameAsCaptain: [boolean, boolean, boolean];
}

export function validateTeamName(name: string): string | null {
  const collapsed = collapseWhitespace(name);
  if (!collapsed) return 'Team name is required.';
  if (collapsed.length < 2 || collapsed.length > 40) {
    return 'Team name must be between 2 and 40 characters.';
  }
  if (!TEAM_NAME_REGEX.test(collapsed)) {
    return 'Must start with a letter and contain only letters, numbers, spaces, or - _ . & \' !';
  }
  return null;
}

export function validatePersonName(name: string): string | null {
  const collapsed = collapseWhitespace(name);
  if (!collapsed) return 'Full name is required.';
  if (collapsed.length < 2 || collapsed.length > 60) {
    return 'Full name must be between 2 and 60 characters.';
  }
  if (!GENERAL_TEXT_REGEX.test(collapsed)) {
    return 'Must start with a letter and contain only letters, numbers, spaces, or . \' & ( ) -';
  }
  return null;
}

export function validateCollegeName(name: string): string | null {
  const collapsed = collapseWhitespace(name);
  if (!collapsed) return 'College / School name is required.';
  if (collapsed.length < 2 || collapsed.length > 80) {
    return 'Name must be between 2 and 80 characters.';
  }
  if (!GENERAL_TEXT_REGEX.test(collapsed)) {
    return 'Must start with a letter and contain only letters, numbers, spaces, or . \' & ( ) -';
  }
  return null;
}

export function validateAddress(address?: string): string | null {
  if (!address) return null;
  const collapsed = collapseWhitespace(address);
  if (!collapsed) return null;
  if (collapsed.length < 5 || collapsed.length > 150) {
    return 'Address must be between 5 and 150 characters.';
  }
  if (!GENERAL_TEXT_REGEX.test(collapsed)) {
    return 'Must start with a letter and contain only letters, numbers, spaces, or . \' & ( ) -';
  }
  return null;
}

export function validateCity(city: string): string | null {
  const collapsed = collapseWhitespace(city);
  if (!collapsed) return 'City is required.';
  if (collapsed.length < 2 || collapsed.length > 50) {
    return 'City must be between 2 and 50 characters.';
  }
  if (!GENERAL_TEXT_REGEX.test(collapsed)) {
    return 'Must start with a letter and contain only letters, numbers, spaces, or . \' & ( ) -';
  }
  return null;
}

export function validateState(state: string, config?: GetConfigResponse | null): string | null {
  const collapsed = collapseWhitespace(state);
  if (!collapsed) return 'State is required.';
  if (config && config.states && !config.states.includes(collapsed)) {
    return 'Please select a valid state from the list.';
  }
  return null;
}

export function validatePin(pin: string): string | null {
  const cleaned = pin.trim();
  if (!cleaned) return 'PIN code is required.';
  if (!PIN_REGEX.test(cleaned)) {
    return 'Enter a valid 6-digit Indian PIN code (cannot start with 0).';
  }
  return null;
}

export function validateHowHeard(howHeard: string, config?: GetConfigResponse | null): string | null {
  const collapsed = collapseWhitespace(howHeard);
  if (!collapsed) return 'Please tell us how you heard about masoulen.';
  if (config && config.howHeardOptions && !config.howHeardOptions.includes(collapsed)) {
    return 'Please select an option from the list.';
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return 'Email address is required.';
  if (trimmed.length > 254) return 'Email cannot exceed 254 characters.';
  if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address.';
  return null;
}

export function validatePhone(phone: string): string | null {
  const cleaned = cleanPhone(phone);
  if (!cleaned) return 'Phone number is required.';
  if (!PHONE_CLEANED_REGEX.test(cleaned)) {
    return 'Enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).';
  }
  return null;
}

export function validateDob(dob: string, config?: GetConfigResponse | null): string | null {
  const trimmed = dob.trim();
  if (!trimmed) return 'Date of birth is required.';
  if (!DATE_FORMAT_REGEX.test(trimmed)) return 'Date format must be YYYY-MM-DD.';

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return 'Invalid date.';

  const todayStr = new Date().toISOString().slice(0, 10);
  if (trimmed > todayStr) return 'Date of birth cannot be in the future.';

  if (config) {
    if (config.dobMin && trimmed < config.dobMin) {
      return `Must be at most ${config.maxAge} years old on 21 Nov 2026 (born after ${config.dobMin}).`;
    }
    if (config.dobMax && trimmed > config.dobMax) {
      return `Must be at least ${config.minAge} years old on 21 Nov 2026 (born before ${config.dobMax}).`;
    }
  }

  return null;
}

export function validateCourse(
  course: string,
  courseOther: string | undefined,
  branch: string | undefined,
  year: string,
  config?: GetConfigResponse | null
): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmedCourse = collapseWhitespace(course);

  if (!trimmedCourse) {
    errors.course = 'Please select a course.';
    return errors;
  }

  if (config && config.courses) {
    const courseConfig = config.courses.find((c) => c.name === trimmedCourse);
    if (!courseConfig) {
      errors.course = 'Please select a valid course from the list.';
      return errors;
    }

    if (courseConfig.needsOther) {
      const otherTrimmed = collapseWhitespace(courseOther || '');
      if (!otherTrimmed) {
        errors.courseOther = 'Please specify your course.';
      } else if (otherTrimmed.length < 2 || otherTrimmed.length > 40) {
        errors.courseOther = 'Course name must be between 2 and 40 characters.';
      } else if (!GENERAL_TEXT_REGEX.test(otherTrimmed)) {
        errors.courseOther = 'Must start with a letter and contain only letters, numbers, spaces, or . \' & ( ) -';
      }
    }

    if (courseConfig.needsBranch) {
      const branchTrimmed = collapseWhitespace(branch || '');
      if (!branchTrimmed) {
        errors.branch = 'Please select your branch / specialization.';
      } else if (config.branches && !config.branches.includes(branchTrimmed)) {
        errors.branch = 'Please select a valid branch from the list.';
      }
    }

    const yearTrimmed = collapseWhitespace(year);
    if (!yearTrimmed) {
      errors.year = 'Please select your year of study.';
    } else if (courseConfig.years && !courseConfig.years.includes(yearTrimmed)) {
      errors.year = 'Please select a valid year for your course.';
    }

    if (trimmedCourse.toLowerCase() === 'school') {
      const validSchoolYears = ['Class 10', 'Class 11', 'Class 12'];
      if (yearTrimmed && !validSchoolYears.includes(yearTrimmed)) {
        errors.year = 'School students must be in Class 10, Class 11, or Class 12.';
      }
    }
  } else {
    if (!year.trim()) errors.year = 'Year is required.';
  }

  return errors;
}

export function validateProfileLink(link?: string): string | null {
  if (!link) return null;
  const trimmed = link.trim();
  if (!trimmed) return null;
  if (trimmed.length > 200) return 'Profile link cannot exceed 200 characters.';
  if (!PROFILE_LINK_REGEX.test(trimmed)) {
    return 'Link must start with https:// and be a valid GitHub or LinkedIn profile URL.';
  }
  return null;
}

/**
 * Validates step 1: Team & College
 */
export function validateStep1(
  data: Pick<RegistrationFormData, 'teamName' | 'college' | 'howHeard'>,
  config?: GetConfigResponse | null
): Record<string, string> {
  const errors: Record<string, string> = {};

  const teamErr = validateTeamName(data.teamName);
  if (teamErr) errors['teamName'] = teamErr;

  const colErr = validateCollegeName(data.college.name);
  if (colErr) errors['college.name'] = colErr;

  const addrErr = validateAddress(data.college.address);
  if (addrErr) errors['college.address'] = addrErr;

  const cityErr = validateCity(data.college.city);
  if (cityErr) errors['college.city'] = cityErr;

  const stateErr = validateState(data.college.state, config);
  if (stateErr) errors['college.state'] = stateErr;

  const pinErr = validatePin(data.college.pin);
  if (pinErr) errors['college.pin'] = pinErr;

  const howHeardErr = validateHowHeard(data.howHeard, config);
  if (howHeardErr) errors['howHeard'] = howHeardErr;

  return errors;
}

/**
 * Validates a single member's fields (at index memberIndex: 0..3)
 */
export function validateMember(
  member: MemberFormData,
  memberIndex: number,
  config?: GetConfigResponse | null
): Record<string, string> {
  const errors: Record<string, string> = {};
  const prefix = `members.${memberIndex}`;

  const nameErr = validatePersonName(member.fullName);
  if (nameErr) errors[`${prefix}.fullName`] = nameErr;

  const emailErr = validateEmail(member.email);
  if (emailErr) errors[`${prefix}.email`] = emailErr;

  const phoneErr = validatePhone(member.phone);
  if (phoneErr) errors[`${prefix}.phone`] = phoneErr;

  const dobErr = validateDob(member.dob, config);
  if (dobErr) errors[`${prefix}.dob`] = dobErr;

  const colErr = validateCollegeName(member.college);
  if (colErr) errors[`${prefix}.college`] = colErr;

  const courseErrors = validateCourse(member.course, member.courseOther, member.branch, member.year, config);
  for (const [key, msg] of Object.entries(courseErrors)) {
    errors[`${prefix}.${key}`] = msg;
  }

  const profileErr = validateProfileLink(member.profileLink);
  if (profileErr) errors[`${prefix}.profileLink`] = profileErr;

  return errors;
}

/**
 * Validates duplicate emails and phones across all 4 members.
 */
export function validateDuplicates(members: MemberFormData[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const seenEmails = new Map<string, number>();
  const seenPhones = new Map<string, number>();

  members.forEach((member, idx) => {
    const rawEmail = member.email.trim();
    if (rawEmail && !validateEmail(rawEmail)) {
      const canonical = canonicalizeEmail(rawEmail);
      if (seenEmails.has(canonical)) {
        errors[`members.${idx}.email`] = 'This email is already used by another team member.';
      } else {
        seenEmails.set(canonical, idx);
      }
    }

    const rawPhone = member.phone.trim();
    if (rawPhone && !validatePhone(rawPhone)) {
      const cleaned = cleanPhone(rawPhone);
      if (seenPhones.has(cleaned)) {
        errors[`members.${idx}.phone`] = 'This phone number is already used by another team member.';
      } else {
        seenPhones.set(cleaned, idx);
      }
    }
  });

  return errors;
}

/**
 * Validates step 4: Consents
 */
export function validateStep4(consent: { data: boolean; venue: boolean }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!consent.data) {
    errors['consent.data'] = 'All listed members must agree to share their details and accept the rules.';
  }
  if (!consent.venue) {
    errors['consent.venue'] = 'You must confirm understanding of the Delhi venue terms, age limit, and ID requirements.';
  }
  return errors;
}
