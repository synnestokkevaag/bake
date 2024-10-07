"use client";

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { presentationTool } from "sanity/presentation";
import { media } from "sanity-plugin-media";

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {
  apiVersion,
  dataset,
  draftModeRoute,
  projectId,
} from "./src/sanity/env";
import { schema } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure/structure";
import { resolve } from "@/sanity/presentation/resolve";
import { resolvePagePreviewUrl } from "@/sanity/lib/resolveProductionUrl";
import { defaultDocumentNode } from "@/sanity/structure/defaultDocumentNode";

export default defineConfig({
  title: "Bakdel studio",
  basePath: "/studio",
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({ structure, defaultDocumentNode }),
    presentationTool({
      resolve,
      previewUrl: {
        previewMode: {
          enable: draftModeRoute,
        },
      },
    }),
    media(),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: {
    productionUrl: resolvePagePreviewUrl,
  },
});
