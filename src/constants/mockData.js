/**
 * constants/mockData.js
 * ──────────────────────
 * Placeholder/demo data currently rendered by the UI.
 *
 * NOTE: This is static mock content carried over verbatim from the original
 * single-file prototype. When the backend integration lands, these arrays
 * are the seams to replace with live API data (see RideSync+ backend
 * /rides, /analytics, /users endpoints).
 */

// Home / CompareRides — saved locations list
export const SAVED_LOCATIONS = [
  { title: "Computer Science Depart.", meta: "3.2 miles away - 12 mins ago", icon: "briefcase" },
  { title: "Home (Kwapong Hall)", meta: "5.2 miles away - 2 hours ago", icon: "home" },
  { title: "Poki Restaurant", meta: "9.2 miles away - Yesterday", icon: "coffee" },
];

// RideMatch — alternative ride options
export const ALTERNATIVE_RIDES = [
  { label: "Bolt Economy", price: "GHS 21.80", meta: "6 mins - 4.7", tag: "Economy", color: "#52e0c4" },
  { label: "Yango Comfort", price: "GHS 28.20", meta: "8 mins - 4.8", tag: "Economy", color: "#f7c35f" },
  { label: "Uber Black", price: "GHS 45.00", meta: "3 mins - 5.0", tag: "Comfort", color: "#b0b3c0" },
];

// RideDetails — selected ride summary
export const RIDE_DETAILS = {
  platform: "Uber X",
  tag: "TOP CHOICE",
  price: "₵24.50",
  eta: "4 min away",
  chips: ["4 Seats", "Fastest"],
  driver: {
    name: "Marcus Thompson",
    car: "Black Tesla Model 3",
    plate: "SEO-1234",
    rating: "4.8",
  },
  pickup: "365 Market Street, San Francisco",
  dropoff: "101 Howard Street, San Francisco",
};

// EditProfile — saved places list
export const SAVED_PLACES = [
  { label: "Home", address: "East Legon, Accra", icon: "home" },
  { label: "Work", address: "Airport Area, Liberation Rd", icon: "briefcase" },
];

// History — past comparisons
export const HISTORY_ITEMS = [
  {
    route: "East Legon -> Airport",
    time: "Oct 24, 10:30 AM - 12.4 km",
    price: "GHS 25",
    note: "Compared 3 platforms - Bolt was cheapest",
  },
  {
    route: "Osu -> Labadi Beach",
    time: "Oct 22, 06:15 PM - 6.2 km",
    price: "GHS 18",
    note: "Compared 2 platforms - Uber was fastest",
  },
];

// Profile — recent history preview
export const PROFILE_RECENT_HISTORY = [
  { label: "Downtown to Airport", meta: "Yesterday, 4:30 PM - Uber vs Lyft", price: "GHS 24.50", tag: "Saved $5" },
  { label: "Office to Home", meta: "Oct 24 - Lyft Preferred", price: "GHS 18.20", tag: "Fastest" },
  { label: "Office to Home", meta: "Oct 24 - Lyft Preferred", price: "GHS 18.20", tag: "Fastest" },
];

// EditProfile — editable profile fields
export const PROFILE_FIELDS = [
  { label: "FULL NAME", value: "Alexa Johnson" },
  { label: "EMAIL ADDRESS", value: "alexa@ridesync.com" },
  { label: "PHONE NUMBER", value: "+233 24 123 4567" },
  { label: "LOCATION", value: "Accra, Ghana" },
];

// Insights — price comparison bars
export const PRICE_COMPARISON = [
  { label: "Uber", value: "GHS 42.00 avg", width: "90%" },
  { label: "Bolt", value: "GHS 35.50 avg", width: "75%" },
  { label: "Yango", value: "GHS 38.00 avg", width: "82%" },
];

// Insights — popular routes
export const POPULAR_ROUTES = [
  { id: 1, route: "East Legon -> Airport", time: "15 min - Every 4 mins" },
  { id: 2, route: "Madina -> Circle", time: "32 min - High Demand" },
  { id: 3, route: "Osu -> Tema", time: "45 min - Morning Peak" },
];
