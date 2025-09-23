// Force Vercel to rebuild everything
// This file changes the build hash and forces a fresh deployment

console.log('Build timestamp:', new Date().toISOString());
console.log('Force rebuild triggered at:', Date.now());
console.log('This will ensure Vercel generates a new Prisma client');

module.exports = {
  timestamp: Date.now(),
  force: true
};
