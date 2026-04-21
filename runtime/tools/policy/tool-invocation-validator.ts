import Ajv2020Module from "ajv/dist/2020.js";
import type { Options, ValidateFunction } from "ajv/dist/2020.js";
import addFormatsModule from "ajv-formats";

import type { ContractValidators } from "../../contracts/validators.js";
import type { ToolDefinition } from "../base/tool.interface.js";
import { ToolInvocationValidationError } from "../base/tool.errors.js";
import type { ToolCallRecord } from "../base/tool.types.js";

type AjvCtor = new (opts?: Options) => import("ajv").Ajv;
const Ajv2020 = Ajv2020Module as unknown as AjvCtor;
const addFormats = addFormatsModule as unknown as (ajv: InstanceType<AjvCtor>) => void;

function assertPlainObjectArguments(args: unknown): asserts args is Record<string, unknown> {
  if (args === null || typeof args !== "object" || Array.isArray(args)) {
    throw new ToolInvocationValidationError("tool arguments must be a plain object");
  }
}

/**
 * Validates tool-call envelope (Ajv) and per-tool argument schema when declared.
 */
export class ToolInvocationValidator {
  private readonly argValidators = new Map<string, ValidateFunction | undefined>();

  constructor(private readonly contractValidators: ContractValidators) {}

  private getArgValidator(tool: ToolDefinition): ValidateFunction | undefined {
    if (!tool.inputSchema) return undefined;
    if (this.argValidators.has(tool.id)) {
      return this.argValidators.get(tool.id)!;
    }
    const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
    addFormats(ajv);
    const validate = ajv.compile(tool.inputSchema) as ValidateFunction;
    this.argValidators.set(tool.id, validate);
    return validate;
  }

  assertValidPendingToolCall(raw: unknown): ToolCallRecord {
    const v = this.contractValidators.validateToolCall;
    if (!v(raw)) {
      const msg = raw && typeof raw === "object" ? JSON.stringify(v.errors) : "not an object";
      throw new ToolInvocationValidationError("tool_call failed contract validation", msg);
    }
    const o = raw as ToolCallRecord;
    if (o.status !== "pending") {
      throw new ToolInvocationValidationError(`expected status pending, got ${o.status}`);
    }
    assertPlainObjectArguments(o.arguments);
    return o;
  }

  validateArgumentsForTool(tool: ToolDefinition, args: unknown): void {
    assertPlainObjectArguments(args);
    const validate = this.getArgValidator(tool);
    if (!validate) return;
    if (!validate(args)) {
      const detail = validate.errors ? JSON.stringify(validate.errors) : "unknown";
      throw new ToolInvocationValidationError(
        `arguments failed schema for tool ${tool.id}`,
        detail,
      );
    }
  }
}
