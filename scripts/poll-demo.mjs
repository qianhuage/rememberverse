import { readFileSync, writeFileSync, existsSync } from 'node:fs';
for (const file of ['work/demo-session.json', 'work/world-demo.json']) {
  if (!existsSync(file)) continue;
  const { id, cookie } = JSON.parse(readFileSync(file, 'utf8'));
  const r = await fetch(`http://localhost:3100/api/islands/${id}/jobs`, {
    headers: { cookie },
  });
  const data = await r.json();
  writeFileSync(file.replace('.json', '-jobs.json'), JSON.stringify(data));
  console.log(
    file,
    JSON.stringify(
      data.jobs?.map((j) => ({
        provider: j.provider,
        status: j.status,
        operation: j.operation,
        error: j.error,
        result: j.result ? JSON.parse(j.result) : null,
      })),
    ).slice(0, 7000),
  );
}
