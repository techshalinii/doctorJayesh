/**
 * Central content model for the practice.
 * All copy references Dr. Jayesh Sardhara's real profile; layout & design are original.
 */

/**
 * Confirmed by the client 2026-09-03: 124.
 *
 * The live site contradicted itself — /about/ said 132, the homepage said 124 — so this was
 * held as a visible placeholder until confirmed. The migrated /about/ body copy has been
 * corrected from 132 to 124 to match.
 */
export const PUBLICATIONS = 124;

/**
 * Confirmed 2026-09-03. The live homepage's "over 1,000 brain tumour surgeries and 1,800
 * spine surgeries" sums to this figure, so the two sources agreed after all.
 */
export const SURGERIES_TOTAL = "2,800+";

export const doctor = {
  name: "Dr. Jayesh Sardhara",
  shortName: "Dr. Sardhara",
  credentials: "MBBS, MS, MCh (Neurosurgery)",
  title: "Neurosurgeon & Spine Surgeon",
  role: "Director — Minimally Invasive Brain & Spine Surgery",
  tagline: "Advanced Brain & Spine Care with Precision & Compassion",
  intro:
    "A globally trained neurosurgeon specialising in endoscopic, minimally invasive brain and spine surgery — combining world-class surgical precision with genuinely personal care.",
  experienceYears: 15,
  brainSurgeries: 1000,
  spineSurgeries: 1800,
  publications: PUBLICATIONS,
  patents: 1,
  books: 2,
  rating: 5.0,
  reviews: 99,
  phone: "+91 98928 05422",
  phoneRaw: "+919892805422",
  whatsapp: "919892805422",
  email: "jayeshsardhara83@gmail.com",
  opd: "Mon – Sat · 11:00 AM – 4:00 PM",
};

export const locations = [
  {
    name: "Fortis Hospital, Mulund",
    address: "Mulund Goregaon Link Road, Mulund West, Mumbai 400078",
    kind: "Primary Surgical Centre",
  },
  {
    name: "O & S Business Suite",
    address: "Ghatkopar West, Mumbai",
    kind: "Consultation Clinic",
  },
];

export const affiliations = [
  "Fortis Hospital, Mulund",
  "Fortis Hospital, Kalyan",
  "S. L. Raheja Hospital",
  "Neurological Society of India",
];

export const trustStats = [
  { value: "15+", label: "Years of Experience" },
  { value: "1000+", label: "Brain Surgeries" },
  { value: "1800+", label: "Spine Surgeries" },
  { value: "5.0★", label: "Patient Rating" },
];

// `recognitions` removed 2026-09-04 with the homepage TrustStrip section: its six labels
// were a subset of the ten in `awards`, which /news-awards/ and the homepage both render.

export type Expertise = {
  slug: string;
  title: string;
  icon: string; // lucide icon name
  short: string;
  /** Full description migrated from the live /about/ page. Not present on every entry. */
  long?: string;
  /**
   * The heading the live /about/ page used above `long`, where it differs from `title`.
   *
   * `title` names the card in our own navigation (homepage Expertise grid), and three of
   * these four were renamed there to match the treatment pages they link to. That rename
   * must not reach /about/: the WordPress headings are indexed SEO copy, so the section
   * that renders the migrated `long` copy renders the migrated heading with it.
   */
  longTitle?: string;
  href: string;
};

