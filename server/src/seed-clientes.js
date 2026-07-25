// Cadastra/atualiza os clientes da Meraki (coleções) com o dossiê da marca.
// Uso na VPS:  node src/seed-clientes.js clientes.json
// Idempotente: roda quantas vezes quiser (INSERT OR REPLACE por id).
import { readFileSync } from "fs";
import { db } from "./db.js";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("uso: node src/seed-clientes.js <clientes.json>");
  process.exit(1);
}

const clientes = JSON.parse(readFileSync(arquivo, "utf8"));
const stmt = db.prepare("INSERT OR REPLACE INTO collections (id, name, color, brief) VALUES (?,?,?,?)");
const tx = db.transaction((lista) => {
  for (const c of lista) stmt.run(c.id, c.name, c.color, c.brief ?? null);
});
tx(clientes);

console.log(`${clientes.length} clientes cadastrados:`);
for (const c of db.prepare("SELECT name, LENGTH(brief) AS n FROM collections ORDER BY name").all()) {
  console.log(` - ${c.name} (${c.n ?? 0} chars de dossiê)`);
}
