export interface RuleSection {
  title: string;
  content: string;
}

export interface RulesData {
  title: string;
  sections: RuleSection[];
}

export const rulesData: RulesData = {
  title: 'Rules & Guidelines',
  sections: [
    {
      title: 'Eligibility',
      content:
        'Open to school, diploma, undergraduate and postgraduate students from any college. Every member must be between 16 and 30 years old on 21 November 2026. A team has exactly 4 members. One person can be in only one team. Team names must be unique and start with a letter.',
    },
    {
      title: 'Venue and what to bring',
      content:
        'The event is in Delhi on 21 and 22 November 2026. The exact venue is shared with registered teams by the organizers. There is no accommodation, no food and no merch. Plan your travel and meals yourselves. Every member carries a valid photo ID (school or college ID), checked at entry. Bring what you need to work, such as laptops and chargers.',
    },
    {
      title: 'Code of conduct',
      content:
        "Treat every participant, organizer and volunteer with respect. Harassment of any kind is not tolerated. Do your own work; cheating, copying another team's work or tampering with the event setup leads to disqualification. Follow the instructions of the organizers; their decisions are final. The organizers may remove a team that breaks these rules.",
    },
    {
      title: 'FAQ',
      content:
        'Is it free? Yes, there is no entry fee.\n\nRegistration deadline? 23:59 IST on 17 November 2026.\n\nCan a member be changed after registering? Write to masoulen.hack@gmail.com with your Team ID and the new member\'s details.\n\nHow do I check my registration? Use the status page with your Team ID and the captain\'s email.\n\nWhere do I get updates? In the WhatsApp group linked in your confirmation email.',
    },
  ],
};
