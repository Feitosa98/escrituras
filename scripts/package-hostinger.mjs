import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const hostinger = path.join(root, 'hostinger');
const release = path.join(hostinger, 'release');
const publicHtml = path.join(release, 'public_html');

await rm(release, { recursive: true, force: true });
await mkdir(publicHtml, { recursive: true });
await cp(path.join(root, 'dist'), publicHtml, { recursive: true });
await cp(path.join(hostinger, 'public_html', '.htaccess'), path.join(publicHtml, '.htaccess'));
await cp(path.join(hostinger, 'public_html', 'api'), path.join(publicHtml, 'api'), { recursive: true });
await cp(path.join(hostinger, 'schema.mysql.sql'), path.join(release, 'schema.mysql.sql'));
await cp(path.join(hostinger, 'config.example.php'), path.join(release, 'config.example.php'));
await cp(path.join(hostinger, 'import-snapshot.php'), path.join(release, 'import-snapshot.php'));
await cp(path.join(hostinger, 'README.md'), path.join(release, 'README.md'));

console.log(`Pacote Hostinger criado em ${release}`);
