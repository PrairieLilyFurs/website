import { defineCollection } from "astro:content";
import { glob, file } from "astro/loaders";
import { z } from "astro/zod";

const events = defineCollection({
  loader: glob({
    pattern: "*.md",
    base: "./src/data/events",
  }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    location: z.string().optional(),
  }),
});

export const collections = { events };
