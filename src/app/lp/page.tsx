import type { Metadata } from "next";
import { LandingContent } from "@/components/LandingContent";

export const metadata: Metadata = {
  title: "musu.world - ひとりだけど、ひとりじゃない。",
  description:
    "AIが、あなたの仕事仲間になる。フリーランス・個人事業主のためのAIエージェントチーム。使った分だけの従量課金。",
};

export default function LandingPage() {
  return <LandingContent />;
}
