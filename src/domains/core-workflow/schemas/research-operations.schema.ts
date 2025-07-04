import { z } from 'zod';

// Research Operations Schema - Research reports and communication
export const ResearchOperationsSchema = z.object({
  operation: z.enum([
    'create_research',
    'update_research',
    'get_research',
    'add_comment',
    'get_comments',
  ]),

  taskId: z.number(),

  // For research operations
  researchData: z
    .object({
      title: z.string().optional(),
      summary: z.string().optional(),
      findings: z.string(),
      recommendations: z.string().optional(),
      references: z.array(z.string()).optional(),
    })
    .optional(),

  // For comment operations
  commentData: z
    .object({
      content: z.string(),
      author: z.string(), // Will be mapped to 'mode' field in database
    })
    .optional(),

  // For querying
  includeComments: z.boolean().default(true),
  commentType: z.string().optional(), // Maps to 'mode' field
});

export type ResearchOperationsInput = z.infer<typeof ResearchOperationsSchema>;
