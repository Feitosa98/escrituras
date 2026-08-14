import pngToIco from 'png-to-ico';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputFile = path.join(__dirname, '../public/logo-mark.png');
const outputFile = path.join(__dirname, 'icon.ico');

console.log(`Convertendo ${inputFile} para ${outputFile}...`);

pngToIco(inputFile)
  .then(buf => {
    fs.writeFileSync(outputFile, buf);
    console.log('Ícone gerado com sucesso!');
  })
  .catch(err => {
    console.error('Erro ao gerar ícone:', err);
    process.exit(1);
  });
