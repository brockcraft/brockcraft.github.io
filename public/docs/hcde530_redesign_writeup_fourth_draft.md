# Redesigning a Graduate Course with AI: A Process Guide

**Brock Craft, University of Washington, Department of Human Centered Design & Engineering**

---

## Note on this revised draft

Sections changed substantively in this revision:

- **What "AI-Assisted Curriculum Revision" Actually Means** now includes a specific moment from the design archives. The previous version described the human-AI collaboration accurately but in the abstract. The new version grounds it in a concrete mid-session decision where a technical choice turned out to be a pedagogical one.

- **The Tool Stack and How It Evolved** now names what triggered the Railway/Render removal (GitHub's native `.ipynb` rendering made a deployment server unnecessary) and flags a gap: the full pedagogical reasoning behind several core decisions is in a separate conversation archive not captured in these design sessions. That reasoning is not reconstructed here.

- **The Slides and Teaching Guide Were Not a One-Way Handoff** is a new section. The production sequence was described in the previous draft as linear. It was not. After all ten slide decks were complete, a reconciliation pass revealed that the slide builder had added structural slides the teaching guide had not specified. The guide required updating with instructor notes for slides that now existed. This loop will happen to anyone replicating the process.

- **Gotchas** is substantially expanded. New entries cover: the TG–slide reconciliation gap, the two-directory problem in Claude.ai, TA positioning as a recurring course-design correction, competency domain labels as a mid-session propagation incident, decisions that reversed during production, and timestamp discipline.

- **"Why write this up?" moved to after "The Problem"** and reframed to carry both the documentation purpose and the nature of the project as a deliberate experiment.

- **First person restored throughout.** The previous draft converted to third person, which produced passive voice throughout. This draft returns to first person.

---

## The Problem

HCDE 530 is a graduate course in computational methods for students in Human Centered Design and Engineering — an MS program whose graduates go on to work as UX researchers, UX designers, and design strategists. The course has always had a practical goal: give students enough technical competency that they can collect and analyze data programmatically, prototype lightweight interactions, and collaborate more effectively with developers because they understand, at least approximately, what developers do.

For years, that meant teaching Python from the ground up. It was hard but defensible. Non-programmers in a ten-week quarter could acquire enough skill to do useful things — scrape data, clean a CSV, call an API — and the exercise of learning to program had secondary benefits even for students who would never write code professionally.

Then large language models got good enough to code.

By late 2024, it was clear the course needed a substantial rethink. Not because the learning objectives had changed — students still needed to work with data, build lightweight tools, and understand programmers' work — but because the path to those objectives had shifted. A student who can articulate a problem clearly, inspect generated code, question an output, and decide whether it is trustworthy can now do useful work much sooner than a student who has spent ten weeks memorizing syntax. The old course taught programming as the main route to computational competence. The redesign began from a different premise: for these students, in this program, computational competence now depends more on judgment than on hand-writing code from scratch.

That shift was not abstract. HCDE 530 serves students in a professional master's program, many of whom are career changers and many of whom are not aiming to become software engineers. The course meets once a week, on Wednesday evenings, for four hours. There is enough time to do substantial work in class, but not enough time to build conventional programming fluency from the ground up without pushing the course toward a computer science identity that is misaligned with the students and the degree.

The previous version had also drifted toward that problem. It used Kaggle notebooks, standard Python exercises, data manipulation libraries, and a larger machine learning component. None of that was irrational. But it pulled the course toward data science training rather than toward the professional needs of HCD practitioners. One of the earliest redesign decisions was not just to modernize the course, but to recenter it.

I was also on sabbatical with a compressed timeline — the kind that would normally rule out anything more than incremental updates. What I needed was a way to do a substantive redesign quickly, maintain coherence across ten weeks of new material, produce all the artifacts a modern course requires, and preserve my voice and judgment as the instructor.

---

## Why write this up?

Two reasons, and they pull in slightly different directions.

The first is practical. A redesign this involved leaves a lot of tacit knowledge scattered across conversation threads, build scripts, and task files. Writing it down while it was fresh made recovery — and reuse — possible. Some readers may want to borrow this workflow almost wholesale. Others may only want parts of it: the division of work across threads, the use of markdown as the source of truth, the rules-file approach, or the handoff documents that keep long projects coherent across sessions. The practical guidelines at the end are there for readers who mainly want to know what to think about before they begin.

The second reason is that this project was also a deliberate experiment, and I want to be honest about that. I was not following a proven workflow. I was figuring out what AI-assisted curriculum design could actually look like in practice — what kind of work it was good for, what kind of scaffolding it needed, where it required correction, and where it made things possible that would not otherwise have been feasible in the time I had. The workflow described here emerged from a series of decisions, some of which turned out to be right and some of which had to be reversed.

I think that experimental quality is part of what makes this worth documenting. AI-assisted curriculum design is not yet a settled practice. This is one worked example of how it went, with the failures left in.

---

## What "AI-Assisted Curriculum Revision" Actually Means

Before getting into the mechanics, it is worth being clear about what this was and was not.

Claude did not design the course. I designed the course. What Claude did was help me move from design decisions to finished artifacts much faster than I could have alone. Once I had established the conceptual frame, Claude could draft a ten-week teaching guide, produce assignment descriptions that matched the emerging competency model, create TA-facing materials in the right register, and help me propagate a change across many interdependent files.

It also served as a design partner in a narrower sense. Early in the process, the conversation was not about writing documents. It was about pressure-testing ideas. Should the course still teach Python as a primary skill? Should students use a general code editor or an AI-native one? Should the first week use vibecoding tools to establish the category of AI-assisted development before moving into code literacy? Should machine learning remain as a technical unit, or be reframed as a critical evaluation problem? Claude was useful in this phase because it could keep multiple implications in view at once and make it easy to compare alternatives. But the alternatives still had to be chosen.

**One moment from the archives illustrates how this worked in practice.** Partway through the session that produced the assignment descriptions, the A and MP assignments had their submission type set to `online_text_entry` — students would paste work directly into Canvas. Claude had drafted plausible assignment descriptions around that setup. I changed it to `online_url`, a GitHub repo link, for a specific reason: the repo already contains the full commit history, making a text box submission redundant and moving the evidence of process away from where it actually lives. Claude updated all the affected descriptions without complaint. The decision itself was not complicated. What it required was someone who knew where the evidence of learning should live — and that is not a judgment Claude was positioned to make.

The human judgment in this project was substantial and constant. Claude has no direct knowledge of the social dynamics of a graduate classroom, the physical layout of an active learning room with seven round tables, the realistic amount of live coding I can demo in one evening, or the difference between what sounds coherent in a planning document and what students will actually engage with at 7 PM on a Wednesday after a day at work. It also has no reliable instinct for when a technically plausible idea is pedagogically wrong for a particular course.

That mattered repeatedly. Some of the most useful moments in the design archives are not moments when Claude produced a strong draft, but moments when I had to redirect it. The redesign kept improving when the conversation stayed anchored to actual students, actual class meetings, actual professional scenarios, and actual constraints. Claude handled production and helped surface options. I handled judgment, sequencing, tone, and fit.

That division of labor is the core of this method.

---

## Starting Materials

The raw materials I brought into the project at the outset were straightforward, but they ended up being used in different ways than I expected.

- **An IMSCC export from Canvas** — the LMS course package from the previous year's version of the course. IMSCC is a standard e-learning interchange format, but its internal structure is not self-documenting. It became relevant twice: first as a source of prior assignment text and course structure, and later as the ground truth for building a compliant import file for the redesigned course shell.
- **The previous year's syllabus** as a PDF.
- **The previous year's session slide decks** as PDFs.
- **A body of prior course content** extracted from Canvas into structured JSON.
- **Some example Python scripts** from prior iterations of the course.

The old slides were a scrap pile rather than a template. They helped me identify what the previous course had emphasized, what conceptual scaffolding might still be worth adapting, and where it had drifted toward computer-science-style instruction. They also helped me recover useful diagrams without having to reinvent them. But they were not something to preserve wholesale. Much of the course had changed too much for that.

The extracted Canvas content was more useful as a structural reference than as reusable prose. It showed how the previous course had handled assignments, what kinds of student-facing explanation were load-bearing, and where there were inherited categories that no longer made sense. The IMSCC export later became far more important than I expected, because it supplied the only reliable reference for how Canvas wanted the rebuilt course package to be structured.

One early lesson: treat these inputs as targeted references, not as bulk source material to dump into a model all at once. Slide PDFs are expensive to analyze. Legacy course exports contain noise as well as signal. The better approach was to ask narrow questions of these materials: what did the old course teach in Week 5, which diagrams are still worth reusing, what exact XML structure does Canvas expect, which old assignment conventions are safe to carry forward.

---

## The Tool Stack and How It Evolved

I started the project in Claude.ai, using a Project with attached files. That was the right place to begin because the early work was exploratory: discussing the pedagogical pivot, establishing the new tool stack for the course, defining the competency-based assessment model, and testing how far the redesign should go.

The first major course-level design move was not about files at all. It was about reframing the course. I moved away from bottom-up Python instruction and toward AI-assisted computational practice as the organizing idea. Week 1 was rebuilt around vibecoding platforms — Lovable and Bolt — not because those exact tools were the end goal, but because they established a category of work students now need to understand: describing what they want in plain language, inspecting what the tool gives back, and deciding whether it is fit for purpose. One of the recurring Week 1 framings became: the tools will change, the judgment will not.

That principle shaped later decisions. Claude.ai remained central as a coding partner. Cursor replaced a more neutral code editor as the primary local environment. GitHub stayed in the stack, reframed as part version control, part documentation, part portfolio. Plotly replaced matplotlib throughout. Kaggle was removed. HuggingFace as a technical exercise was removed. Machine learning content was repositioned toward critical reading and evaluation rather than implementation.

*Note: the full reasoning behind these decisions — why vibecoding before Python, why Kaggle was removed, and the HCD identity argument that drove the recentering — is documented in a separate conversation archive that predates these design sessions. This section describes what was decided. A subsequent pass can fill in why, from that source.*

Some decisions were reversals. The course initially carried a deployment story that included Railway and Render as server options for students who built Python-based tools. That turned out to be wrong for this course. During assignment production, it became clear that GitHub renders `.ipynb` files natively, making a server unnecessary for the research track, while Lovable and Bolt already handle deployment for the design track. I removed Railway and Render from the course materials entirely. The phrase that entered the Week 8 teaching guide — "There is no Railway. There is no Render." — became a load-bearing teaching moment, not an infrastructure footnote. That correction happened during assignment writing, not planning.

At the workflow level, a second evolution happened in parallel. Claude.ai Projects were useful at the start, but they became awkward once working documents began changing frequently. I moved to a local file-based workflow in Cowork, where Claude could operate directly on the course folder. That eliminated the upload/download loop and made it possible to treat the file system itself as the durable project memory.

In chat, files are attachments. In a local workspace, files become the project. That distinction matters more than it sounds like it will.

---

## Chat vs. Cowork: When to Use Which

Use chat with a Project for the exploratory phase: establishing design decisions, debating pedagogical approaches, testing alternatives, and figuring out what the course is now trying to do.

Switch to a local file-based workflow once you have a stable file set that multiple sessions need to share. The transition point in this project came when the teaching guide source, task files, rules file, and content files became stable enough to serve as inputs to subsequent sessions. At that point, the files needed to be the source of truth rather than copies attached to a chat.

That shift also changed the kind of work Claude was good at. In the exploratory phase, the value was conversational: option generation, comparison, challenge, and synthesis. In the production phase, the value was file-aware coordination: update this assignment number everywhere, revise this competency label across all affected files, regenerate the guide, update the slide spec, and preserve the task list so the next session can resume cleanly.

---

## The Three-Thread Architecture

I eventually organized the project into three distinct conversation threads, each with a bounded responsibility:

| Thread | Responsibility | Primary Inputs | Primary Outputs |
|--------|---------------|----------------|-----------------|
| **Thread 1** | Course design, teaching guide, assignments, syllabus, TA guides, Canvas content source files | Design decisions, task list, rules file, archives | `.docx` teaching guide, `.md` content files, demo assets |
| **Thread 2** | Slide generation | Completed teaching guide + slide spec notes + PPTX build notes | Per-week slide decks |
| **Thread 3** | Canvas shell population | All `.md` content files + Canvas build notes + IMSCC build system | Populated Canvas course and `.imscc` import file |

The reason for keeping these separate was not aesthetic. Each thread has a different failure mode.

Thread 1 is where the authoritative content lives. If something goes wrong there, I need to be able to correct it without disrupting downstream work. Thread 2 has aesthetic and layout decisions embedded in its own context — the visual language of the slide deck, the notes structure, the build scripts, the asset conventions. Keeping it isolated preserves that continuity. Thread 3 is isolated because Canvas population is error-prone in a completely different way: import quirks, rubric setup order, link resolution, and packaging details. Errors there should not contaminate the design and writing work upstream.

A firm rule emerged: **Thread 1 never generates slides or touches Canvas directly. Thread 2 never edits assignments or the teaching guide. Thread 3 never edits source markdown files.**

This division also solved a context-window problem. Long curriculum work accumulates a lot of state. Separating the work by domain kept each thread intelligible.

---

## The File System

The project produced a specific set of file types, each with a defined role.

### `.md` — Markdown source files

I wrote all Canvas content — assignment descriptions, syllabus, build notes, TA guides, handoff documents, rules files — as markdown first. Canvas was treated as a destination, not as the place where course content gets authored.

This became one of the most useful decisions in the entire redesign. Once course content lives in markdown, it is inspectable, diffable, reusable, and portable. It is also easier for Claude to work with cleanly. A file like `assignments.md` can be the authoritative source for every assignment body, while `canvas_import_notes.md` can serve as the machine- and human-readable brief for the Canvas build thread.

The `assignments.md` file used a specific delimiter convention: student-facing content above a `---` separator, Canvas build instructions below. This made the file machine-parseable — I had to explicitly instruct the import agent to stop at the delimiter and not paste build notes into Canvas.

### `.docx` — Instructor-facing teaching guide

The teaching guide existed as a generated Word document, but the source of that document was plain text with a fixed internal structure: week header, BEFORE YOU ARRIVE, FRAMING FOR STUDENTS, timing table, GOTCHAS, and KEY TAKEAWAY. The `.docx` was an output, not the place where edits should happen.

That distinction had to be enforced. One of the rules files makes it explicit: never edit the generated `.docx` directly, because the next build will overwrite it. Edit the source, regenerate, validate.

### Build scripts

Where document generation or packaging required code, I kept the scripts alongside the project rather than treating them as disposable one-off artifacts. That included scripts for the teaching guide, the GitHub reference sheet, the TA guides, the PPTX decks, and the Canvas IMSCC package.

### Task files and handoff files

The task files did far more than track checkboxes. They became part project log, part state store, part instruction layer for future sessions. The RESUMING block at the top of `thread1-tasks.md` told a new session where the project actually was, what came next, which files mattered, and what constraints applied. `AGENT_START.md` formalized the read order for new sessions. `HANDOFF.md` summarized the project for thread transitions. `curriculum_revision_rules.md` recorded conventions and lessons that should survive beyond a single course.

That file ecology was not decorative. It was the mechanism that made a long AI-assisted project maintainable.

---

## The Production Sequence

The production sequence that emerged was this:

1. confirm course design decisions
2. build the teaching guide
3. write assignment descriptions
4. write the syllabus
5. create Canvas-bound content files
6. update slide specification notes
7. generate slides
8. produce TA guides and demo assets
9. build and import the Canvas shell
10. update the rules and handoff documents so the project can be resumed or reused

That order mattered. It was tempting at points to jump ahead — especially to slides or to Canvas population — because those activities feel like visible progress. But the project worked best when the authoritative content layer stabilized first. Slides depend on the teaching guide and slide markers. Canvas depends on the markdown files and build notes. TA guides depend on the session structure. If those layers move after downstream work starts, the project becomes brittle.

The sequence was also evolutionary rather than clean. Some steps overlapped. Demo assets were produced while other documents were still being refined. Slide work ran in parallel once the guide and slide spec were stable enough. The Canvas build system had to be developed while content files were still being checked. But the dependency structure held throughout: source content first, presentation and LMS layers second.

---

## The Slides and Teaching Guide Were Not a One-Way Handoff

The production sequence above describes slides as downstream of the teaching guide, and that is true for the initial build. But the relationship ran in both directions, and anyone replicating this process should expect that.

The `📊 SLIDE` markers embedded in the teaching guide were designed as content creation flags — wherever a slide was needed, a marker specified what it should cover. Those markers became the brief for Thread 2. But the slide builder added structural slides beyond what the markers specified: agenda slides, transition slides, closing slides, and context-setting slides that emerged from the layout and pacing of each deck. These slides had no corresponding instructor notes in the teaching guide, because the guide had never been asked to provide them.

After all ten decks were complete, I ran a reconciliation pass between the Week 1 slide deck and the teaching guide. Of the 18 slides in that deck, 8 had `📊 SLIDE` markers; 4 had no corresponding instructor notes at all. I had to update the teaching guide with notes for those slides — not as error correction, but because the slide deck now existed and the guide had to account for what was in it. The reconciliation pass for Weeks 2–10 was still pending at the close of the project.

There is a secondary feedback loop as well. Whenever Thread 1 changed content after `SLIDE_SPEC_NOTES.md` had been handed off — assignment names, competency labels, framing language — I had to update the spec before the next slide build. A stale spec produces decks that do not match the teaching guide. In practice, I updated the spec multiple times during Thread 1 production and reviewed it again before Thread 2 continued.

The practical implication: plan for at least one reconciliation pass between the teaching guide and the slide decks after the full set of decks is built. The pass is not optional. It is where instructor notes get written for slides Claude added on its own initiative.

---

## The Role of Rules Files and Technical Artifacts

One of the more unexpected outcomes of this project is that the course materials themselves are only part of what was produced.

The redesign also generated a set of technical and procedural artifacts that are likely to be useful to other instructors:

- a standing rules file that records conventions, workflow, and known hazards
- agent bootstrap and handoff files that make it possible to resume long projects without starting from scratch
- thread task files that function as live operational memory
- slide build notes documenting PowerPoint packaging quirks
- Canvas IMSCC analysis and build-plan files documenting import requirements that are poorly explained elsewhere
- reusable build scripts for documents, slide decks, and the LMS import package

I want to make these available in a GitHub archive, with course-specific details abstracted where that makes sense. The Canvas import/export workflow and the PowerPoint build workflow in particular may be useful beyond this course once they are cleaned up and documented for general use. The point is not that these artifacts are polished software products. It is that they record the practical knowledge of the redesign, and that practical knowledge is what is otherwise hardest to recover later.

---

## Gotchas

The archives surfaced several kinds of gotchas. Some were pedagogical. Some were organizational. Some were technical. All of them mattered.

### Claude will fill gaps with generic pedagogy unless the context is strong

Left on its own, Claude drifts toward a familiar kind of instructional writing: generic learning outcomes, classroom activities that sound plausible but have no real friction in them, and sequencing that assumes idealized students. The redesign got better when I made the context more specific: a four-hour evening class, active learning room, non-technical TA, graduate HCD students, an instructor who did not want the course to become a disguised Python bootcamp.

The fix was to encode those realities into rules and constants files and to require every new session to read them first.

### Claude often aimed one notch too technical

This happened repeatedly. It proposed activities that assumed too much setup fluency, used terms too casually, or drifted toward conventional programming instruction.

One correction recurred often enough to become a hard rule: early drafts positioned the TA as a resource for setup questions and code errors. My TA is non-technical — cannot diagnose Python errors, explain git internals, or lead setup blocks. Any draft where a student with a broken environment would naturally turn to the TA had to be corrected. The corrected framing: the TA circulates, catches students who fall behind, normalizes anxiety, and flags issues to the instructor. That is a course-design decision, not a staffing preference, and it has to be present in the context for Claude to respect it.

Other corrections of the same type: define "docstring" before using the word in student-facing text, use "reorganize" instead of "refactor" in early weeks, avoid activities that require writing Python from scratch before Week 5, treat `.env` file setup as something to explain rather than an in-class hands-on activity.

These are not stylistic details. They are course-design decisions disguised as wording choices.

### Tool decisions need to be treated as pedagogical decisions

Choosing Cursor over a generic editor, introducing Lovable and Bolt in Week 1, removing Kaggle, using Plotly instead of matplotlib, simplifying deployment — these were not tooling preferences. They were decisions about what kinds of work students should be learning to recognize, do, and judge.

The redesign improved when I named those decisions explicitly rather than treating them as incidental implementation details.

### Competency domain names must be confirmed before production starts

The competency model did not arrive fully formed. Two domain labels changed mid-session, after assignment descriptions were already being drafted. C2 shifted from "Code reading and version control" to "Code literacy and documentation" — commit messages, docstrings, and README writing are the same skill (making code legible to others and to future-self), and the narrower label missed that. C7 shifted from "Critical evaluation of AI output" to "Critical evaluation and professional judgment" — the narrower label excluded trust calibration and communicating confidence to stakeholders, which are central to what the course is trying to develop.

Each change had to propagate across the teaching guide, assignments, syllabus, slide spec, and closing remarks. The propagation was mechanical but created real risk of inconsistency across files.

The lesson: confirm domain names before writing the first assignment. They appear everywhere, and changing them after production has started costs more than it looks like it will.

### The slides and teaching guide require a reconciliation pass

Described in the dedicated section above. The short version: the slide builder adds structural slides the teaching guide does not specify. After all decks are built, those slides have no instructor notes. Plan for a reconciliation pass after the full set of decks is complete, not after each individual week.

### Slides required their own architecture and their own mistakes

The slide work generated a separate class of gotchas. The visual system needed its own thread to preserve aesthetic continuity, notes structure, and build conventions across weeks. More importantly, the PPTX build process turned out to be fragile in ways that were hard to anticipate.

The archives document a cumulative-deck bug: after completing each week, I updated the base template to that week's completed deck. The next build script unpacked the template, inherited all prior slides, and listed both prior-week and current-week slides in its slide order. Decks grew without any error being thrown. Week 5, which should have been 19 slides, contained 31 — all of Week 4 plus Week 5 content. Week 6 contained 42 slides instead of 12. The cover slide showed the Week 3 title on every deck regardless of which week the file was actually for.

The fix was procedural and technical: preserve a true single-slide base template, patch the cover per week, and ensure every build script includes only that week's slide order. Three rules were added to the build system's header comment block to prevent the bug from recurring.

There were smaller PPTX issues too: layout references that triggered PowerPoint repair prompts, duplicate relationship IDs, missing notes-master relationships, and content-type declarations that had to be exact. None of these are interesting in themselves, but they matter if the goal is reusable slide-generation infrastructure rather than one-off decks.

### Canvas import is more fragile than it should be

The Canvas thread produced the most stubborn failures in the project. I built the IMSCC package from scratch, and it failed with Canvas's generic error message — no detail, no log access for instructors. Every fix required a full rebuild and reimport. Five rounds.

The eventual fixes were highly specific: `imsmanifest.xml` had to be the first file in the ZIP; the ZIP had to use `ZIP_STORED` rather than standard deflate compression; some XML root element names had to match Canvas exports exactly; `late_policy.xml` needed an identifier attribute; human-readable identifiers had to be normalized to a `g` plus MD5-based form; the syllabus resource had to appear in the right place; some seemingly plausible attributes had to be removed because Canvas does not actually export them.

This is exactly the sort of knowledge that should live in a reusable technical archive, because it is hard-won and not something most instructors should have to reverse-engineer from scratch.

### Canvas still required manual cleanup after a successful import

Even once the IMSCC package imported, the work was not done. I had to attach rubrics manually, check "Remove points from rubric" on each competency-based assignment, update placeholder slide URLs as decks were delivered, and verify some syllabus content and link resolution in Canvas itself.

A successful import does not mean a finished course shell.

### Context-window management is a design problem, not an inconvenience

Long projects decay if their state only lives in conversation history. The solution in this project was not merely to start new chats. It was to design for resumability: explicit handoff files, task files with resuming blocks, and rules files that captured conventions before they could drift.

If AI is going to help with multi-week curriculum work, the process needs external memory. This is one of the strongest general lessons from this redesign.

### The two-directory problem in Claude.ai

In Claude.ai, output files and project knowledge files are separate. Every time I updated a file during production, I had to manually sync it from the outputs area back to the project knowledge base. This friction accumulated over long sessions and led to version inconsistencies. Moving to a local file-based workflow in Cowork eliminated the problem — the project folder is the source of truth and there is nothing to sync.

If you return to Claude.ai for any reason: build the sync discipline into the session structure, not the end of it.

### Plan for decisions to reverse mid-production

Several design directions reversed during production rather than during planning. The Railway/Render deployment story was in the course plan until assignment writing made its problems obvious. Module landing pages were planned, added to the task list, and then dropped when it became clear the Canvas module structure itself was sufficient context for students. In both cases, Claude was helpful in the wrong direction — drafting content for a decision that should have been reconsidered.

Treat production as a second design phase, not just execution. When Claude is generating content for a particular decision and the content looks wrong, the decision may be the problem.

### Timestamps require discipline

The archives note this explicitly: timestamps were invented rather than fetched for the first half of one production session, caught and corrected. Invented timestamps are plausible and wrong, and they appear in every file footer. The fix is one command:

```bash
TZ='America/Los_Angeles' date '+%B %d, %Y — %I:%M %p'
```

Run it. Use the output. Never approximate.

---

## A Note on Competency-Based Assessment

One of the structural changes in this redesign was moving from a traditional points-accumulation grading model to a competency-based one. Students demonstrate eight competency domains; the regular weekly assignments and mini-projects are graded complete/incomplete, with non-scoring competency rubrics attached. The one scored item is the end-of-quarter reflection, which asks students to make the case for what they demonstrated across the term.

This model fit the redesigned course for several reasons.

First, it matched the underlying pedagogical shift. If the course is no longer about accumulating syntax knowledge but about developing practical judgment across a range of computational tasks, then a competency model makes that visible more cleanly than a conventional points model.

Second, it forced precision about what the course actually values. The domain names could not stay vague because they had to appear repeatedly in assignment descriptions, rubric language, slides, and closing remarks. The work of refining those labels sharpened the course.

Third, the model fit the students and the quarter structure. The weekly work could remain low-stakes and cumulative, while the final reflection became the place where students integrated what they had done. In practice, Canvas still had to be coerced into representing this cleanly. The weekly assignments were set to complete/incomplete with zero points. The rubrics were feedback only. The reflection carried points. The final grade still involved instructor judgment based on the portfolio of work.

Competency-based assessment does not remove judgment from the system. It makes the basis for judgment clearer.

---

## Guidelines for Replicating This Process

If you want to attempt a similar project, here is what to do.

Start with decisions, not content. Before asking the AI to produce anything, work through the major design questions: what the course is trying to produce, what tool categories students will work in, what passing looks like, and which constraints are non-negotiable.

Write a course constants or rules file immediately. Include logistics, student background assumptions, room reality, TA constraints, hard prohibitions, terminology decisions, and the grading model. Make every new session read it first.

Confirm competency domain names, assignment numbering, and the grading model before writing the first assignment. These appear in every competency-assessed assignment. Changing them after production has started costs more than it looks like it will.

Use exploratory chat first, then switch to a local file-based workflow once stable working documents exist. The transition point matters.

Produce content in dependency order. Teaching guide first, then assignments, then syllabus, then Canvas content files, then slides, then LMS build work.

Treat markdown files as the source of truth and treat Canvas as downstream.

Keep separate threads for content, slides, and LMS population. This is not over-engineering. It is what keeps long projects from collapsing under their own context.

Track decisions outside the conversation. If a naming convention, platform choice, assignment numbering change, or rubric rule only lives in chat history, it is lost.

Expect to redirect the AI often. The value is not that it gets everything right. The value is that it makes iteration cheap enough that you can keep steering until the design fits.

Plan for a reconciliation pass between the teaching guide and the slide decks. The slide builder will add slides the guide did not specify. Those slides need instructor notes.

Plan for decisions to reverse during production. Treat the production phase as a second design phase, not just execution.

Archive the technical process as well as the course materials. Rules files, handoff documents, build notes, and scripts are part of the outcome.

Plan for LMS iteration. A working import file and a finished course shell are not the same thing.

Read the course arc as a whole before calling it done. AI can produce locally coherent sessions that do not add up to a coherent quarter.

---

## What This Produced

At the end of this process, the course had:

- a complete ten-week teaching guide with per-session timing, framing language, gotchas, and key takeaways
- assignment descriptions for all major assessments, written as source markdown files and ready for Canvas import
- a full syllabus
- TA guides calibrated to a non-technical teaching assistant
- demo assets for multiple weeks, including scripts, datasets, notebooks, transcripts, and a small API
- per-week slide decks and the build infrastructure used to create them
- a Canvas import file and the build system used to generate it
- rules files, task files, and handoff files that made the project resumable across sessions
- a body of technical notes that could support a reusable GitHub archive for other instructors

The time savings were real. A redesign of this scope would normally have taken much longer. But the more important result is not the speed. It is that the project produced both a course and a process. The course can now run. The process can now be inspected, critiqued, reused, and improved.

That second outcome may prove just as useful as the first.

---

## Files Produced by This Project

For reference, the file set that emerged from this project:

| File | Type | Purpose |
|------|------|---------|
| `curriculum_revision_rules.md` | `.md` | Standing orders, conventions, three-thread architecture, course constants, and known gotchas |
| `AGENT_START.md` | `.md` | Bootstrap file for new sessions — what to read, in what order |
| `thread1-tasks.md` | `.md` | Running task list for content and design work, with RESUMING block |
| `thread2-tasks.md` | `.md` | Running task list for slide generation |
| `HANDOFF.md` | `.md` | Handoff summary for thread transitions |
| `SLIDE_SPEC_NOTES.md` | `.md` | Slide generation spec for all ten weeks |
| `PPTX_BUILD_NOTES.md` | `.md` | Technical notes for building slide decks without triggering PowerPoint repair or cumulative-deck errors |
| `IMSCC_STRUCTURE_ANALYSIS.md` | `.md` | Structural analysis of a prior Canvas export used to derive import requirements |
| `SP26_BUILD_PLAN.md` | `.md` | Planning file for the Canvas import package: IDs, modules, due dates, and resource registry |
| `HCDE530_Teaching_Guide_SP26.docx` | generated `.docx` | Instructor-facing teaching guide built from source text |
| `assignments.md` | `.md` | All assignment descriptions — authoritative source |
| `syllabus.md` | `.md` | Full course syllabus — authoritative source |
| `canvas_import_notes.md` | `.md` | Canvas build instructions, link registry, and import notes |
| `ta_guides.md` | `.md` | All TA guides, with Week 2 full-format and lighter weekly guides elsewhere |
| `build_teaching_guide.py` | script | Regenerates the teaching guide |
| `build_github_ref.py` | script | Builds the GitHub reference sheet |
| `build_ta_guides.js` | script | Builds the TA guides document |
| `build_imscc.py` | script | Regenerates the Canvas import package |
| `hcde530_pptx_helpers.py` and weekly slide build scripts | scripts | Shared PPTX helper functions and per-week deck generation scripts |
| `design-archive-1.md` to `design-archive-5.md` | `.md` | Historical summaries of the design and production threads |

---

*This write-up reflects the state of the project as of March 2026. The course runs Spring Quarter 2026.*
