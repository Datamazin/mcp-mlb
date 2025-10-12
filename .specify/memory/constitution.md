<!--
Sync Impact Report - Constitution v2.1.0
Version change: 2.0.0 → 2.1.0
Modified principles:
- ENHANCED: Dynamic API-First Development (now includes MLB-StatsAPI reference requirement)
- NEW: MLB-StatsAPI Reference Architecture (mandatory reference implementation)
- NEW: Dynamic Script Architecture (variable queries, no single-use files)
- ENHANCED: Official MLB.com Integration (renumbered to VII, expanded context)
- ENHANCED: Endpoint Consistency (MLB-StatsAPI pattern compliance required)
- ENHANCED: Feature Implementation Process (MLB-StatsAPI research required)
- ENHANCED: Governance (added dynamic script architecture verification)
Templates requiring updates:
✅ Updated: plan-template.md (added MLB-StatsAPI reference and dynamic script architecture checks)
✅ Updated: spec-template.md (added MLB-StatsAPI and dynamic script functional requirements)
✅ Updated: tasks-template.md (added MLB-StatsAPI research and dynamic naming convention tasks)
Follow-up TODOs: None - all templates synchronized with MLB-StatsAPI reference architecture
-->

# MLB MCP Server Constitution

## Core Principles

### I. Dynamic API-First Development (NON-NEGOTIABLE)
All code MUST leverage MLB API endpoints dynamically rather than using static implementations. Every tool MUST query available options from MLB metadata endpoints before making assumptions. No hardcoded lists of game types, stat types, or team configurations are permitted when API metadata is available. Scripts MUST support parameter-driven execution with sensible defaults derived from API metadata.

**Rationale**: MLB data changes frequently (roster moves, new game types, rule changes). Static implementations become outdated and brittle. Dynamic API queries ensure accuracy and comprehensive coverage.

### II. MLB Metadata-Driven Architecture
All features MUST use the MLB `/meta` endpoint to validate and discover available parameters before implementation. Valid stat types, game types, positions, job types, and other enumerations MUST be retrieved from `get-mlb-meta` rather than hardcoded. Tools MUST provide helpful error messages citing available options when invalid parameters are provided.

**Rationale**: The MLB API provides 57+ stat types, 12+ game types, and hundreds of job classifications. Hardcoding these leads to incomplete feature coverage and maintenance burden.

### III. Comprehensive Game Type Support
Every data retrieval tool MUST support all MLB game types: Regular Season (R), Spring Training (S), Playoffs (P), World Series (W), Division Series (D), League Championship (L), Wild Card (WC), Exhibition (E), All-Star (A), Fall League (F), Intrasquad (I), and special events. Game type filtering MUST be consistent across all tools with `R` (Regular Season) as default.

**Rationale**: Baseball analysis spans multiple contexts. Playoff performance differs from regular season; spring training provides developmental insights. Complete game type support enables comprehensive baseball analytics.

### IV. Real-time API Validation
Tools MUST validate user inputs against live MLB API data when possible. Player searches MUST use MLB search endpoints before falling back to known player databases. Team lookups MUST verify current team names and IDs. All parameter validation MUST prioritize live API responses over cached data.

**Rationale**: MLB rosters, team locations, and organizational structures change frequently. Real-time validation ensures accuracy and prevents stale data issues.

