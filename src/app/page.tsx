import type { Metadata } from "next";
import { HomeExperience } from "@/components/home/home-experience";

export const metadata: Metadata = {
  title: "MKE H-D Prize Hub — Floor",
  description: "Premium Milwaukee Harley-Davidson event prize activation.",
};

export default function HomePage() {
  return <HomeExperience />;
}
