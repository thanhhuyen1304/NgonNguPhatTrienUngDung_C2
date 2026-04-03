# Teacher-Style Refactor Contract

## Goal

Refactor this ecommerce project so it feels closer to the teacher's code style in `Folder/`, while keeping the current features working.

The target style is:

- simple and direct
- easy to read
- route/domain oriented
- little abstraction unless repetition justifies it
- "not smart, but works fine"

This contract treats `Folder/` as a **style reference**, not a source to copy blindly.

## Authoritative Reference Snapshot

Use this folder as the main style reference:

- `Folder/NNPTUD-C2-20260323`

Older snapshots are useful only to understand the teacher's progression, not as the main target.

## What To Emulate

### Backend style

- keep domain files obvious and direct
- prefer resource-based organization: route + schema/model + a few small helpers
- keep request handling close to the domain logic
- avoid over-abstracted service layers if the logic is still small enough to read in one place
- name files and modules simply and consistently
- extract helpers only when logic is clearly repeated

### Coding style

- use practical function names
- prefer straightforward branching over clever helper chains
- prefer boring, explicit data flow over meta abstractions
- optimize for maintainability by students/team members

### Frontend style

- keep UI logic close to the page/component that uses it
- avoid adding new abstraction layers unless there is repeated behavior
- simplify flows that became too "AI-looking" or too indirect

## What MUST NOT Be Copied From The Teacher Sample

Do **not** copy these unsafe or outdated patterns from `Folder/`:

- hardcoded secrets
- hardcoded MongoDB connection strings
- hardcoded JWT keys
- duplicate function definitions
- weaker validation rules
- EJS/view-based architecture rewrite
- broad inline rewrites that break current frontend/backend contracts
- reducing current security just to look more like the sample

## Hard Preservation Rules

These parts must stay behavior-compatible while refactoring:

- route paths already used by the frontend
- auth semantics and role checks
- cookie/JWT session behavior
- order, cart, wishlist, and checkout flows
- admin and shipper flows that are already working
- support chat behavior that has already been stabilized

## Domains To Refactor First

Refactor in this order:

1. `catalog` (`products`, `categories`)
2. `auth` and `users`
3. `cart`, `wishlist`, `orders`
4. `shipper`, `support`, shared middleware/config
5. frontend cleanup only where it reduces complexity safely

## Domains To Defer

Do not aggressively refactor these until contracts are stable:

- payment integration
- coupon/promotion work not yet implemented
- CI structure beyond small maintenance
- large UI redesigns

## Current Architectural Problems To Fix Gradually

### Backend

- some controllers are too large, especially order/auth areas
- some domains mix responsibilities (`order`, `shipper`, `user`)
- route/controller patterns are inconsistent between modules
- support chat currently mixes simple REST behavior with leftover realtime history

### Frontend

- customer flows often use Redux slices, but admin/support pages often fetch directly
- some pages feel over-engineered compared to the teacher's simple style
- some support/admin flows were more complex than necessary and should be simplified

## Refactor Rules

- one domain at a time
- no project-wide rewrite in one pass
- each slice must build and pass the closest available verification before moving on
- if a refactor adds abstraction without reducing confusion, reject it
- if a change makes code look more "framework-clever" than the teacher sample, simplify it

## Commit Rules

- use small commits by domain
- one commit for backend model/route/controller setup of a feature
- one commit for frontend UI of a feature
- one commit for stabilization/cleanup only if needed
- never hide many unrelated refactors in one giant commit

## Success Criteria

The refactor is successful when:

- the code feels simpler and more direct
- domain responsibilities are clearer
- the app still works
- the code looks closer to a student-maintainable educational project
- the project is less "AI-generated" in style, but still stable in behavior

## Practical Interpretation

The teacher's codebase is not "clean architecture". It is a progressive teaching codebase.

So the real target is:

- simpler structure
- fewer unnecessary layers
- more direct CRUD/business handlers
- less clever indirection
- still keep the stronger parts of the current project when they are already necessary

This means the correct refactor is **simplify and align**, not **copy and downgrade**.