export const expertise: Expertise[] = [
  {
    slug: "brain-tumor-surgery",
    title: "Brain Tumor Surgery",
    longTitle: "Brain Tumor & Spine Surgery",
    icon: "Brain",
    short:
      "Precise removal of benign and malignant brain tumors using neuro-navigation and intra-operative monitoring.",
    href: "/brain-surgery",
    long:
      "Brain tumor and spine surgery is a specialized medical field focused on diagnosing and treating tumors and abnormalities within the brain and spinal cord. This discipline, led by neurosurgeons, involves a diverse array of surgical interventions, such as brain tumor removal, spinal cord injury repair, and addressing conditions like herniated discs and spinal deformities. These procedures demand precision and advanced techniques to safeguard surrounding healthy tissue while enhancing a patient's quality of life and overall health.",
  },
  {
    slug: "spine-surgery",
    title: "Spine Surgery",
    icon: "Bone",
    short:
      "Comprehensive care for the cervical, thoracic and lumbar spine — from decompression to complex reconstruction.",
    href: "/spine-surgery",
  },
  {
    slug: "endoscopic-skull-base",
    title: "Endoscopic Skull Base Surgery",
    longTitle: "Endoscopic Skull Surgery",
    icon: "ScanEye",
    short:
      "Keyhole endoscopic approaches to pituitary and skull-base tumors with no external incisions.",
    href: "/brain-surgery",
    long:
      "Endoscopic skull base surgery is a cutting-edge, minimally invasive surgical technique employed by neurosurgeons and otolaryngologists. This approach grants access to and facilitates the treatment of lesions, tumors, or abnormalities situated at the skull's base through small incisions and the utilization of endoscopes — specialized instruments equipped with cameras. Renowned for its numerous advantages, this innovative surgery offers shorter recovery times, diminished scarring, and a reduced risk of complications when compared to traditional open surgeries.",
  },
  {
    slug: "pediatric-neurosurgery",
    title: "Pediatric Neurosurgery",
    icon: "Baby",
    short:
      "Gentle, specialised neurosurgical care for children — hydrocephalus, congenital and tumor conditions.",
    href: "/brain-surgery",
    long:
      "Pediatric neurosurgery is a specialized subspecialty within neurosurgery that is wholly committed to diagnosing and treating neurological conditions and disorders afflicting children, from infants to adolescents. In this field, highly trained pediatric neurosurgeons possess expertise in addressing a diverse spectrum of conditions, including congenital brain and spinal anomalies, brain tumors, epilepsy, and head injuries in children. Their practice is characterized by providing comprehensive care specifically tailored to meet the unique needs of young patients, ensuring their overall well-being and healthy development.",
  },
  {
    slug: "minimally-invasive-spine",
    title: "Minimally Invasive Spine Surgery",
    longTitle: "Endoscopic Spine Surgery",
    icon: "Activity",
    short:
      "Muscle-sparing, small-incision techniques that mean less pain, smaller scars and faster recovery.",
    href: "/spine-surgery",
    long:
      "Endoscopic spine surgery is a cutting-edge, minimally invasive technique utilised by neurosurgeons to treat various spinal conditions. This approach involves the use of specialised instruments and an endoscope equipped with a camera, allowing for precise visualisation and treatment of spinal abnormalities through small incisions. The numerous advantages of endoscopic spine surgery include shorter recovery times, less postoperative pain, reduced scarring, and lower complication rates compared to traditional open surgeries. This innovative method facilitates a quicker return to normal activities, making it a preferred option for many spinal conditions.",
  },
  {
    slug: "neurovascular-surgery",
    title: "Neurovascular Surgery",
    icon: "HeartPulse",
    short:
      "Treatment of aneurysms, AVMs and stroke through advanced micro- and endovascular techniques.",
    href: "/brain-surgery",
  },
];

export const whyChoose = [
  {
    icon: "Cpu",
    title: "Advanced Technology",
    desc: "Neuro-navigation, intra-operative imaging and endoscopy for pinpoint accuracy.",
  },
  {
    icon: "UserRound",
    title: "Personalised Treatment",
    desc: "Every plan is built around your diagnosis, lifestyle and recovery goals.",
  },
  {
    icon: "Scissors",
    title: "Minimally Invasive",
    desc: "Keyhole and muscle-sparing approaches that protect healthy tissue.",
  },
  {
    icon: "Gauge",
    title: "Faster Recovery",
    desc: "Smaller incisions and modern protocols get you back to life sooner.",
  },
  {
    icon: "Globe2",
    title: "International Standards",
    desc: "Global fellowship training applied to every case, every day.",
  },
  {
    icon: "Stethoscope",
    title: "Expert Surgical Care",
    desc: `${SURGERIES_TOTAL} brain & spine procedures performed with meticulous care.`,
  },
];

export const conditions = {
  brain: {
    title: "Brain Conditions",
    icon: "Brain",
    items: [
      // `long` copy migrated from the live homepage — see _migration/PAGE-REBUILD.md §1, harvest 2.
      { name: "Brain Tumors", desc: "Gliomas, meningiomas, pituitary & metastatic tumors.",
        long: "A brain tumour is an abnormal growth of cells within the brain. These growths can be benign (non-cancerous) or malignant (cancerous), and they often require specialized neurosurgical care for diagnosis and treatment, which may include surgery, radiation therapy, or chemotherapy." },
      { name: "Stroke", desc: "Ischaemic and haemorrhagic stroke intervention.",
        long: "A stroke is a medical emergency that occurs when there is a disruption of blood flow to the brain. It can lead to sudden neurological symptoms such as weakness, numbness, and difficulty speaking. Immediate medical attention, often involving neurosurgical intervention, is vital to mitigate brain damage and improve the chances of recovery." },
      { name: "Epilepsy", desc: "Surgical evaluation for drug-resistant seizures." },
      { name: "Aneurysms", desc: "Clipping and endovascular treatment of aneurysms." },
      { name: "Parkinson's Disease", desc: "Deep brain stimulation for movement disorders." },
    ],
  },
  spine: {
    title: "Spine Conditions",
    icon: "Bone",
    items: [
      { name: "Herniated Disc", desc: "Lumbar & cervical disc herniation relief." },
      { name: "Sciatica", desc: "Targeted treatment of radiating nerve pain.",
        long: "Sciatica is a condition that causes pain to radiate down the path of the sciatic nerve, usually from the lower back down one leg. It is frequently caused by nerve root compression in the spine. Neurosurgeons can diagnose and treat sciatica, offering a range of therapies to alleviate pain and improve mobility, from physical therapy to surgical decompression." },
      { name: "Spinal Stenosis", desc: "Decompression for narrowed spinal canals." },
      { name: "Scoliosis", desc: "Correction of spinal curvature and deformity." },
      { name: "Degenerative Disc Disease", desc: "Motion-preserving and fusion options." },
      // Migrated from the live homepage — this condition had no template entry.
      { name: "Spine Injury", desc: "Trauma to the spinal cord and surrounding structures.",
        long: "Spine injuries can result from accidents or trauma, causing damage to the spinal cord or surrounding structures. These injuries can lead to various degrees of paralysis and sensory loss. Timely evaluation and treatment by a neurosurgeon are essential to optimize recovery and minimize long-term disability." },
    ],
  },
};

