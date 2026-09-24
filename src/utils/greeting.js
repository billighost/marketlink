/**
 * Time-of-day greeting utility.
 * Returns "Good morning/afternoon/evening, {name}" based on the visitor's local time.
 */
export function getGreeting(name) {
  const hour = new Date().getHours();

  let period;
  if (hour < 12) {
    period = 'morning';
  } else if (hour < 18) {
    period = 'afternoon';
  } else {
    period = 'evening';
  }

  return `Good ${period}, ${name}`;
}
