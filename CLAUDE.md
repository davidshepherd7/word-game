We're making a boggle style game: a grid of letters where we drag between them
to create words. Eventually we'll add RPG and gatcha features around collecting
buffed letters.

# Stack

* React UI
* Isolated logic code in pure typescript
* TODO: some localstorage abstraction
* No backend for now.

# Visual design

Keep it simple for now but include classes so that we can style it later.

Use colours reminiscent of a typewritter on paper (but not typewritter fonts or anything).

# Work split between me and claude

* Frontend (tsx, css) - claude handles most of this, I don't really care.
* Logic - decomposed into deep modules. I care a lot about the module interfaces, claude figures out the module internals.
* Tests - two kinds of tests. Module interface tests - I care about these. Module internal tests - I don't care about these, claude figures it out.

# Coding guidelines

* All types on interfaces should be immutable/readonly by default.
