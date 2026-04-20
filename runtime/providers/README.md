# Provider gateway (`runtime/providers`)

Phase 3 introduces the **execution boundary** between ZAYDEN core and external model runtimes.

## Layout

- `base/` — `ProviderAdapter` interface, shared types (aliases of contract mirrors), errors
- `registry/` — `ProviderRegistry` + `ProviderGateway` (validates ingress/egress with Ajv)
- `adapters/` — concrete adapters (`mock`, `gemma-local` stub, future bridges)

## Rules

- **Never** import `research/*` from adapters in this phase.
- **Never** return vendor SDK objects from `execute()` — only `ProviderResponse` contract objects.
- Gateway **must** call `assertValidProviderRequest` / `assertValidProviderResponse` (no bypass).

## Usage sketch

```ts
import { createContractValidators } from "../contracts/index.js";
import { MockProviderAdapter } from "./adapters/mock/mock.adapter.js";
import { ProviderGateway, ProviderRegistry } from "./registry/provider-registry.js";

const validators = createContractValidators();
const registry = new ProviderRegistry();
registry.register(new MockProviderAdapter("mock"));
const gateway = new ProviderGateway(validators, registry);
```

See `docs/phases/phase-03-provider-gateway.md` and `docs/architecture/openclaude-adaptation-plan.md`.
