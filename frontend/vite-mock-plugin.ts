import type { Plugin } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

const DATA_FILE = path.resolve(__dirname, '../backend/local_data.json');

function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch {
      // ignore
    }
  }
  return {
    teams: [
      {
        teamId: 'CASE-0001',
        timestamp: '2026-11-01T12:00:00+05:30',
        teamName: 'Cyber Pioneers',
        college: {
          name: 'Delhi Technological University',
          address: 'Bawana Road, Shahbad Daulatpur',
          city: 'Delhi',
          state: 'Delhi',
          pin: '110042',
        },
        howHeard: 'Instagram',
        status: 'confirmed',
        checkedIn: false,
        emailStatus: 'pending',
        members: [
          { role: 'captain', fullName: 'Aarav Sharma', email: 'aarav@example.com', phone: '9876543210', dob: '2004-05-15', ageOnEvent: 22, college: 'Delhi Technological University', course: 'B.Tech / B.E.', branch: 'CSE', year: '3rd' },
          { role: 'member', fullName: 'Ananya Verma', email: 'ananya@example.com', phone: '9876543211', dob: '2004-08-20', ageOnEvent: 22, college: 'Delhi Technological University', course: 'B.Tech / B.E.', branch: 'IT', year: '3rd' },
          { role: 'member', fullName: 'Rohan Gupta', email: 'rohan@example.com', phone: '9876543212', dob: '2003-11-10', ageOnEvent: 23, college: 'Delhi Technological University', course: 'B.Tech / B.E.', branch: 'ECE', year: '4th' },
          { role: 'member', fullName: 'Sneha Patel', email: 'sneha@example.com', phone: '9876543213', dob: '2005-02-28', ageOnEvent: 21, college: 'Delhi Technological University', course: 'B.Tech / B.E.', branch: 'AI/ML', year: '2nd' },
        ],
      },
    ],
    counter: 1,
  };
}

function saveData(data: any) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save local mock data:', err);
  }
}

