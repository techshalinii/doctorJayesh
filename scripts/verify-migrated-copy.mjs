/**
 * Guards the migrated WordPress copy on `/` and `/about/`.
 *
 * Every string below is live SEO copy transcribed from the migration capture
 * (home-content.json / about-content.json, walked out of _elementor_data). The
 * brief for those two pages is that the layout is ours and the words are not, so
 * this asserts each one still reaches the rendered HTML — a redesign, a "tighten
 * this paragraph" edit or a density pass cannot drop indexed copy without failing
 * here. It also asserts the inverse: content the export marks visible:false, and
 * the theme's leftover demo text, must NOT render.
 *
 * Comparison is text-only — tags stripped, entities decoded, whitespace collapsed,
 * curly quotes and dashes folded to ASCII — so it tracks the words, not the markup.
 * Rewrap a paragraph or change a wrapper element and it still passes; reword it and
 * it fails.
 *
 *   npm run verify:copy                     # against a running `npm run dev`
 *   BASE_URL=https://preview.example.com npm run verify:copy
 *
 * Exits non-zero on any miss, so it can gate a deploy.
 */

const BASE = (process.env.BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Values the pages render from `lib/data.ts` rather than as literal text. Each must be
 * followed by punctuation or a space in the output, never straight into a word.
 */
const INTERPOLATED = [
  "Dr. Jayesh Sardhara",
  "Dr. Sardhara",
  "124",
  "1,000",
  "1,800",
  "2,800+",
];

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");

const norm = (s) =>
  s
    // numeric entities first — React emits &#x27; for apostrophes, which the
    // named-entity list below would otherwise miss.
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&rsquo;|&lsquo;|&apos;|[‘’]/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;|[“”]/g, '"')
    .replace(/&ndash;|&mdash;|[–—]/g, "-")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

