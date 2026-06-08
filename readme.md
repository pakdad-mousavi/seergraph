# Seergraph
A tool for github repo analysis with and development.

## Project Structure (Not Finalized)
seergraph/
│
├── apps/
│   ├── cli/
│   ├── github-action/
│   └── dashboard/        (later phase)
│
├── packages/
│   ├── core/              HEART OF SEERGRAPH
│   ├── analyzer/          impact, risk, simulation
│   ├── parser/            AST + tree-sitter
│   ├── graph/             dependency graph engine
│   ├── rules/             architectural rule engine
│   ├── git/               git history analysis
│   └── shared/            utilities, types
│
├── docs/
├── examples/
├── tests/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json