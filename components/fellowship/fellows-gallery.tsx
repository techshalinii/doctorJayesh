import { AwardsGallery, type GalleryImage } from "@/components/awards-gallery";

const THUMBS = "/wp-content/uploads/elementor/thumbs";
const CAREER_PDF = "/wp-content/uploads/2024/05/choosing_a_career_path_in_a_neurosurgeon_s_life_.2.pdf";
const ALT = "Dr. Jayesh Sardhara with a fellow holding a fellowship completion certificate";

const PHOTOS: GalleryImage[] = [
  { file: "WhatsApp-Image-2026-07-29-at-3.05.07-PM-rr5lz8sj0zi7vvqsi0tko6uom579pfz3sjz6w8aq08.jpeg" },
  { file: "WhatsApp-Image-2026-07-29-at-3.05.08-PM-rr5lz35hvzahy7yzeydt989x1tz2f9cprs2a0kj31k.jpeg" },
  { file: "WhatsApp-Image-2026-07-29-at-3.05.09-PM-rr5lyze54n5cns4g0wraz982oahlkgxsf9gc3gonqg.jpeg" },
  { file: "WhatsApp-Image-2026-07-29-at-3.05.09-PM-1-rr5lyuoy6gyx1qb9scq64serpd4rhzf4qm6wp2vmlk.jpeg", href: CAREER_PDF },
  { file: "WhatsApp-Image-2026-07-29-at-3.05.10-PM-rr5lypzr8ashfoi3jsp1ablgqfrxfhwh1yxhap2lgo.jpeg", href: CAREER_PDF },
  { file: "WhatsApp-Image-2026-07-29-at-3.05.11-PM-rr5lykcq3akri0qagq99vd0p64jq5ba3170kf1ayi0.jpeg", href: CAREER_PDF },
].map(({ file, href }) => ({ src: `${THUMBS}/${file}`, alt: ALT, href }));

export function FellowsGallery() {
  return (
    <AwardsGallery
      className="bg-surface/50 py-14 lg:py-18"
      images={PHOTOS}
      heading={null}
      ariaLabel="Fellowship photographs"
      itemLabel="Fellowship photograph"
      layout="carousel"
      showCaptions={false}
      tile="portrait"
      autoplay={4000}
    />
  );
}