// Authoritative copy, transcribed from the two content JSON files.
const HOME = {
  path: "/",
  seoTitle: "Best Neuro Surgeon In Mulund, Mumbai | Dr. Jayesh Sardhara",
  canonical: "https://drjayeshsardhara.com/",
  strings: {
    "S1 hero eyebrow": "feel the difference with us",
    "S1 hero h1": "Your Health Is",
    "S1 hero h1 b": "Our Priority",
    "S1 hero button": "Book An Appointment",

    "S2 pillar 1": "Diagnose",
    "S2 pillar 1 desc": "Examination & Diagnosis",
    "S2 pillar 2": "Treatment",
    "S2 pillar 2 desc": "Treatment of the disease",
    "S2 pillar 3": "Care Healthy",
    "S2 pillar 3 desc": "Care and recuperation",

    "S3 eyebrow": "Why Choose Us",
    "S3 heading": "Dr. Jayesh Sardhara Leading Neurosurgeon & Spine Specialist",
    "S3 para 1": "he's a dedicated healer, innovator, and mentor. As the Director of Minimally Invasive Brain and Spine Surgery at Fortis Group of Hospitals (Mulund, Kalyan & S.L. Raheja), he has helped thousands of patients regain their health and mobility.",
    "S3 para 2": "His expertise lies in endoscopic brain and spine surgery, offering safer, faster recovery options. Having performed over 1,000 brain tumor surgeries and 1,800 spine surgeries, his impact speaks for itself.",
    "S3 para 2b": "A recipient of the Best Young Neurosurgeon of India (2016, Mumbai) award,",
    "S3 para 2c": "is also a pediatric neurosurgeon, ensuring even the youngest patients receive world-class care.",
    "S3 para 3": "Beyond the operating room, he is a passionate researcher and innovator, holding one patent,",
    "S3 para 3b": "research publications, and two authored books. As the Chairman of the Young Neurosurgical Forum and the Innovation & Patent Cell at NSI, India, he is shaping the future of neurosurgery.",
    "S3 para 4": "every patient is more than just a case - it's a life to be restored, a future to be rebuilt.",

    "S4 heading": "Book Appointment",

    "S6 heading": "Common Neurological Conditions We Address",
    "S6 brain tumor body": "A brain tumour is an abnormal growth of cells within the brain. These growths can be benign (non-cancerous) or malignant (cancerous), and they often require specialized neurosurgical care for diagnosis and treatment, which may include surgery, radiation therapy, or chemotherapy.",
    "S6 spine injury body": "Spine injuries can result from accidents or trauma, causing damage to the spinal cord or surrounding structures. These injuries can lead to various degrees of paralysis and sensory loss. Timely evaluation and treatment by a neurosurgeon are essential to optimize recovery and minimize long-term disability.",
    "S6 stroke body": "A stroke is a medical emergency that occurs when there is a disruption of blood flow to the brain. It can lead to sudden neurological symptoms such as weakness, numbness, and difficulty speaking. Immediate medical attention, often involving neurosurgical intervention, is vital to mitigate brain damage and improve the chances of recovery.",
    "S6 sciatica body": "Sciatica is a condition that causes pain to radiate down the path of the sciatic nerve, usually from the lower back down one leg. It is frequently caused by nerve root compression in the spine. Neurosurgeons can diagnose and treat sciatica, offering a range of therapies to alleviate pain and improve mobility, from physical therapy to surgical decompression.",

    "S7 heading": "Why Choose Dr. Jayesh Sardhara?",
    "S7 item 1": "Unparalleled Experience",
    "S7 item 1 body": "Dr. Sardhara brings a wealth of experience and specializes in neuro and spine surgery, excelling as a Brain Tumour Specialist. His expertise extends to providing advanced surgical solutions tailored to individual needs, ensuring superior outcomes.",
    "S7 item 2": "Cutting-Edge Techniques",
    "S7 item 2 body": "As an adept Endoscopic Spine Surgeon, Dr. Sardhara employs state-of-the-art technology and minimally invasive procedures, promoting faster recovery and establishing his reputation as the best neurosurgeon in Mumbai.",
    "S7 item 3": "Compassionate Care",
    "S7 item 3 body": "Beyond his technical prowess, Dr. Sardhara is known for his patient-centric approach. His compassionate care provides comfort and unwavering support throughout each patient's treatment journey.",

    "S8 para 1": "stands at the forefront of brain and spine innovation - a neurosurgeon redefining what's possible. With unmatched precision and a relentless patient-first approach, he transforms complex, high-risk surgeries into minimally invasive, life-changing procedures - often enabling patients to walk out the very same day.",
    "S8 para 2": "A pioneer in advanced neuro-endoscopy,",
    "S8 para 2b": "leads with skill, vision, and empathy. At the Fortis Institute of Minimally Invasive Brain & Spine Surgery, his expertise turns \"keyhole\" techniques into powerful outcomes - delivering safer surgeries, faster recovery, and a new global benchmark in neurosurgical excellence.",

    "S9 heading": "Honours and Awards",
    "S11 heading (Blog)": "Blog",
    "S12 heading (FAQS)": "FAQ",
    "S13 heading (Reviews)": "Review",

    "S12 q1": "What are Neurology and Neurosurgery?",
    "S12 a1": "Neurology is the branch of medicine that deals with disorders of the nervous system, while neurosurgery is a surgical speciality focused on treating conditions that require surgical intervention in the nervous system.",
    "S12 q2": "When should I see a Neurologist or Neurosurgeon?",
    "S12 a2": "You should consider seeing both neurologists and neurosurgeons if you have symptoms related to neurological disorders such as headaches, seizures, or movement problems. Neurosurgeons can also be consulted for surgical interventions like brain or spinal cord surgery.",
    "S12 q3": "How can I make an appointment?",
    "S12 a3": "You can make an appointment by calling our scheduling department, using our online booking system, or by visiting our hospital in person. Contact information can be found on our website.",
    "S12 q4": "What should I expect during my first appointment?",
    "S12 a4": "During your initial visit, the neurologist or neurosurgeon will take a detailed medical history, perform a physical examination, and may recommend further diagnostic tests if necessary. Be prepared to discuss your symptoms and concerns.",
    "S12 q5": "What types of diagnostic tests are available?",
    "S12 a5": "We offer a wide range of diagnostic tests, including MRIs, CT scans, EEGs, and more. The specific test will depend on your condition and the recommendation of your doctor.",
    "S12 q6": "What makes Dr. Jayesh Sardhara a top neurosurgeon in Mumbai?",
    "S12 a6": "Dr. Jayesh Sardhara is a leading neurosurgeon based in Mulund, Mumbai, known for his exceptional expertise in conducting minimally invasive brain and spine surgeries. Renowned as both an endoscopic spine surgeon and a specialist in brain tumours, his dedication to precision and innovative techniques has earned him recognition as one of the best in the field.",
    "S12 q7": "How has Dr. Sardhara's research impacted the field of neurosurgery?",
    "S12 a7": "Dr. Sardhara, a leading neurosurgeon doctor and brain tumour specialist, showcases an extensive research portfolio dedicated to enhancing neurosurgical practices. His innovative techniques and published works are pivotal, in shaping future advancements in neurosurgery. As a renowned researcher and specialist, Dr. Sardhara's contributions significantly benefit patients and professionals, reshaping the field's landscape.",
  },
  // Raw-HTML checks (not text): things that must exist as markup/attributes.
  raw: {
    "hero CTA anchor #book_now": 'href="#book_now"',
    "book_now section id": 'id="book_now"',
    "S5 award image 1": "WhatsApp-Image-2026-04-09-at-4.52.03-PM-1",
    "S5 award image 2": "WhatsApp-Image-2026-04-09-at-4.52.03-PM.",
    "S5 award image 3": "WhatsApp-Image-2026-04-09-at-4.52.04-PM.",
    "S5 award image 4": "WhatsApp-Image-2026-04-09-at-4.52.04-PM-1",
    "S7 video jC20REdQTX8": "jC20REdQTX8",
    "S8 video tdKR-U_vF0Q": "tdKR-U_vF0Q",
    "S10 video Xubuvrwripg": "Xubuvrwripg",
    "S10 video LjYxBTmFd8I": "LjYxBTmFd8I",
    "S10 video ZNyNmKAzXtw": "ZNyNmKAzXtw",
    "FAQPage JSON-LD": '"@type":"FAQPage"',
  },
  forbidden: {
    "hidden PDF button (visible:false)": "choosing_a_career_path",
    "dead demo domain": "nextmark.in",
    "demo copy": "A small river named Duden",
    "dead placeholder card": "cleaning exterior glasses",
  },
};

