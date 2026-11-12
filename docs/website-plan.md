# RimMaker website plan and balance-adviser specification

Status: implementation plan for the existing Vue/PrimeVue application. This document precedes implementation. The release below adds the balance adviser; future capabilities are explicitly identified. The Colony Console theme, existing editing/export paths and optional native-engine testing remain the foundation.

## Current direction: automatic review with explicit Apply

The user subsequently requested no required balance inputs, an automatically chosen reference, current/proposed examples and an optional power slider. They explicitly selected **Preview first, then Apply adjustments**, rather than immediate mutation. This supersedes the earlier manual-only balance UI restriction for this narrowly scoped tuning proposal; the historical specification and first-release validation below remain an audit trail.

The main Balance page and editor tab now share the actual selected draft. Technology, template-role, reference and captured test distances are chosen automatically. No draft means a labelled, non-applicable demonstration. Optional power is 75–125% of the chosen reference's primary output, not a total-combat score. Proposed changes remain on a clone until Apply; Undo restores the previous recovery field only and refuses to overwrite a later manual edit. Stale proposals are rejected and recalculated before Apply.

First tuning protocol: ordinary, supported single-verb bullet/arrow output only; match the sum of equal-duration primary-rate observations at shared captured ranges (Shooting 10) by changing cooldown, rounded to a game tick. Preserve damage/AP, accuracy, range, burst, assets, materials, technology and access. Report unreachable targets and tick-floor limits; do not invent numerical effects for unsupported mechanics. This is a limited tuning preference anchored to one official weapon, not a discovered universal balance equation or a full-stat optimizer.

Presentation: three read-only open-lane illustrations using the existing pawn/weapon/projectile assets and native-checked travel/burst equations. A shared play/stop action shows travel only. No hit outcomes or impact effects are fabricated. Full RimWorld behavior requires the actual game engine; browser visuals must never be labelled complete simulation. The existing native preview path remains intact.

The filter-heavy reference explorer is retained at `/reference/balance` via Equipment guide, outside the automatic player flow. Detailed evidence is collapsed by default. Existing historical comparison functionality is preserved for research rather than required for normal use.

Automatic-flow validation: 359 unit checks, 28 browser checks and five companion/media checks passed. Tests exercise automatic matching, no mandatory setup controls, the shared selected draft, slider preview without mutation, Apply, Undo, stale-proposal rejection, unsupported effects, empty-session demonstration and actual exported recovery values. Three live-engine browser integrations remain skipped; the visual comparison is not new native-game calibration.

## Product contract

Help someone create a pawn-equippable weapon, understand its exported definitions, test its behavior, compare it with official peers and export a usable mod. Preserve the separate ownership of ThingDef, statBases, equippedStatOffsets, VerbProperties, Tool, ProjectileProperties and recipeMaker. Plain language accompanies field paths; the XML model must remain inspectable.

The current authoring scope is ranged weapons, melee weapons and grenades. Apparel is an equipment-guide/research capability, not a working apparel editor. Turrets, mech weapons and built-in attacks remain future scope. No paywall, interruptive monetization, fabricated overall power score, auto-balance or automatic authored-field edits in this release.

## Site map and shared shell

| Surface | Purpose and complete behavior |
| --- | --- |
| Overview `/` | Explain supported types, template → edit → test → compare → export workflow; link to workbench, balance library and equipment guide. Avoid promising unsupported creation features. |
| Workbench `/weapon` | Current mod inventory, enabled DLC definitions, add/delete weapons, mod folder name, export action and reason when disabled. Preserve edits while navigating via existing KeepAlive. Refresh/closing remains a documented loss boundary; durable saves/imports require a separate design. |
| Balance library `/balance` | Browse all 67 official pawn-held references; technology first, then weapon kind/role, then a declared scenario. All DLCs included independently of authoring-pack toggles. Show missing metrics explicitly. |
| Equipment guide `/reference` | Preserve existing weapon/apparel authoring guidance and scope limits; link to balance library. Never present unsupported editor types as implemented. |
| Header/footer | Same navigation, active states, skip link, project/community links, attribution and optional support link. No unsolicited export donation modal. |

Navigation must preserve entered values, media selections and assessment filters. Stop preview sounds on section changes using existing lifecycle behavior. Support keyboard navigation, visible focus and mobile wrapping without page overflow. Unknown routes need a useful navigation recovery rather than an empty page (future hardening if not already covered).

## Workbench layout and every editor area

Sidebar remains mod-wide: DLC switches, named weapon list with type, Add weapons, mod folder validation and export guidance. Selected weapon header keeps its name, kind and guarded Delete. Add dialog keeps type-specific official templates, custom baseline and quantity; disabled DLC content cannot silently become an export dependency.

