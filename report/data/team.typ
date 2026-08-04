// =============================================================================
// team.typ — the 15 active trustees and ambassadors
// =============================================================================
//
// Mirrored from `lib/data/team.ts`, in source order. Two entries there
// (Isha Sangrolkar, Raquel Anne Maderazo) are commented out and are
// deliberately EXCLUDED — do not restore them from the 2025 impact report's
// team page, which predates their departure.
//
// Fields:
//   prefix   honorific, or "" — kept separate so a caption can drop it
//   first    given name(s)   — line 1 of the two-line portrait caption
//   last     family name     — line 2
//   role     the human-facing role, not the internal `roles[]` array
//   file     PNG basename in public/img/team/ (see the SARA GHAFOOR note below)
//   founder  true for the single larger portrait
//
// ⚠️  SARA GHAFOOR'S PORTRAIT IS NOT IN public/img/team/.
//     lib/data/team.ts gives her image as "/img/Sara.png" — one directory up
//     from every other member. Her record below carries `dir: "/img"`; everyone
//     else carries `dir: "/img/team"`. Resolve the path as `dir + "/" + file +
//     ".png"` rather than assuming the directory, or her portrait silently
//     renders as a missing box.
// =============================================================================

#let team-dir = "/img/team"

#let team = (
  (
    prefix: "Dr.",
    first: "Mahsa",
    last: "McCauley",
    role: "Founder & Chair",
    dir: "/img/team",
    file: "Mahsa",
    founder: true,
  ),
  (
    prefix: "",
    first: "Mike",
    last: "McCauley",
    role: "Trustee & Assets Manager",
    dir: "/img/team",
    file: "Mike",
    founder: false,
  ),
  // (
  //   prefix: "",
  //   first: "Raquel",
  //   last: "Maderazo",
  //   role: "Event Manager",
  //   dir: "/img/team",
  //   file: "Raquel",
  //   founder: false,
  // ),
  (
    prefix: "Dr.",
    first: "Meeta",
    last: "Patel",
    role: "Industry Lead",
    dir: "/img/team",
    file: "Meeta",
    founder: false,
  ),
  (
    prefix: "",
    first: "Prasanth",
    last: "Pavithran",
    role: "Industry Lead",
    dir: "/img/team",
    file: "Prasanth-Pavithran",
    founder: false,
  ),
  // ⚠️  Portrait lives at /img/Sara.png, NOT /img/team/Sara.png.
  (
    prefix: "",
    first: "Sara",
    last: "Ghafoor",
    role: "Marketing Lead",
    dir: "/img",
    file: "Sara",
    founder: false,
  ),
  (
    prefix: "",
    first: "Chan",
    last: "Meng",
    role: "Website Team Lead",
    dir: "/img/team",
    file: "Chan",
    founder: false,
  ),
  (
    prefix: "",
    first: "Marriane",
    last: "Bentigan",
    role: "Marketing",
    dir: "/img/team",
    file: "Marriane",
    founder: false,
  ),
  (
    prefix: "",
    first: "Gurleen",
    last: "Kaur",
    role: "Secretary",
    dir: "/img/team",
    file: "Gurleen",
    founder: false,
  ),
  (
    prefix: "",
    first: "Yesha",
    last: "Kaniyawala",
    role: "Website Maintenance",
    dir: "/img/team",
    file: "Yesha",
    founder: false,
  ),
  (
    prefix: "",
    first: "Len",
    last: "Estioko",
    role: "Marketing Lead",
    dir: "/img/team",
    file: "Len",
    founder: false,
  ),
  (
    prefix: "",
    first: "Lesley",
    last: "Gao",
    role: "Website Maintenance",
    dir: "/img/team",
    file: "Lesley",
    founder: false,
  ),
  (
    prefix: "",
    first: "Nikita",
    last: "Kumari",
    role: "Event Manager",
    dir: "/img/team",
    file: "Nikita",
    founder: false,
  ),
  (
    prefix: "",
    first: "Tharaneetharan",
    last: "Thavarasan",
    role: "Events Coordinator",
    dir: "/img/team",
    file: "Tharanee",
    founder: false,
  ),
  (
    prefix: "",
    first: "Nirmala",
    last: "Chinnappan",
    role: "Event Manager",
    dir: "/img/team",
    file: "Nirmala",
    founder: false,
  ),
  (
    prefix: "",
    first: "Moksha",
    last: "Shah",
    role: "Event Manager",
    dir: "/img/team",
    file: "Moksha",
    founder: false,
  ),
)

/// Full display name, honorific included.
#let team-name(m) = {
  if m.prefix == "" { m.first + " " + m.last } else { m.prefix + " " + m.first + " " + m.last }
}

/// Repo-relative portrait path. Always use this rather than assuming /img/team.
#let team-photo(m) = m.dir + "/" + m.file + ".png"

#let founder = team.filter(m => m.founder).first()
#let ambassadors = team.filter(m => not m.founder)