// `Procedure` / `procedures` removed 2026-09-04 with the homepage Procedures section:
// it duplicated Expertise and pointed at the same two treatment pages. See lib/treatments.ts,
// which carries the per-page procedure lists that /brain-surgery/ and /spine-surgery/ render.

// The template shipped a `testimonials` array here: four invented patients ("Rajesh M.",
// "Priya K.", "Anil S.", "Meera D.") with invented procedures and invented recovery
// statistics ("Discharged in 4 days", "Tremor reduced ~70%"). Deleted 2026-09-04. It was
// never rendered, but fabricated patient outcomes have no business sitting in a
// neurosurgeon's repo one careless import away from production. Real patient quotes come
// from `googleReviews` below, traced to the practice's live Google widget.

// Real Google reviews imported from the practice's live widget.
export type GoogleReview = { name: string; date: string; rating: number; text: string };

export const googleReviews: GoogleReview[] = [
  {
    name: "Abhishek Pednekar",
    date: "Oct 2023",
    rating: 5,
    text: "Great experience. Dr. Jayesh Sardhara combines both expertise and a willingness to listen and discuss. He is an excellent surgeon. The staff were very friendly and professional in the general ward, operation theatre and OPD. I had a backbone dislocation and the pain was high; after surgery by laser technique I am back to normal — I can lift weight and do all other sports activity. I was worried about surgery but had 0% pain. Any back problem, small to extremely critical, blindly opt for Dr. Jayesh Sardhara. Thank you doctor for saving my life. 🙏",
  },
  {
    name: "Mehul Gala",
    date: "Oct 2023",
    rating: 5,
    text: "Dr. Jayesh Sardhara is an amazing doctor. He knows his subject so thoroughly and is very refined in his work. His specialty besides his subject is that he makes the patient and their family so comfortable and tension free by explaining everything in detail. Best part is that he is very easily approachable. More than a very good neurosurgeon, he is a very humble, smiling gentleman. God bless him.",
  },
  {
    name: "Simran Sassi",
    date: "Jul 2023",
    rating: 5,
    text: "Dr. Sardhara treated our daughter with the utmost level of empathy and skill and ensured that he calmed our nerves during our most anxious times. He was always approachable and gave us the best advice and treatment. We are very fortunate that we met him in our most trying times. We wholeheartedly thank Dr. Sardhara for all the support.",
  },
  {
    name: "Vijay Barkale",
    date: "Oct 2023",
    rating: 5,
    text: "Dr Jayesh Sardhara not only did my spine endoscopy greatly but also guided me throughout. I had a great experience with him and his team — they helped me each and every moment. Thank you so much.",
  },
  {
    name: "Nitin Nerkar",
    date: "Jun 2023",
    rating: 5,
    text: "Wonderful experience with Fortis Hospital, and Dr. Jayesh Sardhara (Neuro & Spine Surgeon) was a wonderful surgeon. The staff was always helpful and kind. They ensured I had a smooth prep, surgery and follow-up. I am so glad I chose Fortis Hospital and would highly recommend it to anyone.",
  },
  {
    name: "Sarita Gaikwad",
    date: "Oct 2023",
    rating: 5,
    text: "Thank you so much for the difference you make in your patients! Your kindness, sincere caring and concern make everything better, and you are a great encouragement. 🙂",
  },
  {
    name: "Kumar Raut",
    date: "Oct 2023",
    rating: 5,
    text: "Dr. Jayesh Sardhara sir is very cooperative, kind and careful towards patients. May God bless him. 🙏",
  },
  {
    name: "Arti Gaikwad",
    date: "Oct 2023",
    rating: 5,
    text: "One of the best doctors I have ever seen.",
  },
  {
    name: "Vidya Barkale",
    date: "Oct 2023",
    rating: 5,
    text: "Great experience — highly recommended.",
  },
];