### V. MLB-StatsAPI Reference Architecture
All development MUST reference the MLB-StatsAPI project (https://github.com/toddrob99/MLB-StatsAPI) as the authoritative guide for endpoint design and implementation patterns. The endpoints documentation (https://github.com/toddrob99/MLB-StatsAPI/wiki/Endpoints) MUST be consulted for comprehensive API coverage. Implementation patterns MUST follow proven MLB-StatsAPI approaches for scalability and performance.

**Rationale**: MLB-StatsAPI provides battle-tested patterns, comprehensive endpoint coverage, and performance optimizations that prevent reinventing the wheel and ensure scalable architecture.

### VI. Dynamic Script Architecture
All JavaScript files MUST be named and designed for variable queries rather than single-use operations. Script names MUST reflect their capability scope (e.g., `get-player-stats.js` not `get-pete-alonso-stats.js`). Every script MUST accept dynamic parameters for player names, seasons, teams, and stat types. No hardcoded player-specific or team-specific script files are permitted.

**Rationale**: Dynamic scripts enable reusable tooling, reduce code duplication, and provide consistent interfaces for varied baseball analysis needs.

### VII. Official MLB.com Integration
All enhanced data tools MUST provide direct links to official MLB.com resources when available. Player profiles MUST include MLB.com profile links. Team information MUST include official team pages. Game data MUST reference official MLB.com game centers when applicable. This establishes authoritative source traceability for all data.

**Rationale**: MLB.com is the authoritative source for baseball information. Direct integration provides users with official context and ensures data authenticity.

## API Architecture Standards

### MLB-StatsAPI Reference Implementation
All endpoint implementations MUST reference the MLB-StatsAPI wiki (https://github.com/toddrob99/MLB-StatsAPI/wiki/Endpoints) for comprehensive endpoint coverage and proven patterns. Performance optimizations and caching strategies MUST follow MLB-StatsAPI best practices. Complex queries MUST leverage MLB-StatsAPI proven approaches for scalability.

### Endpoint Consistency
All MLB API calls MUST use consistent base URLs and versioning. The `/v1/` prefix MUST be used for all Stats API calls. Postseason data MUST use the dedicated `/schedule/postseason` endpoint when available. Error handling MUST include fallback to alternative endpoints when primary endpoints fail. Endpoint selection MUST prioritize MLB-StatsAPI documented approaches.

### Response Format Standards
All tools MUST return structured data with consistent field naming. Player statistics MUST include calculated metrics (K/9, BB/9, ERA) when raw data permits calculation. All responses MUST include data source attribution and timestamp when available from the API.

### Parameter Validation Protocol
Input parameters MUST be validated in this order: (1) Live MLB API metadata lookup, (2) Known parameter databases for common cases, (3) User-friendly error messages with suggested alternatives. No tool should fail silently due to parameter issues.

## Development Workflow

### Feature Implementation Process
New features MUST begin with MLB-StatsAPI endpoint research and MLB API metadata exploration to understand available parameters and response structures. Implementation MUST follow MLB-StatsAPI patterns for performance and scalability. All script files MUST be named for dynamic capability (e.g., `analyze-player-performance.js`) rather than specific queries (e.g., `pete-alonso-analysis.js`). All features MUST support both programmatic use (MCP tools) and command-line execution for testing with variable parameters.

### Testing Requirements
All tools MUST be tested with real MLB API data, not mock responses. Historical data queries MUST be validated against known baseball facts (e.g., 1985 Mets roster). Current season data MUST be tested against live API responses. Error conditions MUST be tested with invalid parameters.

### Documentation Standards
All tools MUST include usage examples with real MLB data. Parameter descriptions MUST reference MLB API metadata types. Error messages MUST guide users toward valid alternatives using metadata-driven suggestions.

## Governance

This constitution supersedes all other development practices. All code changes MUST comply with dynamic API-first principles. Static implementations are considered technical debt and MUST be refactored to use MLB API metadata. New features MUST demonstrate metadata-driven parameter validation before implementation approval. Single-use script files are considered anti-pattern and MUST be refactored to dynamic parameter-driven scripts.

All code reviews MUST verify: (1) MLB-StatsAPI reference compliance, (2) MLB metadata usage for parameter validation, (3) Comprehensive game type support, (4) Real-time API validation implementation, (5) Dynamic script architecture with variable parameters, (6) MLB.com integration where applicable, (7) Proper error handling with metadata-driven suggestions.

Complexity that violates these principles MUST be justified with specific technical requirements that cannot be met through MLB API metadata. Simple solutions using MLB API metadata are always preferred over complex custom implementations.

**Version**: 2.1.0 | **Ratified**: 2025-10-12 | **Last Amended**: 2025-10-12