export type TreatmentData = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  intro: string;
  procedures: { name: string; desc: string; icon: string }[];
  conditions: string[];
  benefits: { title: string; desc: string; icon: string }[];
  faqs: { q: string; a: string }[];
};

export const brainSurgery: TreatmentData = {
  slug: "brain-surgery",
  eyebrow: "Brain Surgery",
  title: "Advanced Brain Surgery",
  description:
    "Precision neurosurgery for tumors, aneurysms, movement disorders and skull-base conditions — using endoscopy, neuro-navigation and intra-operative monitoring.",
  image: "/images/brain-surgery.webp",
  intro:
    "The brain leaves no margin for error. Every procedure combines advanced imaging, image-guided navigation and, wherever possible, keyhole endoscopic access — removing what needs to be removed while protecting the function that makes you, you.",
  procedures: [
    { name: "Brain Tumor Surgery", desc: "Image-guided resection of gliomas, meningiomas and metastatic tumors.", icon: "Brain" },
    { name: "Craniotomy", desc: "Precise surgical access to treat tumors, bleeds and vascular lesions.", icon: "ScanEye" },
    { name: "Endoscopic Skull Base Surgery", desc: "Keyhole endonasal removal of pituitary and skull-base tumors — no external incision.", icon: "ScanEye" },
    { name: "Deep Brain Stimulation", desc: "Neuromodulation to control Parkinson's tremor and movement disorders.", icon: "Activity" },
    { name: "Neurovascular Surgery", desc: "Clipping and endovascular treatment of aneurysms and AVMs.", icon: "HeartPulse" },
    { name: "Pediatric Neurosurgery", desc: "Gentle, specialised care for children with neurosurgical conditions.", icon: "Baby" },
  ],
  conditions: ["Brain Tumors", "Aneurysms", "Stroke", "Epilepsy", "Parkinson's Disease", "Hydrocephalus", "Skull Base Tumors", "Pituitary Tumors"],
  benefits: [
    { title: "Neuro-Navigation", desc: "GPS-like guidance for millimetre precision.", icon: "Cpu" },
    { title: "Endoscopic Access", desc: "Keyhole approaches with no large incisions.", icon: "ScanEye" },
    { title: "Function Preservation", desc: "Intra-operative monitoring protects vital areas.", icon: "Brain" },
    { title: "Faster Recovery", desc: "Smaller openings mean quicker discharge.", icon: "Gauge" },
  ],
  faqs: [
    { q: "Is brain surgery always open surgery?", a: "No. Many brain and skull-base tumors can be treated endoscopically through the nose or via small keyhole openings, avoiding large incisions entirely." },
    { q: "How long is recovery after brain surgery?", a: "It varies by procedure, but minimally invasive approaches often allow discharge within 3–5 days, with a gradual return to normal activity over a few weeks." },
    { q: "Will surgery affect how I think or move?", a: "Function preservation is the priority. Intra-operative neuro-monitoring and navigation are used to protect the areas that control movement, speech and cognition." },
  ],
};

export const spineSurgery: TreatmentData = {
  slug: "spine-surgery",
  eyebrow: "Spine Surgery",
  title: "Minimally Invasive Spine Surgery",
  description:
    "Muscle-sparing, endoscopic and keyhole spine surgery for disc, nerve and deformity problems — designed for less pain and a faster return to life.",
  image: "/images/spine-surgery.webp",
  intro:
    "Most back and neck problems don't need big open surgery anymore. Endoscopic and minimally invasive techniques treat the source of the pain through incisions the size of a keyhole — preserving muscle, reducing blood loss and getting you moving sooner.",
  procedures: [
    { name: "Microdiscectomy", desc: "Keyhole removal of herniated disc material pressing on a nerve.", icon: "Activity" },
    { name: "Endoscopic Spine Surgery", desc: "Ultra-minimally invasive decompression through a tiny endoscope.", icon: "ScanEye" },
    { name: "Spinal Fusion", desc: "Stabilising unstable or painful spinal segments.", icon: "Bone" },
    { name: "Spinal Decompression", desc: "Relieving pressure on nerves in spinal stenosis.", icon: "Activity" },
    { name: "Scoliosis Correction", desc: "Realignment and stabilisation of spinal curvature.", icon: "Bone" },
    { name: "Cervical Spine Surgery", desc: "Treatment of neck disc and nerve compression.", icon: "Bone" },
  ],
  conditions: ["Herniated Disc", "Sciatica", "Spinal Stenosis", "Scoliosis", "Degenerative Disc Disease", "Spondylolisthesis", "Spinal Injuries", "Spinal Fractures", "Neck Pain"],
  benefits: [
    { title: "Muscle-Sparing", desc: "Tissue is separated, not cut, for less trauma.", icon: "Scissors" },
    { title: "Smaller Incisions", desc: "Keyhole access means minimal scarring.", icon: "Activity" },
    { title: "Less Pain", desc: "Reduced post-operative pain and medication.", icon: "Gauge" },
    { title: "Day-Care Options", desc: "Some procedures allow same-day discharge.", icon: "Stethoscope" },
  ],
  faqs: [
    { q: "Will I need a long hospital stay?", a: "Many minimally invasive spine procedures involve a short stay — sometimes even day-care — followed by early mobilisation within 24 hours." },
    { q: "Is spine surgery risky?", a: "All surgery carries some risk, but minimally invasive techniques significantly reduce blood loss, infection risk and recovery time compared with traditional open surgery." },
    { q: "Can surgery be avoided?", a: "Often, yes. Surgery is recommended only after conservative options have been considered. You'll always receive honest advice about whether an operation is truly necessary." },
  ],
};