export const awards = [
  { year: "2016", title: "Best Young Neurosurgeon of India", org: "Mumbai", type: "National Award" },
  { year: "2016", title: "Next-Gen Young Neurosurgeon India", org: "INU", type: "International Recognition" },
  { year: "2015", title: "Best Neurosurgery Paper Award", org: "Neurology India", type: "Research Award" },
  { year: "2014", title: "Prof. R. K. Sharma Best MCh Resident — Gold Medal", org: "Lucknow", type: "Gold Medal" },
  { year: "Present", title: "Chairman, Young Neurosurgical Forum", org: "NSI, India", type: "Leadership" },
  { year: "Present", title: "Chairman, Innovation & Patent Cell", org: "NSI, India", type: "Leadership" },
  // Migrated from the live /about/ and homepage — absent from the original template list.
  { year: "2016", title: "Best Oral Paper Presentation (2nd Prize)", org: "World Spine 7, New Delhi", type: "Research Award" },
  { year: "2016", title: "Best Poster Presentation (2nd Prize)", org: "World Spine 7, New Delhi", type: "Research Award" },
  { year: "2016", title: "Traveling Fellowship — 7th Japan-India International Conference", org: "Osaka, Japan", type: "Fellowship" },
  { year: "—", title: "Traveling Fellowship — International CNS Conference & Workshop", org: "Neurological Society of India · Boston, USA", type: "Fellowship" },
];

export type Post = {
  slug: string;
  title: string;
  category: "Brain" | "Spine" | "Recovery" | "Technology";
  excerpt: string;
  readingTime: string;
  date: string;
  image: string;
  featured?: boolean;
};

// Real articles & featured images sourced from the practice's blog.
// ⚠️ PARKED — every entry below is excluded from routing, the sitemap and the blog
// listing. These are hand-written rewrites of migrated WordPress posts that live at
// different URLs; see the note at the top of lib/blog-content.ts and
// _migration/EXTRACTION-REPORT.md §5c. The publishable post list comes from
// content/*.mdx via lib/content.ts, not from here.
export const posts: Post[] = [
  {
    slug: "deep-brain-stimulation-parkinsons",
    title: "Deep Brain Stimulation for Advanced Parkinson's: The Window for Intervention",
    category: "Technology",
    excerpt:
      "Deep brain stimulation can dramatically reduce tremor and restore control in advanced Parkinson's — but timing the intervention right is everything.",
    readingTime: "6 min read",
    date: "2026-06-26",
    image: "/images/blog/deep-brain-stimulation-parkinsons.png",
    featured: true,
  },
  {
    slug: "endoscopic-lumbar-discectomy",
    title: "The Rise of Endoscopic Lumbar Discectomy",
    category: "Spine",
    excerpt:
      "Open discectomy is no longer the only option — here's how endoscopic lumbar discectomy removes disc herniations through a keyhole incision.",
    readingTime: "5 min read",
    date: "2026-06-10",
    image: "/images/blog/endoscopic-lumbar-discectomy.png",
  },
  {
    slug: "intraoperative-navigation-spinal-fusion",
    title: "How Real-Time Intraoperative Navigation Enhances Spinal Fusion Safety",
    category: "Technology",
    excerpt:
      "Real-time navigation lets surgeons place spinal implants with sub-millimetre accuracy — making fusion surgery safer and more precise than ever.",
    readingTime: "7 min read",
    date: "2026-05-25",
    image: "/images/blog/intraoperative-navigation-spinal-fusion.png",
  },
  {
    slug: "clinical-decision-making-neurosurgery",
    title: "Clinical Decision-Making: Why the Right Diagnosis Matters Most",
    category: "Brain",
    excerpt:
      "In neurosurgery, the right diagnosis matters more than the operation itself. A look at how careful clinical judgement shapes outcomes.",
    readingTime: "8 min read",
    date: "2026-05-13",
    image: "/images/blog/clinical-decision-making-neurosurgery.jpg",
  },
  {
    slug: "advances-in-spine-surgery",
    title: "Advances in Spine Surgery: Safer, Faster Treatment",
    category: "Spine",
    excerpt:
      "From endoscopy to navigation and robotics, modern spine surgery is making treatment safer, less painful and far faster to recover from.",
    readingTime: "5 min read",
    date: "2026-05-04",
    image: "/images/blog/advances-in-spine-surgery.png",
  },
  {
    slug: "future-of-neurosurgery",
    title: "The Future of Neurosurgery: Innovation in Brain & Spine Care",
    category: "Technology",
    excerpt:
      "Innovation is reshaping brain and spine care — from robotic assistance to intra-operative imaging. A surgeon's view of what's next.",
    readingTime: "7 min read",
    date: "2026-04-15",
    image: "/images/blog/future-of-neurosurgery.jpg",
  },
  {
    slug: "minimally-invasive-neurosurgery",
    title: "Why Minimally Invasive Neurosurgery is Transforming Care",
    category: "Brain",
    excerpt:
      "Minimally invasive neurosurgery is redefining brain and spine treatment — smaller incisions, less risk, and a faster return to everyday life.",
    readingTime: "8 min read",
    date: "2026-04-02",
    image: "/images/blog/minimally-invasive-neurosurgery.png",
  },
  {
    slug: "minimally-invasive-brain-spine-surgery",
    title: "What Patients Should Know About Minimally Invasive Surgery",
    category: "Recovery",
    excerpt:
      "What every patient should know about minimally invasive brain and spine surgery — how it works, who it suits, and what recovery really looks like.",
    readingTime: "5 min read",
    date: "2026-03-30",
    image: "/images/blog/minimally-invasive-brain-spine-surgery.png",
  },
];

