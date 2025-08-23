import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import Image from "next/image";

const industryLogos = [
  {
    name: "Fisher & Paykel Healthcare",
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/65d80a4331c46a8a017e669f_PNG%20-%20for%20web%2C%20video%2C%20%26%20MS%20Office_F%26P_HEALTHCARE-BLACK.png",
    height: 40,
    scale: "scale-115"
  },
  {
    name: "Fiserv",
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/65c44c5a2b09727f2b779572_fiserv_logo_orange_rgb.png",
    height: 40,
    scale: "scale-110"
  },
  {
    name: "Kiwibank",
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6470185ff821462c1ff6106d_kiwibank-logo.svg",
    height: 40,
    scale: "scale-90"
  },
  {
    name: "Woolworths",
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/65c44c70431bbc00b9cd0cb6_woolworths-logo-1.gif",
    height: 40,
    scale: "scale-125"
  },
  {
    name: "Google",
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6487d241d0c3754ccf289114_google-logo.png",
    height: 40,
    scale: "scale-90"
  },
  {
    name: "MYOB",
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/64701860f27305f34ecc8b66_myob-logo.svg",
    height: 40,
    scale: "scale-105"
  },
  {
    name: "HCLTech",
    src: "https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/6470185f85072710b161d610_hcltech-logo.svg",
    height: 40,
    scale: "scale-90"
  }
];

export function IndustryLogosSection() {
  return (
    <Section className="py-16">
      <Container>
        <h3 className="text-xl font-semibold text-navy text-center mb-8 uppercase">
          Some of the Industries Where Our Mentors Work
        </h3>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {industryLogos.map((logo) => (
            <div key={logo.name} className="relative h-10 w-auto">
              <Image
                src={logo.src}
                alt={logo.name}
                height={logo.height}
                width={150}
                className={`object-contain ${logo.scale || 'scale-100'}`}
              />
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}