import { RecipesGrid } from "@/components/RecipesGrid/RecipesGrid";
import { TypographyH1 } from "@/components/Typography/TypographyH1";
import { TypographyH2 } from "@/components/Typography/TypographyH2";
import { sanityFetch } from "@/sanity/lib/client";
import { frontPageRecipesQuery } from "@/sanity/lib/queries";

export default async function Home() {
  const recipes = await sanityFetch({
    query: frontPageRecipesQuery,
  });

  return (
    <main className="sm:mt-35 mb-10 mt-16 flex flex-col items-center gap-20 pl-5 pr-5">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:text-center">
        <TypographyH1>Bake 🍞</TypographyH1>
        <p className="text-2xl">Lettleste oppskrifter som skalerer.</p>
      </div>

      <div className="w-full max-w-6xl">
        <TypographyH2>Oppskrifter</TypographyH2>

        <RecipesGrid recipes={recipes} />
      </div>
    </main>
  );
}
