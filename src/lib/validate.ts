import { z } from "zod";

export const EmailSchema = z.object({
  email: z.string().email(),
  consentMarketing: z.boolean().optional(),
});

export const ScanSchema = z.object({
  kind: z.enum(["image", "video"]),
});

export const ProcessSchema = z.object({
  kind: z.enum(["image", "video"]),
  mode: z.enum(["strip", "edit"]),
  fields: z
    .object({
      author: z.string().optional(),
      title: z.string().optional(),
      comment: z.string().optional(),
      dateTimeOriginal: z.string().optional(),
    })
    .optional(),
});