export const nav = [
  { label: "Home", href: "/" },
  {
    // Fellowship moved in here 2026-09-04. Adding "Testimonials" as a 9th top-level item
    // pushed the header bar to ~1097px of content, which overflowed its container between
    // 1024px (where the desktop nav switches on) and ~1104px. Folding Fellowship under
    // About removes one item and clears the overlap. Matches the Treatments pattern: the
    // parent's own href is repeated as the first child so /about/ stays one click away.
    label: "About",
    href: "/about/",
    children: [
      { label: "About the Surgeon", href: "/about/" },
      { label: "Fellowship", href: "/fellowship/" },
    ],
  },
  {
    label: "Treatments",
    href: "/brain-surgery/",
    children: [
      { label: "Brain Surgery", href: "/brain-surgery/" },
      { label: "Spine Surgery", href: "/spine-surgery/" },
      // Added 2026-09-04: /conditions/ went live, so it needs a way in.
      { label: "Conditions Treated", href: "/conditions/" },
      { label: "Surgeries", href: "/surgeries/" },
      { label: "Brain Tumour", href: "/brain-tumor/" },
    ],
  },
  // Added 2026-09-04 alongside /conditions/.
  { label: "Testimonials", href: "/testimonials/" },
  { label: "News & Awards", href: "/news-awards/" },
  { label: "Blog", href: "/blog/" },
  { label: "Contact", href: "/contact-us/" },
];


/**
 * Press coverage migrated from the live /news-awards/ page â see _migration/PAGE-REBUILD.md Â§6.
 * `image` is the clipping/logo as it appeared on the old site; `href` is the external article.
 */
export type PressItem = { outlet: string; href: string; image: string };

export const pressCoverage: PressItem[] = [
  { outlet: "MedGate Today", href: "https://medgatetoday.com/mumbai-hosted-ynfcon-2026-supported-by-fortis-hospital/", image: "/wp-content/uploads/elementor/thumbs/43b2dd32-a690-4f96-a65a-67d4cd691976-rppt5zbfnlxt1p8g9zzuz08gn8rgltrfflrylmhl14.jpeg" },
  { outlet: "Dainik Bhaskar (Magzter)", href: "https://www.magzter.com/stories/newspaper/Dainik-Bhaskar-Mumbai/1776653530414", image: "/wp-content/uploads/elementor/thumbs/WhatsApp-Image-2026-06-17-at-1.24.27-PM-rp37e6is0s88zbp8udlzbeuoqixjgaf6htvu6uptag.jpeg" },
  { outlet: "Dainik Bhaskar (Magzter)", href: "https://www.magzter.com/stories/newspaper/Dainik-Bhaskar-Mumbai/1776653530414", image: "/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-20-at-3.35.28-PM-915x800.jpeg" },
  { outlet: "PTI News", href: "https://www.ptinews.com/press-release/fortis-institute-of-minimally-invasive-brain-spine-surgery", image: "/wp-content/uploads/2026/03/2-1.png" },
  { outlet: "Jaipur Times", href: "https://en.jaipurtimes.org/newsvoir?c_article_id=35052&c_author_id=20400", image: "/wp-content/uploads/2026/03/5.png" },
  { outlet: "ANI News", href: "https://www.aninews.in/news/business/fortis-institute-of-minimally-invasive-brain-spine-surgery", image: "/wp-content/uploads/2026/03/4-1.png" },
  { outlet: "The Wire", href: "https://thewire.in/ptiprnews/fortis-institute-of-minimally-invasive-brain-spine-surgery", image: "/wp-content/uploads/2026/03/3-1.png" },
  { outlet: "The Wire", href: "https://thewire.in/ptiprnews/fortis-institute-of-minimally-invasive-brain-spine-surgery", image: "/wp-content/uploads/2026/03/6.png" },
  { outlet: "The Week", href: "https://www.theweek.in/wire-updates/business/2026/03/23/fortis-institute-of-minimally-invasive-brain-spine-surgery.html", image: "/wp-content/uploads/2026/03/hjvtuvjn.png" },
  { outlet: "Lokmat ePaper", href: "https://epaper.lokmat.com/sub-editions/Hello%20Kalyan%20Dombivali/2024-06-30/4", image: "/wp-content/uploads/elementor/thumbs/download-36-qxgyrmb3m4nv3h6tgfs3w724ufkyz025zwqq26s6g8.png" },
  { outlet: "TheHealthSite", href: "https://www.thehealthsite.com/parenting/raising-smart-kids-how-exercise-and-brain-health-connect", image: "/wp-content/uploads/elementor/thumbs/news3-qxgyrmb3m4nv3h6tgfs3w724ufkyz025zwqq26s6g8.png" },
  { outlet: "Medical Dialogues", href: "https://health.medicaldialogues.in/health/advanced-3d-skull-base-anatomy-workshop", image: "/wp-content/uploads/2025/11/310340-dissertation-43.webp" },
  { outlet: "Times of India", href: "https://timesofindia.indiatimes.com/city/mumbai/falling-from-overcrowded-delayed-trains", image: "/wp-content/uploads/2024/12/jyesh.jpg" },
  { outlet: "Dainik Bhaskar", href: "https://www.bhaskar.com/web-stories/health/neck-pain-in-youngsters/", image: "/wp-content/uploads/elementor/thumbs/survical-rdkva21s202pigq5z3egb5s0iqxeiatbo402e4gef0.png" },
  { outlet: "Pharmabiz", href: "https://www.pharmabiz.com/NewsDetails.aspx?aid=182620&sid=2", image: "/wp-content/uploads/2025/11/310340-dissertation-43.webp" },
];

