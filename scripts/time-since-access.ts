// time-since-access.ts
// Utility: Convert ms since last access to human readable string

console.log('before time....ts');

function timeSinceAccessText(
  lastAccessed: number,
  now: number = Date.now()
): string {
  const timeSinceAccessMs = now - lastAccessed;
  if (timeSinceAccessMs < 60000) {
    return `${Math.floor(timeSinceAccessMs / 1000)} seconds ago`;
  } else if (timeSinceAccessMs < 3600000) {
    return `${Math.floor(timeSinceAccessMs / 60000)} minutes ago`;
  } else if (timeSinceAccessMs < 86400000) {
    return `${Math.floor(timeSinceAccessMs / 3600000)} hours ago`;
  } else {
    return `${Math.floor(timeSinceAccessMs / 86400000)} days ago`;
  }
}

console.log('after time....ts');

console.log(timeSinceAccessText(Date.now() - 500000));

export { timeSinceAccessText };
