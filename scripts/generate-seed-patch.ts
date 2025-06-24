import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Generates an incremental SQL patch that reflects the difference between the
 * current shipping template database (prisma/data/workflow.db) and the state
 * of that database after running prisma-seed.ts.
 *
 * The patch is written to prisma/seed-patches/NNN_<date>.sql and ends with an
 * UPDATE to the _meta.seed_version column so the runtime loader knows that the
 * patch has been applied.
 *
 * Usage: npx ts-node scripts/generate-seed-patch.ts
 */

function run(cmd: string, cwd?: string) {
  execSync(cmd, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env },
  });
}

function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const prismaDir = path.join(repoRoot, 'prisma');
  const dataDir = path.join(prismaDir, 'data');
  const patchesDir = path.join(prismaDir, 'seed-patches');

  if (!fs.existsSync(path.join(dataDir, 'workflow.db'))) {
    console.error(
      '[generate-seed-patch] Missing prisma/data/workflow.db – run npm run db:seed first.',
    );
    process.exit(1);
  }

  if (!fs.existsSync(patchesDir)) {
    fs.mkdirSync(patchesDir, { recursive: true });
  }

  const beforeDB = path.join(os.tmpdir(), `anubis_before_${Date.now()}.db`);
  const afterDB = path.join(os.tmpdir(), `anubis_after_${Date.now()}.db`);

  // Copy template DB to both temp files
  fs.copyFileSync(path.join(dataDir, 'workflow.db'), beforeDB);
  fs.copyFileSync(path.join(dataDir, 'workflow.db'), afterDB);

  // Run prisma-seed.ts against the afterDB
  console.log('[generate-seed-patch] Running prisma-seed.ts against temp db…');
  run(
    `npx cross-env DATABASE_URL="file:${afterDB}" ts-node scripts/prisma-seed.ts`,
    repoRoot,
  );

  // Build sqldiff command
  const diffCmd = `sqldiff --transaction "${beforeDB}" "${afterDB}"`;
  console.log(`[generate-seed-patch] Running ${diffCmd}`);
  let diffSQL: string;
  try {
    diffSQL = execSync(diffCmd, { encoding: 'utf8' });
  } catch (error: any) {
    console.error(
      '[generate-seed-patch] Failed to run sqldiff. Ensure SQLite CLI tools are installed and sqldiff is in PATH.',
    );
    process.exit(1);
  }

  if (!diffSQL.trim()) {
    console.log(
      '[generate-seed-patch] No diff detected – no patch file created.',
    );
    return;
  }

  // Determine next patch number
  const existing = fs.readdirSync(patchesDir).filter((f) => /^\d+_/.test(f));
  const next = existing.length
    ? Math.max(...existing.map((f) => Number(f.split('_')[0]))) + 1
    : 1;
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${String(next).padStart(3, '0')}_${date}.sql`;
  const targetPath = path.join(patchesDir, filename);

  const finalSQL = `-- Auto-generated from prisma-seed.ts on ${new Date().toISOString()}
${diffSQL.trim()}

UPDATE _meta SET value = ${next} WHERE key = 'seed_version';
`;

  fs.writeFileSync(targetPath, finalSQL, 'utf8');
  console.log(
    `[generate-seed-patch] Patch written to ${path.relative(repoRoot, targetPath)}`,
  );
}

main();