export function mockApiPlugin(): Plugin {
  return {
    name: 'vite-mock-gas-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              const data = loadData();
              const action = parsed.action;
              let response: any = { success: false, error: 'UNKNOWN_ACTION', message: 'Action not handled' };

              if (action === 'get_config') {
                response = {
                  success: true,
                  eventName: 'masoulen',
                  eventDates: '21 and 22 November 2026',
                  eventDay: '2026-11-21',
                  regCloseAt: '2026-11-17T23:59:59+05:30',
                  serverTime: new Date().toISOString(),
                  open: true,
                  teamSize: 4,
                  minAge: 16,
                  maxAge: 30,
                  dobMin: '1995-11-22',
                  dobMax: '2010-11-21',
                  courses: [
                    { name: 'School', years: ['Class 10', 'Class 11', 'Class 12'], needsBranch: false, needsOther: false },
                    { name: 'Diploma / Polytechnic', years: ['1st', '2nd', '3rd'], needsBranch: false, needsOther: false },
                    { name: 'B.Tech / B.E.', years: ['1st', '2nd', '3rd', '4th'], needsBranch: true, needsOther: false },
                    { name: 'BCA', years: ['1st', '2nd', '3rd'], needsBranch: false, needsOther: false },
                    { name: 'B.Sc', years: ['1st', '2nd', '3rd'], needsBranch: false, needsOther: false },
                    { name: 'BBA / B.Com / BA', years: ['1st', '2nd', '3rd'], needsBranch: false, needsOther: false },
                    { name: 'M.Tech / M.E.', years: ['1st', '2nd'], needsBranch: true, needsOther: false },
                    { name: 'MCA', years: ['1st', '2nd'], needsBranch: false, needsOther: false },
                    { name: 'M.Sc / MBA / Other PG', years: ['1st', '2nd'], needsBranch: false, needsOther: false },
                    { name: 'Other', years: ['1st', '2nd', '3rd', '4th', '5th'], needsBranch: false, needsOther: true },
                  ],
                  branches: ['CSE', 'IT', 'CS', 'AI/ML', 'Data Science', 'BT', 'ECE', 'EE', 'ME', 'Civil', 'Other'],
                  states: [
                    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
                    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
                    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
                    'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
                    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
                    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
                  ],
                  howHeardOptions: ['Instagram', 'WhatsApp', 'Friend or classmate', 'College or teacher', 'LinkedIn', 'Other'],
                };
              } else if (action === 'check_team_name') {
                const name = (parsed.teamName || '').trim().toLowerCase();
                const taken = data.teams.some((t: any) => t.teamName.toLowerCase() === name);
                response = {
                  success: true,
                  available: !taken,
                  reason: taken ? 'TEAM_NAME_TAKEN' : undefined,
                  message: taken ? 'That team name is already taken.' : 'Team name is available.',
                };
              } else if (action === 'register') {
                data.counter++;
                const padId = String(data.counter).padStart(4, '0');
                const teamId = `CASE-${padId}`;
                const newTeam = {
                  teamId,
                  timestamp: new Date().toISOString(),
                  teamName: parsed.teamName,
                  college: parsed.college,
                  howHeard: parsed.howHeard,
                  status: 'confirmed',
                  checkedIn: false,
                  emailStatus: 'pending',
                  members: parsed.members.map((m: any, i: number) => ({
                    ...m,
                    role: i === 0 ? 'captain' : 'member',
                    ageOnEvent: 20,
                  })),
                };
                data.teams.push(newTeam);
                saveData(data);

                response = {
                  success: true,
                  teamId,
                  teamName: parsed.teamName,
                  status: 'confirmed',
                  members: newTeam.members.map((m: any) => ({ role: m.role, fullName: m.fullName })),
                  emailStatus: 'pending',
                  groupLink: 'https://chat.whatsapp.com/test-masoulen-invite',
                };
              } else if (action === 'lookup_status') {
                const team = data.teams.find((t: any) => t.teamId.toUpperCase() === (parsed.teamId || '').toUpperCase());
                if (team && team.members[0] && team.members[0].email.toLowerCase() === (parsed.email || '').toLowerCase()) {
                  response = {
                    success: true,
                    teamId: team.teamId,
                    teamName: team.teamName,
                    status: team.status,
                    checkedIn: team.checkedIn,
                    members: team.members.map((m: any) => ({ role: m.role, fullName: m.fullName })),
                  };
                } else {
                  response = {
                    success: false,
                    error: 'NOT_FOUND',
                    message: "We couldn't find a registration matching that Team ID and Captain Email.",
                  };
                }
              } else if (action === 'admin_login') {
                const id = (parsed.adminId || '').toLowerCase();
                const pw = parsed.password;
                if ((id === 'owner' || id === 'admin') && (pw === 'Admin@123' || pw === 'admin')) {
                  response = {
                    success: true,
                    token: 'mock-admin-token-1234567890',
                    name: 'Organizer',
                    adminId: id,
                    role: 'owner',
                    expiresInSeconds: 7200,
                  };
                } else {
                  response = {
                    success: false,
                    error: 'AUTH_FAILED',
                    message: 'Invalid Admin ID or password. Use ID: "owner" and Password: "Admin@123"',
                  };
                }
              } else if (action === 'admin_get_data') {
                const liveTeams = data.teams.filter((t: any) => t.status === 'confirmed');
                let participants = 0;
                liveTeams.forEach((t: any) => (participants += t.members.length));

                response = {
                  success: true,
                  serverTime: new Date().toISOString(),
                  teams: data.teams,
                  stats: {
                    registered: {
                      teams: liveTeams.length,
                      participants,
                      cancelledTeams: data.teams.length - liveTeams.length,
                    },
                    perDay: [{ date: new Date().toISOString().slice(0, 10), count: liveTeams.length }],
                    ageBuckets: [
                      { label: '16', count: 0 },
                      { label: '17', count: 0 },
                      { label: '18-19', count: 1 },
                      { label: '20-21', count: 2 },
                      { label: '22-24', count: 1 },
                      { label: '25-27', count: 0 },
                      { label: '28-30', count: 0 },
                    ],
                    courses: [
                      {
                        course: 'B.Tech / B.E.',
                        count: liveTeams.length * 4,
                        years: [{ year: '3rd', count: liveTeams.length * 2 }],
                      },
                    ],
                    branches: [{ name: 'CSE', count: liveTeams.length * 2 }],
                    states: [{ name: 'Delhi', count: liveTeams.length }],
                    topColleges: [{ name: 'Delhi Technological University', count: liveTeams.length }],
                    howHeard: [{ name: 'Instagram', count: liveTeams.length }],
                    checkIn: {
                      checkedIn: liveTeams.filter((t: any) => t.checkedIn).length,
                      registered: liveTeams.length,
                    },
                    emailQueue: { pending: liveTeams.length, sent: 0, failed: 0 },
                  },
                };
              } else if (action === 'admin_checkin') {
                const team = data.teams.find((t: any) => t.teamId === parsed.teamId);
                if (team) {
                  team.checkedIn = parsed.checkedIn;
                  team.checkedInAt = parsed.checkedIn ? new Date().toISOString() : undefined;
                  saveData(data);
                  response = { success: true, team };
                } else {
                  response = { success: false, error: 'NOT_FOUND', message: 'Team not found' };
                }
              } else if (action === 'admin_cancel') {
                const team = data.teams.find((t: any) => t.teamId === parsed.teamId);
                if (team) {
                  team.status = 'cancelled';
                  saveData(data);
                  response = { success: true, team };
                } else {
                  response = { success: false, error: 'NOT_FOUND', message: 'Team not found' };
                }
              } else if (action === 'admin_log_export' || action === 'admin_logout') {
                response = { success: true };
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(response));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'SERVER_ERROR', message: err.message }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

