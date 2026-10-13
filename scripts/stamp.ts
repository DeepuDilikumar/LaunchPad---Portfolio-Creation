/** Stamp a PDF by hand: pnpm stamp <input.pdf> <email> <orderId> [output.pdf] */
import fs from "node:fs";
import { stampPdf } from "../lib/stamp";

const [input, email, orderId, output] = process.argv.slice(2);
if (!input || !email || !orderId) {
  console.error("usage: pnpm stamp <input.pdf> <email> <orderId> [output.pdf]");
  process.exit(1);
}
const out = output ?? input.replace(/\.pdf$/, `-${orderId}.pdf`);
stampPdf(fs.readFileSync(input), { email, orderId }).then((bytes) => {
  fs.writeFileSync(out, bytes);
  console.log(`stamped → ${out}`);
});