| Editor area | Fields, ownership and behavior |
| --- | --- |
| Weapon / Details | Name and description; add native technology level with the exported `ThingDef/techLevel` path. Choosing a level declares classification; it does not change power or research gates. |
| Weapon / Graphic | Existing texture upload/reference/fallback, size and file-type advice; retain source texture separately from comparison data. |
| Weapon / Handling sound | Template-specific SoundDef, replacement file and same-button play/stop. Unavailable preview is distinct from a valid export reference. |
| Weapon / Stat Bases | Existing weapon-owned work, mass, accuracy anchors and cooldown. Do not move projectile damage into statBases or apply pawn offsets as weapon stats. |
| Weapon / Stat Offsets | Preserve expanded help and percentage-point translator. It translates stored offset, not final hit probability. Hidden stats cannot be rejected by name alone. |
| Weapon / NPC tags | Existing tag picker/custom tags, faction candidate explanation, explicit inheritance replacement. Classification/eligibility is independent from combat power and ownership. |
| Attacks / Verbs | Range, min range, warmup, burst/timing, verb class and sounds; embedded reusable range scene. Total effective range and unsupported modifier warning remain explicit. |
| Attacks / Tools | Each tool's capacities, power, cooldown, AP, weight and extras. Keep melee primary attacks distinct from a gun's fallback melee attacks. |
| Projectile | Existing/shared projectile choice, class/damage definition, injury/AP, explosive radius/fuse, flight and applicable special fields. Avoid ordinary-bullet estimates for fire, gas, EMP, beam or scatter paths. |
| Crafting / Stuff | Allowed categories and material amount. Selecting stuff applies native material rules; fixed ingredients do not become combat bonuses. |
| Crafting / Cost List | Preserve icons, resource selectors, quantities and add/remove. Adviser reports route alternatives, partial coverage and unresolved items rather than money-based weights. |
| Crafting / Recipe maker | Existing benches, research, skill requirements and ingredient/work rules. Tech level does not imply these unlock conditions. |
| Preview | Preserve village/range scenes, native engine checks, sound/texture defaults, accuracy curve and weather/quality/skill/cover overlays. Scenario visuals do not silently supply balance coefficients. |
| Balance (new tab) | Reactive draft assessment, technology-peer graphs, coverage, ingredient effort, effect-specific limits and manual edit links. Remains nonblocking for export. |

Forms use existing PrimeVue Select, InputNumber, Message, Panel, Button, Tabs and DataView components with theme tokens. New CSS is scoped layout/chart styling, not global input overrides. Labels sit with their inputs; checkbox spacing and repeatable row alignment retain the earlier fixes.

## Balance information architecture

1. **Technology bracket:** default to the weapon's native/inherited tech level; library starts Industrial. Allow explicit comparison against another bracket without changing the weapon. Display all actual tiers, including an empty Archotech bracket. Never infer a tier from DPS alone.
2. **Weapon group and role:** ranged includes grenades in the library; melee has a different output metric. Optional role filter is a research grouping, not a native XML field. Show cohort size and caution for small/specialist cohorts.
3. **Scenario:** expose only captured skill/distance combinations (skills 0/10/20, ranges 3/12/25/40). Primary comparison is clear, standing, uncovered, unarmoured target, Normal/default-stuff reference. No cross-scenario mixing.
4. **Summary:** current scoped output, cohort coverage, median/range where supported, and observed relative position. This is not a fairness grade or a discovered target band. Show null distinctly from zero and unreachable separately from unmeasured.
5. **Graphs:** named peer output; reach versus output (melee uses penetration); crafting workload versus output. Highlight the draft; keep native references visible. Each chart has matching numeric/keyboard-accessible inspection. Missing metrics never become zero-valued marks.
6. **Complete roster:** every filtered definition stays in a searchable, sortable, paginated PrimeVue reference list, including DLC uniques and special weapons. Include native technology, type/role, pack, output coverage, work and range/AP. Selecting a reference reveals assumptions, research, tags and effect evidence. Rows stack on phones rather than squeezing long names into narrow columns.
7. **Why / manual direction:** compare like-for-like measured axes. Explain damage/accuracy/burst/cycle contributions and direct users to actual fields; decreasing cooldown increases output, while increasing damage can also increase implicit AP. Do not prescribe a numerical target from tiny cohorts or equate extremes with errors.
8. **Production and access:** quantities and nominal work stay separate from researched per-unit mining/harvest/recipe routes. Show alternative direct-step hours with exclusions; do not add all routes, allocate co-products arbitrarily, or call them full supply-chain costs. Research roots, skills and tags remain separate gates.
9. **Special effects:** show native measurements by target/context when available, with limits and immutable provenance. EMP time, stagger, smoke, nerve, fire/gas and shield disruption are separate outcomes, not arbitrary extra damage points. Draft effects that were not measured cannot borrow a template's measured outcomes.
10. **Evidence:** compact game version/hash, source protocol, full roster denominator and limitations. Ship numerical reference extracts, not game DLLs/assets or decompiled bodies. No runtime dependence on local game files, research documents or a preview server.

