import { Card } from "@/components/card";
import { Icons } from "@/components/icons";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getDramaInfo } from "@/lib/dramacool";
import {
  getWatchLists,
  popFromWatchList,
  pushToWatchList,
} from "@/lib/helpers/server";
import { cn } from "@/lib/utils";
import { infoSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { SubmitButton } from "./client";

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function Page({ params }: PageProps) {
  let data = await getDramaInfo(params.slug);
  const parsed = infoSchema.parse(data);
  let { description, episodes, id, image, otherNames, releaseDate, title } =
    parsed;
  return (
    <section className="py-12 space-y-4">
      <div className="flex justify-between">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          {title}
        </h1>
        <WatchListed dramaSeries={parsed} />
      </div>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-muted-foreground">
        {otherNames.join(", ")}
      </h3>
      <p className="leading-7 [&:not(:first-child)]:mt-6">{description}</p>
      <div className="relative">
        <ScrollArea>
          <div className="flex space-x-4 pb-4">
            {episodes?.length === 0 && (
              <div className="flex justify-center items-center gap-2 text-blue-500">
                <Icons.info /> No episodes for this drama yet.
              </div>
            )}
            {episodes?.map((ep, index) => (
              <Card
                key={index}
                data={{
                  title: ep.title,
                  image: image,
                  description: `${ep.subType} - ${
                    ep.releaseDate.includes("ago")
                      ? ep.releaseDate
                      : new Date(ep.releaseDate).toLocaleDateString()
                  }`,
                  link: `/watch/${ep.id}`,
                }}
                className="lg:w-[250px] w-28"
                aspectRatio="square"
                width={250}
                height={330}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}

async function WatchListed({
  dramaSeries,
}: {
  dramaSeries: z.infer<typeof infoSchema>;
}) {
  const watchLists = await getWatchLists();
  const slug = dramaSeries.id;
  let isWatchlisted =
    watchLists.find((l) => l.dramaId === slug)?.dramaId === slug;
  return (
    <form
      action={async () => {
        "use server";
        if (isWatchlisted) {
          await popFromWatchList({ slug });
        } else {
          await pushToWatchList({ slug });
        }
        revalidatePath(`/drama/${slug}`);
      }}
    >
      <SubmitButton>
        {isWatchlisted ? "Remove from " : "Add to "}watchlist
      </SubmitButton>
    </form>
  );
}
