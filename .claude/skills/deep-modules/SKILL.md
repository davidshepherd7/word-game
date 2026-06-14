---
name: deep-modules
description: >-
  Design reference for deep modules. Consult BEFORE writing, changing, or reviewing any logic module.
---

# Deep modules

The logic layer of this game is decomposed into **deep modules** (the term is from
John Ousterhout's *A Philosophy of Software Design*). David owns the module
**interfaces**; Claude owns the **internals**. Get the interface right and the rest
follows. This skill is the reference for what "right" means here.

## The one idea

> A module's **depth** is its functionality divided by the size of its interface.
> Deep modules hide a lot behind a little. Make modules deep.

A deep module offers a small, simple interface and hides a large, possibly complex
implementation behind it. The interface is the *cost* a caller pays; the
implementation is the *value* they get. Maximize value, minimize cost.

The opposite — a **shallow module** — has an interface nearly as complicated as its
implementation. It adds ceilings of API surface without hiding much. Shallow modules
are worse than no module: they cost more to learn and use than they save.

## What makes an interface good

- **Hide implementation decisions.** A module's interface should focus on what
  it does, not how. Data structures, algorithms, and the existence of
  caches/indexes are internals. If changing the implementation forces an
  interface change, the decision leaked.
- **Design for the common case.** Make the frequent call trivial; let rare needs be
  slightly more verbose. Don't widen the interface for edge cases most callers never hit.
- **Define errors out of existence.** Prefer interfaces where error conditions simply
  can't arise over interfaces that make callers handle them. (e.g. a "find words on the
  board" call that returns `[]` rather than throwing when none exist; a path validator
  that returns a typed result instead of throwing.)
- **General-purpose beats special-purpose.** A slightly more general interface ("get the
  cells on this path") is usually both simpler *and* more reusable than a pile of
  specific ones ("getFirstCell", "getLastCell", "getMiddleCells").
- **Names carry weight.** A precise interface name lets the caller skip reading the
  implementation. Vague names ("process", "handle", "data", "manager") signal a module
  that hasn't decided what it is.

## Red flags — stop and rethink if you see these

- **Shallow module.** The interface is about as big/complex as the implementation. Ask:
  does this hide anything? If not, inline it or merge it into a deeper neighbor.
- **Information leakage.** The same design decision (a file format, a board encoding, a
  scoring rule) is baked into two or more modules, so they must change together. Pull the
  knowledge into one module that owns it.
- **Temporal decomposition.** Modules split by *order of execution* ("read", then
  "modify", then "write") rather than by knowledge. This scatters one concern across
  several shallow modules. Decompose by what a module *knows*, not when it runs.
- **Pass-through methods.** A function that does little but call another function with the
  same signature. It adds interface without adding depth. Collapse the layer.
- **Pass-through / conjoined modules.** Two modules so entangled you must understand both
  to use either — every change to one ripples to the other. They want to be one module.
- **Overexposure.** The interface forces callers to learn about a rarely-used feature just
  to do the common thing. Push the rare feature behind a default.
- **Config-as-escape-hatch.** Exporting tuning knobs / options to dodge an internal
  decision the module should just make. Decide it inside.
