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
import { resolveStructure } from "./src/sanity/structure/structure";
import { resolve } from "@/sanity/presentation/resolve";
import { resolvePagePreviewUrl } from "@/sanity/lib/resolveProductionUrl";
import { defaultDocumentNode } from "@/sanity/structure/defaultDocumentNode";
import { singletonPlugin } from "@/sanity/plugins/singletonPlugin";
import { homeType } from "@/sanity/schemaTypes/singletons/homeType";
import { aboutType } from "@/sanity/schemaTypes/singletons/aboutType";
import { recipeIngredientType } from "@/sanity/schemaTypes/recipe/recipeIngredientType";

const singletonTypes = [homeType, aboutType, recipeIngredientType];

export default defineConfig({
  title: "Bakdel studio",
  basePath: "/studio",
  projectId,
  dataset,
  schema,
  plugins: [
    structureTool({
      structure: resolveStructure(singletonTypes),
      defaultDocumentNode,
    }),
    presentationTool({
      resolve,
      previewUrl: {
        previewMode: {
          enable: draftModeRoute,
        },
      },
    }),
    media(),
    singletonPlugin({ types: singletonTypes.map((t) => t.name) }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  document: {
    productionUrl: resolvePagePreviewUrl,
  },
});
