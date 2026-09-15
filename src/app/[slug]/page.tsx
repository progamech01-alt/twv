import { notFound } from "next/navigation";
import { Journey, Time, Memories, Letters } from "@/features/visitor/pages";
import { LumiChat } from "@/features/lumi/chat";
import { Studio } from "@/features/studio/studio";
export function generateStaticParams() {
  return ["journey", "time", "memories", "letters", "lumi", "studio"].map(
    (slug) => ({ slug }),
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  switch (slug) {
    case "journey":
      return <Journey />;
    case "time":
      return <Time />;
    case "memories":
      return <Memories />;
    case "letters":
      return <Letters />;
    case "lumi":
      return <LumiChat />;
    case "studio":
      return <Studio />;
    default:
      notFound();
  }
}