/** Long-form news items migrated from the live /news-awards/ page. */
export type NewsItem = { title: string; image?: string; paragraphs: string[] };

export const newsItems: NewsItem[] = [
  {
    title: "Times of India Leadership Award, 2025",
    image: "/wp-content/uploads/2025/11/WhatsApp-Image-2025-11-25-at-12.01.10_99caa061.jpg",
    paragraphs: [
      "Dr Jayesh Sardhara, Director, Minimally Invasive Brain & Spine Surgery, Fortis Mumbai, won the Times of India Leadership Award, 2025.",
    ],
  },
  {
    title: "Launch of “Humraahi” Neuro Support Group",
    image: "/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-25-at-10.21.48_f968331d.jpg",
    paragraphs: [
      "Glad to share the launch moments of Neuro Support Group “Humraahi”, a heartfelt initiative to empower neuro patients and their caregivers by our SL Raheja Hospital, Fortis associate — Neuroscience team.",
      "Graced by Chief Guest Arbaaz Khan, the event featured inspiring talks, art and music therapy, and an engaging stand-up act by Dr. Aditya Daftary.",
      "Humraahi echoes companionship and courage in the healing journey — creating a safe space where patients find strength, families find guidance, and everyone finds hope.",
      "The overwhelming response from patients, families, and consultants underscores the need for a support group like Humraahi. Our core team, comprising Dr. Kaustubh Mahajan, Dr. Sreelakshmi, myself and Dr. Kedar Tilwe, will drive the initiative, meeting bi-monthly and looking forward to bringing positive change to more lives.",
    ],
  },
  {
    title: "New Gastro-science & Onco-science Wing, Fortis Mulund",
    image: "/wp-content/uploads/2025/10/WhatsApp-Image-2025-10-25-at-10.21.49_d6940c35.jpg",
    paragraphs: [
      "Congratulations and best wishes to our state-of-the-art Fortis Gastro-science and Onco-science department at Fortis Hospital, Mulund, as it begins a new journey. The new wing was inaugurated by chief guest Mahima Chaudhry. Congratulations to Narayani Ma’am, Dr Vishal Beri, Dr Supriya, Rinku Mavani Ma’am, Dr Vipul Rai Rathod (Director — Gastro-science) and Dr Boman Dhabar (Director — Onco-science) for the wonderful success of the event.",
    ],
  },
];


/**
 * The Google Maps embed from the live WordPress homepage, preserved exactly.
 *
 * Copied verbatim from _migration/05-crawl/pages/home.json (the z=16 embed; a second,
 * z=15 copy also existed on that page). Only the HTML entity `&#038;` has been decoded
 * back to `&`. Do not regenerate this URL — it encodes the exact place query WordPress
 * used, and a hand-built replacement will not resolve to the same pin.
 */
