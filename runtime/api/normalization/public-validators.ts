import Ajv2020Module from "ajv/dist/2020.js";
import type { Options, ValidateFunction } from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type AjvCtor = new (opts?: Options) => import("ajv").Ajv;
const Ajv2020 = Ajv2020Module as unknown as AjvCtor;
const addFormats = addFormatsModule as unknown as (ajv: InstanceType<AjvCtor>) => void;

const __dirname = dirname(fileURLToPath(import.meta.url));

function readPublic(name: string): object {
  const text = readFileSync(join(__dirname, "..", "schemas", name), "utf8");
  return JSON.parse(text) as object;
}

export interface PublicApiValidators {
  validatePublicChatRequest: ValidateFunction;
  validatePublicChatResponse: ValidateFunction;
  validatePublicErrorResponse: ValidateFunction;
}

let cache: PublicApiValidators | null = null;

export function getPublicApiValidators(): PublicApiValidators {
  if (cache) return cache;
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  for (const f of [
    "public-chat-request.schema.json",
    "public-chat-response.schema.json",
    "public-error-response.schema.json",
  ] as const) {
    ajv.addSchema(readPublic(f));
  }
  const must = (v: ValidateFunction | undefined, id: string): ValidateFunction => {
    if (!v) throw new Error(`Missing public schema compile: ${id}`);
    return v;
  };
  const req = must(
    ajv.getSchema("https://zayden.local/schemas/api/1-0-0/public-chat-request.schema.json"),
    "public-chat-request",
  );
  const res = must(
    ajv.getSchema("https://zayden.local/schemas/api/1-0-0/public-chat-response.schema.json"),
    "public-chat-response",
  );
  const err = must(
    ajv.getSchema("https://zayden.local/schemas/api/1-0-0/public-error-response.schema.json"),
    "public-error-response",
  );
  cache = {
    validatePublicChatRequest: req,
    validatePublicChatResponse: res,
    validatePublicErrorResponse: err,
  };
  return cache;
}