## Calculation and confidence contract

- Generate a compact, versioned app catalog deterministically from the accepted local research; preserve all 67 IDs, packs, native technology, role proposal, scenario-specific rates, material/reference baseline, gates and measured special outcomes.
- Ordinary draft bullet output uses existing native-checked accuracy rules, projectile damage, burst size and nominal warmup + inter-shot interval + cooldown. It is aim-weighted primary projectile input per second, not final injury, win chance or guaranteed real-time DPS.
- Reject unsupported modifiers, stuff-dependent draft evaluation, custom damage workers, multiple verbs, special/extra effects and invalid/nonfinite inputs from the ordinary live estimate. A valid but out-of-range draft is labelled unreachable, not unmeasured.
- Native melee average-primary reference values may be shown, but edited melee cannot reuse them as a live calculation without a validated full material/quality/tool-selection evaluator. Show the draft's tool values and explicitly require native testing instead.
- Treat captured reference special effects as reference-only. Generated traits, changed conditions and changed definitions require new native tests.
- No regression-derived score, utility conversion, one price/power ratio, money-derived material weights, percentile fairness threshold or hidden optimizer.

## States and interaction rules

Empty mod: keep Add and library entry points usable. Empty peer bracket: explain absence; do not suggest another tier automatically. Incomplete fields: show which prerequisite prevents a draft estimate; preserve independent work/resources. Unsupported mechanic: show its actual reason, reference effects and native-test direction. Sparse cohort: describe observations without declaring balanced/unbalanced. Disabled DLC: existing export dependency warning persists; reference browsing never changes enabled packs. Long labels: wrap/truncate with accessible full text. Mobile: stack filters, plots and value readouts; no clipped controls or lost rows.

Manual edit actions navigate to the correct existing tab and section without modifying data. Technology changes are deliberate form edits and export to XML. Comparison preferences never export or become game stats. Opening/using balance must not rename weapons, alter costs/tags, replace assets or change export eligibility.

## Release acceptance and verification

- Unit checks: all 67 catalog records/44 ranged-grenades/23 melee; numeric scenario fidelity against native captures; known assault-rifle baseline; damage/cooldown direction; unchanged fixed-ingredient combat output; tech export/clone preservation; unsupported special paths; null versus out of range; missing material routes; no model mutation.
- Browser checks: library navigation; industrial/spacer cohort counts; full special roster; empty bracket; scenario updates; draft changes reflected after editing; manual jump to actual input; texture/sound/form state preserved; valid special weapon still exports; responsive 390px/desktop charts and controls; no browser errors.
- Existing unit suite and browser regression suite must pass. Build with the existing GitHub Pages base path and keep native testing paths intact. Add balance tests to CI's regular browser command.
- Record actual implementation/verification and any remaining limitations in a release note. This plan is not a claim that future persistence, apparel editing, extended melee calculation or auto-balance exists.

## Implemented release

Implemented the balance-library route/navigation, reusable editor Balance tab, technology authoring/export, role/technology/scenario comparisons, three graphs, complete searchable/sortable/paginated roster, reference effects and gates, per-ingredient effort alternatives, manual edit navigation and evidence/coverage states. Existing PrimeVue theme and editor ownership are preserved. The balance module loads on demand.

Validation: 354 unit checks, 27 browser checks, five companion/media checks and two Python extraction checks passed. Three browser cases requiring a live local RimWorld companion were skipped; this release uses the earlier accepted native research and adds no new game-engine calibration. Production build passed. Browser tests cover desktop and 390px layouts, sparse/empty brackets, changing scenarios, draft updates, collapsed-section field focus, preserved comparison state, technology XML and export of special weapons with unknown output.

Remaining limits: live ordinary-bullet estimates are nominal primary input, not final injury or full combat strength; modified melee/material-dependent and special effects require native testing. Reference utility is never copied onto an edited draft. The spacer cohort still has only two ordinary primary estimates. No auto-balance, scalar fairness grade, money-based weight, apparel editor or durable draft saving was implemented.
