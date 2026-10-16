import {readFile,writeFile} from 'node:fs/promises';
const products=JSON.parse(await readFile(new URL('../data/collection.json',import.meta.url),'utf8'));
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const rows=products.map(product=>`(${quote(product.id)}, ${quote(JSON.stringify(product))}::jsonb, false)`);
await writeFile(new URL('../supabase/collection.sql',import.meta.url),`-- Eight supplied bouquets priced at exactly 30% above the supplied Florarium prices.\n-- Verify supplier availability before activation. Existing prices and active status are preserved on repeat imports.\ninsert into public.products(id,data,active) values\n${rows.join(',\n')}\non conflict(id) do update set data = products.data || (excluded.data - 'price' - 'stems');\n`);
