import { LandingNav } from "@/features/landing/components/landing-nav";
import { HeroSection } from "@/features/landing/components/hero-section";
import { FeaturesSection } from "@/features/landing/components/features-section";
import { ArchitectureSection } from "@/features/landing/components/architecture-section";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { CtaSection } from "@/features/landing/components/cta-section";
import { LandingFooter } from "@/features/landing/components/landing-footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <LandingNav />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <ArchitectureSection />
        <HowItWorksSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
