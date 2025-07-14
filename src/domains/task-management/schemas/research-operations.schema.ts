import { z } from 'zod';

// Research Operations Schema - Research reports and communication
export const ResearchOperationsSchema = z.object({
  operation: z.enum(['create_research', 'update_research', 'get_research']),

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
});

export type ResearchOperationsInput = z.infer<typeof ResearchOperationsSchema>;

// Export schema for MCP tool usage
export const ResearchOperationsInputSchema = ResearchOperationsSchema;
