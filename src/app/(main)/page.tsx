import {
  HeroSection,
  StatsSection,
  FeaturedProducts,
  CommissionCTA,
  AnnouncementModal,
  TeamSection,
  FlashSaleSection,
} from "@/components/home";

export default function Home() {
  return (
    <>
      <AnnouncementModal />
      <HeroSection />
      <StatsSection />
      <FlashSaleSection />
      <FeaturedProducts />
      <TeamSection />
      <CommissionCTA />
    </>
  );
}
