import { addDays, nextMonday } from 'date-fns';
import { DEFAULT_BLOCK_DAYS } from '../lib/blocks';
import { toISO } from '../lib/dates';
import type { Settings } from './types';

export const DEFAULT_PEOPLE = ['Kevin', 'Brian', 'Angie'];

export function defaultSettings(): Settings {
  const start = nextMonday(new Date());
  return {
    patientName: 'Rick',
    startDate: toISO(start),
    endDate: toISO(addDays(start, 7 * 13 - 1)), // ~3 months (13 weeks)
    blockLengthDays: DEFAULT_BLOCK_DAYS,
    banner: { message: '', active: false },
    people: [...DEFAULT_PEOPLE],
    passcodeHash: null,
    careGuide: {
      intro:
        'Thank you for signing up. A care block is one week of living with or staying close to Dad and being his main helper day-to-day. Below is what to expect. Always follow the transplant team’s instructions first — they override anything here.',
      sections: [
        {
          title: 'Appointments & transportation',
          items: [
            'Drive him to clinic visits, labs, and infusions — early in recovery these can be several times a week.',
            'Bring the medication list, a notepad, water, a snack, and a mask.',
            'Write down questions beforehand and take notes on the answers.',
            'Keep the shared calendar updated with any new appointments.',
          ],
        },
        {
          title: 'Mobility & getting around',
          items: [
            'Help him stand up, sit down, and walk — he may be weak and lightheaded.',
            'Stay close on stairs and in the bathroom; falls are a real risk.',
            'Keep walkways clear of cords, rugs, and clutter; use night lights.',
            'Encourage short walks as the care team recommends.',
          ],
        },
        {
          title: 'Meals & hydration',
          items: [
            'Prepare meals and snacks; appetite may be low, so offer small, frequent portions.',
            'Follow the low-microbial / food-safety diet from the transplant team (fully cooked meats and eggs, washed produce, no buffets or deli counters, etc.).',
            'Track fluids — dehydration is common. Keep water within reach.',
            'Wash hands and surfaces before preparing food.',
          ],
        },
        {
          title: 'Medications',
          items: [
            'Give medications on schedule using the pill organizer and med log.',
            'Watch for side effects and write them down.',
            'Refill prescriptions before they run out.',
          ],
        },
        {
          title: 'Infection prevention',
          items: [
            'His immune system is very weak. Wash hands often and ask others to as well.',
            'No visitors who are sick or recently exposed. Follow any current “no visitors” notice.',
            'Wear a mask if you have any symptoms — or better, swap your block with someone else.',
            'Keep the house clean: wipe high-touch surfaces daily, no fresh flowers or plants, someone else handles pet waste.',
          ],
        },
        {
          title: 'When to call the care team right away',
          items: [
            'Fever of 100.4°F (38°C) or higher, or chills.',
            'Trouble breathing, chest pain, confusion, or fainting.',
            'New rash, bleeding, bruising, severe diarrhea, or vomiting.',
            'Keep the transplant team’s 24/7 phone number on the fridge and in your phone.',
          ],
        },
        {
          title: 'Taking care of yourself & handoffs',
          items: [
            'Get rest when he rests. It’s okay to ask for help.',
            'At the end of your block, do a handoff with the next caregiver: meds, appointments, how he’s doing, anything that changed.',
          ],
        },
      ],
    },
  };
}

/** Fill in any fields missing from a stored settings doc (forward-compatible). */
export function withDefaults(partial: Partial<Settings> | undefined, base = defaultSettings()): Settings {
  const p = partial ?? {};
  return {
    ...base,
    ...p,
    banner: { ...base.banner, ...(p.banner ?? {}) },
    careGuide: { ...base.careGuide, ...(p.careGuide ?? {}) },
    people: Array.isArray(p.people) && p.people.length ? p.people : base.people,
  };
}