const ABOUT = {
  path: "/about/",
  seoTitle: "About | Dr Jayesh Sardhara's Neuro Clinic",
  canonical: "https://drjayeshsardhara.com/about/",
  strings: {
    "S1 eyebrow": "About Dr. Jayesh Sardhara",
    "S1 h1": "Dr Jayesh Sardhara's Neuro Clinic",
    "S1 body a": "a highly experienced Senior Consultant in Neuro and Spine Surgery at Fortis Hospital, Mulund, boasts 15 years of expertise in minimally invasive endoscopic brain and spine surgeries.",
    "S1 body b": "credentials include an MBBS and MS in General Surgery from MPSMC, Saurashtra University, Gujarat, and an M.Ch. in Neurosurgery from SGPGIMS, Lucknow.",
    "S1 body c": "underwent comprehensive training in minimally invasive spine surgery techniques in Japan and South Korea.",
    "S1 body d": "renowned for his research in craniovertebral junction spine surgery and complex spine deformity surgery, earning him accolades like the \"Best Young Neurosurgeon India\" award in 2016.",
    "S1 body e": "research publications, editorial roles, a patent, and active involvement in medical societies, he",
    "S1 body f": "a respected leader in his field.",

    "S2 heading": "Areas of Expertise",
    "S2 item 1 title": "Brain Tumor",
    "S2 item 1 body": "Brain tumor and spine surgery is a specialized medical field focused on diagnosing and treating tumors and abnormalities within the brain and spinal cord. This discipline, led by neurosurgeons, involves a diverse array of surgical interventions, such as brain tumor removal, spinal cord injury repair, and addressing conditions like herniated discs and spinal deformities. These procedures demand precision and advanced techniques to safeguard surrounding healthy tissue while enhancing a patient's quality of life and overall health.",
    "S2 item 2 title": "Endoscopic Skull",
    "S2 item 2 body": "Endoscopic skull base surgery is a cutting-edge, minimally invasive surgical technique employed by neurosurgeons and otolaryngologists. This approach grants access to and facilitates the treatment of lesions, tumors, or abnormalities situated at the skull's base through small incisions and the utilization of endoscopes",
    "S2 item 2 body b": "specialized instruments equipped with cameras. Renowned for its numerous advantages, this innovative surgery offers shorter recovery times, diminished scarring, and a reduced risk of complications when compared to traditional open surgeries.",
    "S2 item 3 title": "Endoscopic Spine Surgery",
    "S2 item 3 body": "Endoscopic spine surgery is a cutting-edge, minimally invasive technique utilised by neurosurgeons to treat various spinal conditions. This approach involves the use of specialised instruments and an endoscope equipped with a camera, allowing for precise visualisation and treatment of spinal abnormalities through small incisions. The numerous advantages of endoscopic spine surgery include shorter recovery times, less postoperative pain, reduced scarring, and lower complication rates compared to traditional open surgeries. This innovative method facilitates a quicker return to normal activities, making it a preferred option for many spinal conditions.",
    "S2 item 4 title": "Pediatric Neurosurgery",
    "S2 item 4 body": "Pediatric neurosurgery is a specialized subspecialty within neurosurgery that is wholly committed to diagnosing and treating neurological conditions and disorders afflicting children, from infants to adolescents. In this field, highly trained pediatric neurosurgeons possess expertise in addressing a diverse spectrum of conditions, including congenital brain and spinal anomalies, brain tumors, epilepsy, and head injuries in children. Their practice is characterized by providing comprehensive care specifically tailored to meet the unique needs of young patients, ensuring their overall well-being and healthy development.",

    "S3 heading": "Honours and Awards",
    "S3 award 1": "Prof. R. K. Sharma Best MCh Resident",
    "S3 award 1b": "Gold Medal",
    "S3 award 1c": "Lucknow",
    "S3 award 2": "Traveling Fellowship",
    "S3 award 2b": "International CNS Conference",
    "S3 award 2c": "Boston, USA",
    "S3 award 3": "Best Neurosurgery Paper Award",
    "S3 award 3b": "Neurology India",
    "S3 award 4": "Best Oral Paper Presentation (2nd Prize)",
    "S3 award 4b": "World Spine 7",
    "S3 award 5": "Best Poster Presentation (2nd Prize)",
    "S3 award 6": "Next-Gen Young Neurosurgeon India",
    "S3 award 6b": "INU",
    "S3 award 7": "7th Japan-India International Conference",
    "S3 award 7b": "Osaka, Japan",

    "S4 heading": "Certificates",
  },
  raw: {
    "S4 certificate image": "DOC-20240220-WA0052_240220_202124",
    "Physician JSON-LD": "Physician",
  },
  forbidden: {
    "dead demo domain": "nextmark.in",
  },
};

