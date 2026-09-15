# Studio

Requires a real Supabase Auth user whose `tv_members.role` is `admin`. Viewer controls are not sufficient enforcement: server membership checks and RLS independently reject writes.

Overview links to the six-page configuration editor, LUMI and Tawan knowledge. Managers cover events, memories, albums, media, letters/capsules, notes, wishlist, themes, music, surprises and facts.

Pages editor supports title/subtitle, accent, glow, text scale, alignment, density and motion. Home sections can be reordered/hidden. Preview is rendered locally without a database publish. Saving page/surprise forms creates drafts. Drafts can be previewed and applied through the drafts tab. Other record forms support direct Save or Save Draft.

LUMI edit mode accepts natural language; it can generate one or more proposals. Review each proposal; Apply is available after opening Preview. Use history Compare/Undo to restore. Server optimistic concurrency refuses stale proposals and undo after intervening edits.

Knowledge manager stores factual descriptions, source attribution and tags for retrieval. Avoid inventing details or using uncertain assumptions as confirmed facts. Canonical birth/relationship dates use the manual Facts manager.

Completed events offer creation of a linked memory. Wishlist active items can be randomly selected then converted to an event transactionally. Memory Story Mode displays selected album/search results; annual counts reflect currently accessible real records.

Media uploads go directly to the private Supabase bucket with user JWT. Copy the displayed `storage://...` reference into cover/song fields. Upload and metadata-save failures attempt to remove the orphan upload. Deleting metadata is recoverable through history and deliberately retains stored files.

A locked capsule disappears from lists after sealing until unlock; this includes admins and history rows containing locked content. The current editor does not support encrypted attachment capsules or editing a sealed capsule before unlock.
