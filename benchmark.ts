import { execSync } from 'child_process';
const start = Date.now();
execSync('npx ts-node scripts/check-user-tier.ts', { stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321', SUPABASE_SERVICE_ROLE_KEY: 'ey...' } });
console.log(`Time taken: ${Date.now() - start}ms`);
