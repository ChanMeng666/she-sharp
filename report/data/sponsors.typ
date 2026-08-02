// =============================================================================
// sponsors.typ — partners and sponsors
// =============================================================================
//
// Three layers, in the order a funder should meet them:
//
//   1. `h1-partners`  — the seven organisations that put money, a venue or a
//                       classroom behind an event between January and June 2026.
//                       Foregrounded: these are the relationships this report is
//                       accounting for.
//   2. `tiers`        — the standing gold / silver / bronze sponsor tiers,
//                       mirrored from lib/data/sponsors.ts. There is no platinum
//                       tier in use.
//   3. `logo-wall`    — the 38-logo historical wall from lib/data/sponsors.ts,
//                       `scrollingSponsorLogos`. Organisations that have backed
//                       She Sharp at some point since 2014, not necessarily in
//                       this period.
//
// `logo` is the path as it exists in the Next.js public directory. Note the file
// types are NOT uniform: most are SVG, but `MOE.png` is a PNG (and capitalised),
// and `peyvand-academy.jpg` / `little-engineers.jpg` are JPEGs. The asset agent
// needs to handle all three.
//
// `slug` is the key events.typ uses in its `partner-logos` field.
// =============================================================================

// -----------------------------------------------------------------------------
// 1. H1 2026 partners — who backed what, this half-year
//
// Derived from `detailPageData.sponsors` on the nine H1 records in
// lib/data/json/events-custom.json.
// -----------------------------------------------------------------------------

#let h1-partners = (
  (
    slug: "msd",
    name: "Ministry of Social Development",
    short-name: "MSD",
    logo: "/img/sponsors/msd.svg",
    url: "https://www.msd.govt.nz/",
    backed: "Funded HER WAKA across all four monthly cohorts, March to June, and referred the participants.",
    events: 4,
  ),
  (
    slug: "academyex",
    name: "academyEX",
    short-name: "academyEX",
    logo: "/img/sponsors/academyex.svg",
    url: "https://academyex.com/",
    backed: "Hosted International Women's Day 2026 and gave HER WAKA its Grafton home for every cohort.",
    events: 5,
  ),
  (
    slug: "metlifecare",
    name: "Metlifecare",
    short-name: "Metlifecare",
    logo: "/img/sponsors/metlifecare.svg",
    url: "https://www.metlifecare.co.nz/",
    backed: "Hosted Own Your Energy in Newmarket and put their CIO on the programme.",
    events: 1,
  ),
  (
    slug: "aut",
    name: "AUT — Engineering, Computer and Mathematical Sciences",
    short-name: "AUT ECMS",
    logo: "/img/sponsors/aut.svg",
    url: "https://www.aut.ac.nz/",
    backed: "Co-presented the LinkedIn masterclass and provided the City Campus venue.",
    events: 1,
  ),
  (
    slug: "peyvand-academy",
    name: "Peyvand Academy",
    short-name: "Peyvand Academy",
    logo: "/img/sponsors/peyvand-academy.jpg",
    url: "",
    backed: "Co-delivered both Youth Tech Series workshops and brought the rangatahi.",
    events: 2,
  ),
  (
    slug: "moe",
    name: "Ministry of Education",
    short-name: "Ministry of Education",
    logo: "/img/sponsors/MOE.png",
    url: "https://www.education.govt.nz/",
    backed: "Backed the Youth Tech Series in West Auckland alongside Peyvand Academy.",
    events: 2,
  ),
  (
    slug: "little-engineers",
    name: "Little Engineers",
    short-name: "Little Engineers",
    logo: "/img/sponsors/little-engineers.jpg",
    url: "",
    backed: "Supplied kits and facilitators for the 20 June electronics workshop.",
    events: 1,
  ),
)

// -----------------------------------------------------------------------------
// 2. Standing sponsor tiers — mirrored from lib/data/sponsors.ts `tieredSponsors`
// -----------------------------------------------------------------------------

#let tiers = (
  (
    tier: "gold",
    label: "Gold",
    sponsors: (
      (
        slug: "msd",
        name: "Ministry of Social Development",
        logo: "/img/sponsors/msd.svg",
        line: "We help New Zealanders to be safe, strong and independent",
        url: "https://www.msd.govt.nz/",
      ),
    ),
  ),
  (
    tier: "silver",
    label: "Silver",
    sponsors: (
      (
        slug: "hcltech",
        name: "HCLTech",
        logo: "/img/sponsors/hcltech.svg",
        line: "Technology that makes a difference",
        url: "https://www.hcltech.com/",
      ),
      (
        slug: "lesmills",
        name: "Les Mills",
        logo: "/img/sponsors/lesmills_logo.svg",
        line: "Inspiring the world to move",
        url: "https://www.lesmills.co.nz/",
      ),
      (
        slug: "myob",
        name: "MYOB",
        logo: "/img/sponsors/myob.svg",
        line: "Business management platform",
        url: "https://www.myob.com/nz",
      ),
      (
        slug: "aut",
        name: "AUT",
        logo: "/img/sponsors/aut.svg",
        line: "Auckland University of Technology",
        url: "https://www.aut.ac.nz/",
      ),
    ),
  ),
  (
    tier: "bronze",
    label: "Bronze",
    sponsors: (
      (
        slug: "academyex",
        name: "academyEX",
        logo: "/img/sponsors/academyex.svg",
        line: "New Zealand's only private postgraduate institute for mid-career professionals",
        url: "https://academyex.com/",
      ),
      (
        slug: "metlifecare",
        name: "Metlifecare",
        logo: "/img/sponsors/metlifecare.svg",
        line: "Metlifecare retirement villages",
        url: "https://www.metlifecare.co.nz/",
      ),
      (
        slug: "xero",
        name: "Xero",
        logo: "/img/sponsors/xero.svg",
        line: "Small business accounting to set you free",
        url: "https://www.xero.com/nz/",
      ),
      (
        slug: "aifnz",
        name: "AI Forum New Zealand",
        logo: "/img/sponsors/aifnz.svg",
        line: "New Zealand's AI community",
        url: "https://aiforum.org.nz/",
      ),
    ),
  ),
)

