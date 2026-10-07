// Runs the Pulse M2 schema and send statements against PGlite and prints the results
// shown in the module. Usage (from the repo root): node reference/pulse-data-model/check.mjs
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const db = new PGlite();
await db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));
const { rows: [a] } = await db.query("insert into users (handle) values ('asha') returning id");
const { rows: [r] } = await db.query("insert into users (handle) values ('ravi') returning id");
const { rows: [c] } = await db.query("insert into conversations (kind) values ('direct') returning id");

const naive = `
with next as (update conversations set last_seq = last_seq + 1 where id = $1 returning last_seq)
insert into messages (conversation_id, seq, sender_id, client_id, body)
select $1, next.last_seq, $2, $3, $4 from next
on conflict (sender_id, client_id) do nothing
returning seq, client_id`;
console.log("send 1:", (await db.query(naive, [c.id, a.id, "c-1", "hi"])).rows);
console.log("send 2:", (await db.query(naive, [c.id, r.id, "c-9", "hey"])).rows);
console.log("retry 1:", (await db.query(naive, [c.id, a.id, "c-1", "hi"])).rows);
console.log("last_seq:", (await db.query("select last_seq from conversations where id=$1", [c.id])).rows);

const { rows: [c2] } = await db.query("insert into conversations (kind) values ('direct') returning id");
const fixed = `
with existing as (select seq from messages where sender_id = $2 and client_id = $3),
next as (
  update conversations set last_seq = last_seq + 1
  where id = $1 and not exists (select 1 from existing) returning last_seq
),
inserted as (
  insert into messages (conversation_id, seq, sender_id, client_id, body)
  select $1, next.last_seq, $2, $3, $4 from next
  on conflict (sender_id, client_id) do nothing
  returning seq
)
select seq, false as duplicate from inserted
union all
select seq, true as duplicate from existing`;
console.log("send:", (await db.query(fixed, [c2.id, a.id, "d-1", "hi"])).rows);
console.log("retry:", (await db.query(fixed, [c2.id, a.id, "d-1", "hi"])).rows);
console.log("next:", (await db.query(fixed, [c2.id, a.id, "d-2", "second"])).rows);
console.log("last_seq:", (await db.query("select last_seq from conversations where id=$1", [c2.id])).rows);
