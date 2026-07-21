import { assembleAutoData } from "@/lib/newsletter/assemble";
const auto = assembleAutoData(2026, 6);
console.log(JSON.stringify(auto, null, 2));