// -----------------------------------------------------------------------------
// 3. The historical logo wall — lib/data/sponsors.ts `scrollingSponsorLogos`.
//
// 38 organisations that have supported She Sharp at some point. This is a
// cumulative record since 2014, NOT a list of H1 2026 supporters — label it
// accordingly wherever it appears, or a reader will double-count it against the
// seven partners above.
// -----------------------------------------------------------------------------

#let logo-wall = (
  (name: "HCLTech", logo: "/img/sponsors/hcltech.svg"),
  (name: "Vector", logo: "/img/sponsors/vector.svg"),
  (name: "Xero", logo: "/img/sponsors/xero.svg"),
  (name: "Secure Code Warrior", logo: "/img/sponsors/secure-code-warrior.svg"),
  (name: "Fonterra", logo: "/img/sponsors/fonterra.svg"),
  (name: "Hewlett Packard Enterprise", logo: "/img/sponsors/hpe.svg"),
  (name: "MYOB", logo: "/img/sponsors/myob.svg"),
  (name: "Deloitte", logo: "/img/sponsors/deloitte.svg"),
  (name: "AI Forum New Zealand", logo: "/img/sponsors/aifnz.svg"),
  (name: "Fisher & Paykel Healthcare", logo: "/img/sponsors/fph.svg"),
  (name: "Fiserv", logo: "/img/sponsors/fiserv.svg"),
  (name: "Woolworths", logo: "/img/sponsors/woolworths.svg"),
  (name: "Google", logo: "/img/sponsors/google.svg"),
  (name: "Trade Me", logo: "/img/sponsors/trade-me.svg"),
  (name: "Westpac", logo: "/img/sponsors/westpac.svg"),
  (name: "Grid AKL", logo: "/img/sponsors/grid-akl.svg"),
  (name: "IBM", logo: "/img/sponsors/ibm.svg"),
  (name: "Orion Health", logo: "/img/sponsors/orion-health.svg"),
  (name: "Microsoft", logo: "/img/sponsors/microsoft.svg"),
  (name: "Flexware", logo: "/img/sponsors/flexware.svg"),
  (name: "AUT", logo: "/img/sponsors/aut.svg"),
  (name: "Pushpay", logo: "/img/sponsors/pushpay.svg"),
  (name: "Nyriad", logo: "/img/sponsors/nyriad.svg"),
  (name: "Vend", logo: "/img/sponsors/vend.svg"),
  (name: "Air New Zealand", logo: "/img/sponsors/air-new-zealand.svg"),
  (name: "Centrality", logo: "/img/sponsors/centrality.svg"),
  (name: "AWS", logo: "/img/sponsors/aws.svg"),
  (name: "Wāhine Kākano", logo: "/img/sponsors/wahine-kakano.svg"),
  (name: "Workday", logo: "/img/sponsors/workday.svg"),
  (name: "Fergus", logo: "/img/sponsors/fergus.svg"),
  (name: "EY", logo: "/img/sponsors/ey.svg"),
  (name: "Geo AR Games", logo: "/img/sponsors/geo-ar-games.svg"),
  (name: "Kiwibank", logo: "/img/sponsors/kiwibank.svg"),
  (name: "Countdown", logo: "/img/sponsors/countdown.svg"),
  (name: "ANZ", logo: "/img/sponsors/anz.svg"),
  (name: "academyEX", logo: "/img/sponsors/academyex.svg"),
  (name: "Metlifecare", logo: "/img/sponsors/metlifecare.svg"),
  (name: "Auckland Council", logo: "/img/sponsors/auckland-council.svg"),
)

// -----------------------------------------------------------------------------
// Lookup used by events.typ `partner-logos`.
// -----------------------------------------------------------------------------

#let partner-by-slug(slug) = {
  let found = h1-partners.filter(s => s.slug == slug)
  if found.len() == 0 {
    panic("sponsors.typ: no H1 partner with slug " + slug)
  }
  found.first()
}
