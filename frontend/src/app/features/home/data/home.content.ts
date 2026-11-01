/* Static marketing copy for the home page (same text as v5). */
export const PARTNERS = ['Himalayan Sapana', 'Gandaki Swift', 'Terai Express', 'Everest Comfort', 'Mithila Rath', 'Lumbini Star'];

export interface Testimonial { name: string; route: string; quote: string; }
export const TESTIMONIALS: Testimonial[] = [
  ['Anisha Gurung', 'Kathmandu → Pokhara', 'Booked a sofa seat in two minutes. The seat map was exactly what I got on the bus, and boarding at Kalanki was smooth.'],
  ['Rohan Shrestha', 'Chitwan → Butwal', 'Loved the live seat hold — no more calling counters. The QR ticket scanned instantly at the bus park.'],
  ['Pratima Yadav', 'Janakpur → Kathmandu', 'Ladies seats are clearly marked, which made travelling alone with my daughter so much easier.'],
  ['Suresh Tamang', 'Biratnagar → Janakpur', 'Cancelled a trip two days early and the refund calculation was transparent. Will definitely book again.'],
  ['Kabita Rai', 'Pokhara → Chitwan', 'The round-trip coupon saved me Rs. 400. Clean app, quick checkout with Khalti.'],
  ['Dipendra KC', 'Kathmandu → Biratnagar', 'Overnight sleeper was comfortable and the boarding time on the ticket was accurate to the minute.'],
].map(([name, route, quote]) => ({ name, route, quote }));

export const TRUST = [
  { icon: 'users', n: 50000, suffix: '+', label: 'Happy travellers', dec: 0 },
  { icon: 'bus', n: 120, suffix: '+', label: 'Daily departures', dec: 0 },
  { icon: 'star2', n: 4.6, suffix: '/5', label: 'Average rating', dec: 1 },
  { icon: 'refund', n: 90, suffix: '%', label: 'Refund 48h before', dec: 0 },
];

export const featureList = (holdMinutes: number) => [
  { icon: 'seat', title: 'Choose your seat', text: 'Real seat maps with sleeper decks and ladies seats clearly marked.' },
  { icon: 'clock', title: 'Seat hold', text: `Your seats are locked for ${holdMinutes} minutes while you check out.` },
  { icon: 'refund', title: 'Easy cancellation', text: 'Cancel online and get up to 90% back, automatically.' },
  { icon: 'shield', title: 'Secure payments', text: 'eSewa, Khalti and debit/credit cards with instant confirmation.' },
];

export const APP_TICKS = ['Offline QR tickets', 'Live trip alerts by SMS', 'Save passengers for faster checkout'];

export const faqList = (holdMinutes: number) => [
  ['Do I need to print my ticket?', 'No. Show the e-ticket or QR code on your phone at the boarding point. You can also print it or download it from the confirmation page.'],
  ['What is the cancellation and refund policy?', 'More than 48 hours before departure: 90% refund. 24–48 hours: 75%. 6–24 hours: 50%. Less than 6 hours: cancellation is not possible. Refunds go back to the original payment method within 3–5 working days.'],
  ['What are ladies seats?', "Seats marked in pink are reserved for female passengers. Our checkout will ask you to change the seat if the passenger's gender doesn't match."],
  ['How long are my seats held?', `Once you continue from the seat map, the seats are held for you for ${holdMinutes} minutes so nobody else can book them while you pay.`],
  ['Which payment methods are accepted?', 'eSewa, Khalti and Visa/Mastercard debit or credit cards.'],
  ['Can I book a return journey?', 'Yes — choose "Round trip" on the search form. You will pick seats for both directions and pay once.'],
].map(([q, a]) => ({ q, a }));
