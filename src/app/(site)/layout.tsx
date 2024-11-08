import { draftMode } from "next/headers";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { Nav } from "@/components/Nav/Nav";
import { Footer } from "@/components/Footer/Footer";
import { SearchAction, WebSite, WithContext } from "schema-dts";
import { JsonLd } from "@/components/JsonLd/JsonLd";
import { homeSeoQuery } from "@/sanity/lib/queries";
import { urlForImage } from "@/sanity/lib/utils";
import {
  openGraphMetadata,
  siteName,
  siteUrl,
  twitterMetadata,
} from "./shared-metadata";
import { cache } from "react";
import { sanityFetchNonLive } from "@/sanity/lib/client";
import Script from "next/script";
import { DynamicDisableDraftMode } from "./DynamicDisableDraftMode";
import dynamic from "next/dynamic";

const SanityLive = dynamic(() =>
  import("@/sanity/lib/live").then((mod) => mod.SanityLive),
);

const VisualEditing = dynamic(() =>
  import("next-sanity").then((mod) => mod.VisualEditing),
);

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const getSeoData = cache(
  async () =>
    await sanityFetchNonLive({
      query: homeSeoQuery,
      revalidate: 60 * 60,
    }),
);

export async function generateMetadata(): Promise<Metadata> {
  const homeSeo = await getSeoData();

  const metaDescription = homeSeo?.seo?.metaDescription ?? "";

  const imageWidth = 800;
  const imageHeight = 600;

  const imageUrl = homeSeo?.seo?.openGraphImage
    ? (urlForImage(homeSeo?.seo?.openGraphImage)
        ?.width(imageWidth)
        .height(600)
        .dpr(1)
        .url() ?? undefined)
    : undefined;

  return {
    title: {
      default: "Bakdel",
      template: "%s | Bakdel",
    },
    keywords: [
      "bake",
      "mat",
      "baking",
      "oppskrifter",
      "bakeoppskrifter",
      "matoppskrifter",
      "skalere",
      "skalerbare",
      "skalerbar",
    ],
    description: metaDescription,
    openGraph: {
      ...openGraphMetadata,
      title: homeSeo?.seo?.metaTitle ?? openGraphMetadata?.title ?? siteName,
      description: metaDescription,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: imageWidth,
              height: imageHeight,
            },
          ]
        : [],
    },
    twitter: {
      ...twitterMetadata,
      description: metaDescription,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: imageWidth,
              height: imageHeight,
            },
          ]
        : [],
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
      googleBot: "index, follow",
    },
    applicationName: "Bakdel",
    icons: {
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍞</text></svg>",
    },
  };
}

const searchAction = {
  "@type": "SearchAction",
  target: `${siteUrl}/oppskrifter?query={search_term_string}`,
  "query-input": "required name=search_term_string",
} satisfies SearchAction & { "query-input": string };

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const homeSeo = await getSeoData();

  const jsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Bakdel",
    description: homeSeo?.seo?.metaDescription ?? "",
    url: siteUrl,
    potentialAction: searchAction,
  };

  const draftModeEnabled = (await draftMode()).isEnabled;

  return (
    <html lang="no">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-zinc-50 text-black antialiased`}
      >
        <Nav />
        <div className="flex-1">{children}</div>
        <Footer />
        <JsonLd jsonLd={jsonLd} />
        <Script
          strategy="lazyOnload"
          src="https://app.tinyanalytics.io/pixel/YRE2eBbx3BUYqOdv"
        />
        {draftModeEnabled && (
          <>
            <DynamicDisableDraftMode />
            <SanityLive />
            <VisualEditing />
          </>
        )}
      </body>
    </html>
  );
}
