import Ajv2020Module from "ajv/dist/2020.js";
import type { ErrorObject, Options, ValidateFunction } from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

type AjvCtor = new (opts?: Options) => import("ajv").Ajv;

const Ajv2020 = Ajv2020Module as unknown as AjvCtor;
const addFormats = addFormatsModule as unknown as (ajv: InstanceType<AjvCtor>) => void;
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { SCHEMA_IDS } from "./schema-ids.js";
import type { ProviderRequest, ProviderResponse } from "./types-provider.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ValidationResult<T = unknown> {
  ok: true;
  data: T;
}

export interface ValidationFailure {
  ok: false;
  errors: ErrorObject[] | null | undefined;
}

export type ValidationOutcome<T = unknown> = ValidationResult<T> | ValidationFailure;

function readSchema(file: string): object {
  const text = readFileSync(join(__dirname, file), "utf8");
  return JSON.parse(text) as object;
}

export interface ContractValidators {
  validateChatRequest: ValidateFunction;
  validateChatResponse: ValidateFunction;
  validateProviderRequest: ValidateFunction;
  validateProviderResponse: ValidateFunction;
  validateToolCall: ValidateFunction;
  validateRuntimeInspection: ValidateFunction;
  validateErrorEnvelope: ValidateFunction;
  validateMemoryContext: ValidateFunction;
  assertValidChatRequest(data: unknown): asserts data is Record<string, unknown>;
  assertValidChatResponse(data: unknown): asserts data is Record<string, unknown>;
  assertValidProviderRequest(data: unknown): asserts data is ProviderRequest;
  assertValidProviderResponse(data: unknown): asserts data is ProviderResponse;
}

export function createContractValidators(): ContractValidators {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    allowUnionTypes: true,
  });
  addFormats(ajv);

  const loadOrder = [
    "memory-context.schema.json",
    "error-envelope.schema.json",
    "tool-call.schema.json",
    "runtime-inspection.schema.json",
    "provider-request.schema.json",
    "provider-response.schema.json",
    "chat-request.schema.json",
    "chat-response.schema.json",
  ] as const;

  for (const f of loadOrder) {
    ajv.addSchema(readSchema(f));
  }

  const validateChatRequest = ajv.getSchema(SCHEMA_IDS.chatRequest);
  const validateChatResponse = ajv.getSchema(SCHEMA_IDS.chatResponse);
  const validateProviderRequest = ajv.getSchema(SCHEMA_IDS.providerRequest);
  const validateProviderResponse = ajv.getSchema(SCHEMA_IDS.providerResponse);
  const validateToolCall = ajv.getSchema(SCHEMA_IDS.toolCall);
  const validateRuntimeInspection = ajv.getSchema(SCHEMA_IDS.runtimeInspection);
  const validateErrorEnvelope = ajv.getSchema(SCHEMA_IDS.errorEnvelope);
  const validateMemoryContext = ajv.getSchema(SCHEMA_IDS.memoryContext);

  const must = (v: ValidateFunction | undefined, id: string): ValidateFunction => {
    if (!v) throw new Error(`Missing compiled schema for ${id}`);
    return v;
  };

  const vChatRequest = must(validateChatRequest, SCHEMA_IDS.chatRequest);
  const vChatResponse = must(validateChatResponse, SCHEMA_IDS.chatResponse);
  const vProviderRequest = must(validateProviderRequest, SCHEMA_IDS.providerRequest);
  const vProviderResponse = must(validateProviderResponse, SCHEMA_IDS.providerResponse);
  const vToolCall = must(validateToolCall, SCHEMA_IDS.toolCall);
  const vRuntimeInspection = must(validateRuntimeInspection, SCHEMA_IDS.runtimeInspection);
  const vErrorEnvelope = must(validateErrorEnvelope, SCHEMA_IDS.errorEnvelope);
  const vMemoryContext = must(validateMemoryContext, SCHEMA_IDS.memoryContext);

  function assertValid(
    label: string,
    fn: ValidateFunction,
    data: unknown,
  ): asserts data is Record<string, unknown> {
    if (!fn(data)) {
      const msg = ajv.errorsText(fn.errors, { separator: "\n" });
      throw new Error(`[zayden:contracts] ${label} invalid:\n${msg}`);
    }
  }

  return {
    validateChatRequest: vChatRequest,
    validateChatResponse: vChatResponse,
    validateProviderRequest: vProviderRequest,
    validateProviderResponse: vProviderResponse,
    validateToolCall: vToolCall,
    validateRuntimeInspection: vRuntimeInspection,
    validateErrorEnvelope: vErrorEnvelope,
    validateMemoryContext: vMemoryContext,
    assertValidChatRequest(data: unknown) {
      assertValid("chat-request", vChatRequest, data);
    },
    assertValidChatResponse(data: unknown) {
      assertValid("chat-response", vChatResponse, data);
    },
    assertValidProviderRequest(data: unknown): asserts data is ProviderRequest {
      assertValid("provider-request", vProviderRequest, data);
    },
    assertValidProviderResponse(data: unknown): asserts data is ProviderResponse {
      assertValid("provider-response", vProviderResponse, data);
    },
  };
}

export function outcome<T>(
  fn: ValidateFunction,
  data: unknown,
): ValidationOutcome<T> {
  if (fn(data)) return { ok: true, data: data as T };
  return { ok: false, errors: fn.errors };
}