async function audit(page) {
  const res = await fetch(BASE + page.path);
  const html = await res.text();
  const text = norm(strip(html));
  const rawN = norm(html);

  const fails = [];
  const passes = [];

  // metadata
  const titleTag = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "";
  (norm(titleTag) === norm(page.seoTitle) ? passes : fails).push(
    `TITLE  expected="${page.seoTitle}"  got="${norm(titleTag)}"`,
  );
  const canon = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? "";
  (canon === page.canonical ? passes : fails).push(
    `CANONICAL  expected="${page.canonical}"  got="${canon}"`,
  );

  for (const [label, s] of Object.entries(page.strings)) {
    (text.includes(norm(s)) ? passes : fails).push(`${label}  ::  "${s.slice(0, 90)}"`);
  }
  for (const [label, s] of Object.entries(page.raw)) {
    (rawN.includes(norm(s)) ? passes : fails).push(`[raw] ${label}  ::  "${s}"`);
  }

  const leaks = [];
  for (const [label, s] of Object.entries(page.forbidden)) {
    if (rawN.toLowerCase().includes(norm(s).toLowerCase())) leaks.push(`${label}  ::  "${s}"`);
  }

  // Interpolation junctions. The checks above deliberately split each expected string
  // AROUND a {value}, so a lost space between the value and the word after it passes them
  // all — "124research publications" satisfies both halves. JSX drops that space easily
  // (a `{expr} word` that wraps to the next line), so the junctions are asserted directly.
  const glued = [];
  for (const v of INTERPOLATED) {
    let i = -1;
    while ((i = text.indexOf(v, i + 1)) !== -1) {
      const after = text[i + v.length];
      if (after && /[A-Za-z]/.test(after)) {
        glued.push(`missing space after "${v}"  ::  ...${text.slice(Math.max(0, i - 40), i + v.length + 26).trim()}...`);
      }
    }
  }

  return {
    fails,
    passes,
    leaks: [...leaks, ...glued],
    total: Object.keys(page.strings).length + Object.keys(page.raw).length + 2,
  };
}

let bad = 0;

for (const page of [HOME, ABOUT]) {
  const { fails, passes, leaks, total } = await audit(page);
  bad += fails.length + leaks.length;
  console.log(
    `\n${"=".repeat(72)}\n${BASE}${page.path}   ${passes.length}/${total} present\n${"=".repeat(72)}`,
  );
  if (fails.length) {
    console.log(`\n  MISSING (${fails.length}):`);
    for (const f of fails) console.log(`    x ${f}`);
  } else {
    console.log("\n  All authoritative strings present.");
  }
  if (leaks.length) {
    console.log(`\n  MUST-NOT-RENDER leaked (${leaks.length}):`);
    for (const l of leaks) console.log(`    ! ${l}`);
  } else {
    console.log("\n  No forbidden/hidden content leaked.");
  }
}

console.log(
  bad === 0
    ? "\nMigrated copy intact on both pages.\n"
    : `\n${bad} problem(s) — migrated copy has drifted. See above.\n`,
);
process.exit(bad === 0 ? 0 : 1);
