import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({
    pattern: '**/*.md',
    base: './obsidian-vault',
  }),
  schema: z.object({
    title: z.string().optional(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
    description: z.string().optional(),
  }),
});

export const collections = { notes };
