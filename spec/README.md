# Jsonita Specification

`spec/` is the single formal source for Jsonita's product design and
architecture. It explains lasting behavior and boundaries; source code, tests,
and scripts own exact implementation details.

| Read in this order | Purpose |
| --- | --- |
| [00-product.md](00-product.md) | Product scope, non-goals, and document authority |
| [10-behavior.md](10-behavior.md) | User-visible behavior and safety promises |
| [20-architecture.md](20-architecture.md) | Module ownership, data flow, and invariants |
| [30-operations.md](30-operations.md) | Local data, privacy, reliability, logging, and release |
| [40-validation.md](40-validation.md) | Change-specific verification gates |

Use [../design/README.md](../design/README.md) only for screen hierarchy and
interaction intent. Do not add visual styling, component internals, SQL,
payload schemas, prompts, or command transcripts to this directory.
