Agent Start: Student Project Gallery

1. Project summary

Build a static, Pinterest-style gallery website that displays student project tiles from a JSON file. Each tile should show a header image, student name, project title, track, tags/themes, and a short preview description. Clicking a tile should expand it into a larger view so the user can read the full project description and see the image more clearly.

The site should be deployable on GitHub Pages and should not require a backend database for the first version. Images will eventually be collected separately through a Google Form and uploaded manually into the repository. Until then, tiles may use a placeholder image.

The main goals are:

* strong visual browsing
* smooth motion and card transitions
* simple content updates through repository files
* no unnecessary infrastructure

2. Non-goals for the first version

Do not build:

* a database-backed editing system
* login/authentication
* student self-editing inside the site
* server-side APIs
* complex admin tools
* real-time collaboration

The site should be intentionally lightweight.

3. Recommended stack

Use a React-based front end. The most practical choice is:

* Next.js or React + Vite for the site itself
* Motion for React or Framer Motion for animations
* static deployment on GitHub Pages
* JSON as the source of truth for project metadata
* image files stored in public/images/

If the implementation uses Next.js, ensure the build/deploy path is compatible with static export for GitHub Pages.

4. Data model

The JSON file is the canonical content source. Each project entry should include enough data to support the tile view and the expanded detail view.

Suggested fields:

* id: stable unique identifier
* student_name: display name
* first_name / last_name: optional if useful
* title: project title
* track: Design, Research, or Both
* summary_short: 1–2 sentence preview shown on the tile
* summary_long: fuller description shown in expanded view
* themes: array of thematic tags
* audience: optional short audience description
* image: relative path to the header image
* placeholder_image: optional fallback path if the project image is missing
* submission_id: optional, if useful for traceability
* platform: optional, if useful as metadata
* late: optional, if you want to preserve it, but it is probably not needed in the public site

Keep the JSON human-readable and easy to update by hand.

5. Content generation strategy

The first version should not generate summaries dynamically in the browser. Instead:

* derive summary_short and summary_long ahead of time from the JSON data
* store them directly in the JSON file
* let the site render them as-is

This keeps the site simple and avoids adding runtime AI dependencies.

If helpful, the summaries can be created from the existing submission text by an external preprocessing step, but that preprocessing does not need to be part of the website itself.

6. Image handling

All final images should live in one repository directory, such as:

* public/images/

Use a single placeholder image until final images are available.

Recommended image rules:

* use consistent aspect ratio if possible
* optimize file size before committing
* prefer JPEG or WebP for photographic images
* keep filenames stable and tied to the project ID or student name

Example paths:

* public/images/placeholder.jpg
* public/images/4572531.jpg
* public/images/alobaid.jpg

The JSON should point to these image paths.

7. Required UI behavior

Grid / gallery view

* Masonry or Pinterest-style grid
* responsive layout across desktop, tablet, and mobile
* each tile shows image, name, title, track badge, and preview text
* tiles should feel visually distinct but uniform enough to scan quickly

Expanded detail view

Clicking a tile should open a larger view. The detail view may be:

* a modal
* a lightbox panel
* an in-place expanding card

Preferred behavior:

* smooth transition from tile to detail view
* the tile appears to grow rather than abruptly switch pages
* close action returns the user to the same scroll position in the gallery

Expanded view should show:

* larger image
* full project description
* student name
* title
* track
* tags/themes
* any optional metadata that is helpful but not noisy

Filters and navigation

The site should include controls for browsing by:

* track
* theme/tag
* audience type
* platform/tooling if useful
* search by student name or project title if feasible

A few higher-level organizing views may also be useful:

* design vs research
* thematic clusters
* interface-first vs computation-first
* audience groups

Motion and transitions

The site should use polished motion, but not at the expense of usability.

Use motion for:

* tile hover states
* card expansion/collapse
* grid reflow when filters change
* subtle entrance transitions on page load
* smooth sorting/reordering animation

Motion should feel fluid and light, not distracting.

8. Suggested component breakdown

A clean React architecture would likely include:

* GalleryPage or main page component
* FilterBar
* SearchInput if implemented
* ProjectGrid
* ProjectCard
* ProjectDetailModal or ExpandedProjectCard
* TrackBadge
* ThemeChips
* ImageWithFallback
* utility functions for filtering and sorting

Keep components small and composable.

9. Styling direction

The visual style should feel polished, warm, and editorial. Think:

* large image tiles
* generous spacing
* rounded corners
* subtle shadows
* readable typography
* restrained color palette
* clear hierarchy between preview and detail states

Do not overcomplicate the design system. The content should remain the focus.

10. Motion and layout recommendations

A motion library should be used for:

* layout transitions when cards move
* modal transitions
* hover scale or elevation
* staggered page entry

Cards should retain identity when filtered or expanded so the experience feels continuous.

11. Static hosting and deployment

The target deployment is GitHub Pages.

Assume:

* no backend server
* no runtime database
* no server-side writebacks
* assets are committed into the repo
* GitHub Pages serves the final build output

Confirm the build process works in a static deployment environment before adding any advanced framework features.

12. Content workflow for the human maintainer

The maintainer will:

1. update the JSON file with project metadata and summaries
2. add image files to the image directory as they are received
3. redeploy the static site

Do not build an editing interface for students at this stage.

13. Important implementation constraints

* Keep dependencies minimal.
* Prefer simple, maintainable code.
* Avoid introducing a backend unless it becomes unavoidable.
* Avoid any feature that depends on authenticated writes from the browser.
* Make the site resilient when images are missing by falling back to the placeholder.
* Make sure the gallery still looks good when some summaries are short and others are long.

14. Acceptance criteria

The project is ready when:

* the site loads from GitHub Pages
* it reads project data from a JSON file
* tiles render correctly in a responsive masonry/grid layout
* each tile shows a short preview summary
* clicking a tile opens a larger detail view with the full description
* images can be swapped by editing file paths in JSON and replacing files in public/images/
* filters and motion work smoothly
* the site remains usable without any backend services

15. Suggested next implementation sequence

1. set up the React app and deployment target
2. define the JSON schema
3. render the gallery grid with placeholder images
4. build filtering and sorting
5. build the expandable detail view
6. add motion transitions
7. test static deployment on GitHub Pages
8. add real images and refine summaries

16. Practical note on summaries

The short preview summaries should be written so they can stand alone on a tile. They should be brief, specific, and descriptive, not generic marketing copy. The full description in the expanded view can be more complete, but it should still be concise enough to read comfortably.