export const mapEmbed = {
  src:
    "https://maps.google.com/maps?q=Department%20of%20Neurosurgery%20Fortis%20Hospital%2C%20Mulund%20%20Goregaun-%20Mulund%20link%20road%20%20Mulund%20-%20west%20%28%20400078%29%20&t=m&z=16&output=embed&iwloc=near",
  title:
    "Department of Neurosurgery Fortis Hospital, Mulund  Goregaun- Mulund link road  Mulund - west ( 400078) ",
};


/**
 * Videos migrated from the live site's Elementor `video` widgets.
 *
 * Sources come from `_elementor_data` (see _migration/PAGE-REBUILD.md appendix). The live
 * pages held 20 widgets for 13 distinct videos — `Xubuvrwripg` alone appeared five times —
 * so this list is de-duplicated per page.
 *
 * NOT included: `vimeo.com/235215203`, which appeared twice on the live homepage. Its widget
 * was misconfigured (`video_type: "youtube"` with a Vimeo URL) and the video's own title is
 * literally "Vimeo Placeholder" — Elementor demo material, like the pricing tables and Lorem
 * ipsum. It falls under the standing decision that no demo content ships.
 *
 * VISIBILITY: five further home videos exist in the Elementor tree with hide_desktop +
 * hide_tablet + hide_mobile all set, so they do NOT render on the live site and are not
 * listed here (zJ0qKUjbZUo, DbZKg_xBbsc, 2HtWcIghepY, hEFnDTyc1g0, r5rzuL5xZQc). Verified
 * directly against _elementor_data, not inferred. r5rzuL5xZQc IS visible on /brain-surgery/
 * and is kept there.
 *
 * All 9 below were confirmed reachable on 2026-09-03 via the YouTube oEmbed API.
 */
export type VideoItem = {
  id: string;
  platform: "youtube" | "youtube-shorts" | "vimeo";
  title: string;
};

export const videos: Record<string, VideoItem[]> = {
  /**
   * Section 10, the standalone video gallery — three items.
   *
   * The homepage carries five videos in total, and the export attaches them to three
   * different sections: one inside "Why Choose Dr. Jayesh Sardhara?" (section 7), one
   * inside the Fortis Institute block (section 8), and these three in the gallery. The
   * two inline ones are `homeInlineVideos` below; all five still render, each where the
   * live page had it.
   */
  home: [
    { id: "Xubuvrwripg", platform: "youtube", title: "Surgical technique of full endoscopic uniportal interlaminar discectomy" },
    { id: "LjYxBTmFd8I", platform: "youtube", title: "What is the main cause of brain cancer? Symptoms, types and treatment" },
    { id: "ZNyNmKAzXtw", platform: "youtube", title: "Spine surgery is really safe now" },
  ],
  "news-awards": [
    { id: "ODg6P80scuY", platform: "youtube", title: "Saif Ali Khan attacked — spinal fluid leak surgery explained" },
    { id: "GrYAx9S4oVo", platform: "youtube-shorts", title: "Dr. Jayesh Sardhara shares expert medical insight" },
  ],
  "brain-surgery": [
    { id: "r5rzuL5xZQc", platform: "youtube", title: "Amygdalohippocampectomy — anteromesial temporal lobectomy technique" },
  ],
  "spine-surgery": [
    { id: "Xubuvrwripg", platform: "youtube", title: "Surgical technique of full endoscopic uniportal interlaminar discectomy" },
  ],
  "brain-tumor": [
    { id: "Xubuvrwripg", platform: "youtube", title: "Surgical technique of full endoscopic uniportal interlaminar discectomy" },
  ],
};


/* ── Content migrated from the live WordPress homepage ────────────────────────
 * Verbatim from home-content.json / _elementor_data. Wording is live SEO copy —
 * do not rewrite. Sections flagged visible:false in the export are NOT here.
 */

/**
 * Section 2 — the three icon boxes under the hero.
 *
 * Titles and descriptions are verbatim. `icon` is ours: the export stored Elementor icon
 * class names, not assets, so there was nothing to migrate — these are the nearest
 * equivalents from the set components/ui/icon.tsx already maps.
 */
export const threePillars = [
  { title: "Diagnose", description: "Examination & Diagnosis", icon: "ScanEye" },
  { title: "Treatment", description: "Treatment of the disease", icon: "Stethoscope" },
  { title: "Care Healthy", description: "Care and recuperation", icon: "HeartPulse" },
];

/**
 * The two homepage videos the export attaches to a section rather than to the gallery —
 * sections 7 and 8. Rendered beside that section's copy, as on the live page.
 */
export const homeInlineVideos: Record<"whyChoose" | "fortis", VideoItem> = {
  whyChoose: {
    id: "jC20REdQTX8",
    platform: "youtube",
    title: "Witness The Remarkable Journey of Dr. Jayesh Sardhara",
  },
  fortis: {
    id: "tdKR-U_vF0Q",
    platform: "youtube",
    title: "Redefining Neurosurgery: Minimally Invasive Brain and Spine Surgery",
  },
};

/**
 * The introduction video on /about/, above the certificates section.
 *
 * Same YouTube ID as `homeInlineVideos.whyChoose`, declared separately rather than
 * imported from it: the two are independent placements, and pointing /about/ at the
 * homepage's entry would mean swapping the homepage video silently swapped this one too.
 */
export const aboutVideo: VideoItem = {
  id: "jC20REdQTX8",
  platform: "youtube",
  title: "Witness The Remarkable Journey of Dr. Jayesh Sardhara",
};

/** Section 7 — "Why Choose Dr. Jayesh Sardhara?" */
export const whyChooseSardhara = [
  {
    label: "Unparalleled Experience",
    body: "Dr. Sardhara brings a wealth of experience and specializes in neuro and spine surgery, excelling as a Brain Tumour Specialist. His expertise extends to providing advanced surgical solutions tailored to individual needs, ensuring superior outcomes.",
  },
  {
    label: "Cutting-Edge Techniques",
    body: "As an adept Endoscopic Spine Surgeon, Dr. Sardhara employs state-of-the-art technology and minimally invasive procedures, promoting faster recovery and establishing his reputation as the best neurosurgeon in Mumbai.",
  },
  {
    label: "Compassionate Care",
    body: "Beyond his technical prowess, Dr. Sardhara is known for his patient-centric approach. His compassionate care provides comfort and unwavering support throughout each patient's treatment journey.",
  },
];

/** Section 5 — award photo gallery. `alt` was empty on WordPress; these are the altSuggested values. */
export const awardsGallery = [
  { src: "/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-09-at-4.52.03-PM-1.jpeg", alt: "Dr. Jayesh Sardhara receiving a professional award" },
  { src: "/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-09-at-4.52.03-PM.jpeg", alt: "Dr. Jayesh Sardhara at a neurosurgery conference" },
  { src: "/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-09-at-4.52.04-PM.jpeg", alt: "Dr. Jayesh Sardhara with an award citation" },
  { src: "/wp-content/uploads/2026/04/WhatsApp-Image-2026-04-09-at-4.52.04-PM-1.jpeg", alt: "Dr. Jayesh Sardhara honoured at a medical event" },
];

/**
 * Section 12 — the homepage FAQ accordion.
 *
 * These 7 Q&As are already published as FAQPage JSON-LD in the page's stored schema
 * (content/index.md). Rendering them visibly is required: Google's structured-data policy
 * only allows FAQPage markup for content the user can actually see on the page.
 */
export const homeFaqs = [
  { q: "What are Neurology and Neurosurgery?", a: "Neurology is the branch of medicine that deals with disorders of the nervous system, while neurosurgery is a surgical speciality focused on treating conditions that require surgical intervention in the nervous system." },
  { q: "When should I see a Neurologist or Neurosurgeon?", a: "You should consider seeing both neurologists and neurosurgeons if you have symptoms related to neurological disorders such as headaches, seizures, or movement problems. Neurosurgeons can also be consulted for surgical interventions like brain or spinal cord surgery." },
  { q: "How can I make an appointment?", a: "You can make an appointment by calling our scheduling department, using our online booking system, or by visiting our hospital in person. Contact information can be found on our website." },
  { q: "What should I expect during my first appointment?", a: "During your initial visit, the neurologist or neurosurgeon will take a detailed medical history, perform a physical examination, and may recommend further diagnostic tests if necessary. Be prepared to discuss your symptoms and concerns." },
  { q: "What types of diagnostic tests are available?", a: "We offer a wide range of diagnostic tests, including MRIs, CT scans, EEGs, and more. The specific test will depend on your condition and the recommendation of your doctor." },
  { q: "What makes Dr. Jayesh Sardhara a top neurosurgeon in Mumbai?", a: "Dr. Jayesh Sardhara is a leading neurosurgeon based in Mulund, Mumbai, known for his exceptional expertise in conducting minimally invasive brain and spine surgeries. Renowned as both an endoscopic spine surgeon and a specialist in brain tumours, his dedication to precision and innovative techniques has earned him recognition as one of the best in the field." },
  { q: "How has Dr. Sardhara's research impacted the field of neurosurgery?", a: "Dr. Sardhara, a leading neurosurgeon doctor and brain tumour specialist, showcases an extensive research portfolio dedicated to enhancing neurosurgical practices. His innovative techniques and published works are pivotal, in shaping future advancements in neurosurgery. As a renowned researcher and specialist, Dr. Sardhara's contributions significantly benefit patients and professionals, reshaping the field's landscape." },
];

export const siteUrl = "https://drjayeshsardhara.com";
