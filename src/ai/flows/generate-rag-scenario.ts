'use server';

/**
 * @fileOverview AI flow to generate Resource Allocation Graph (RAG) scenarios.
 *
 * - generateRagScenario - A function that creates a RAG state.
 * - GenerateRagScenarioInput - Input specifying the scenario type.
 * - GenerateRagScenarioOutput - The generated graph state and explanation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateRagScenarioInputSchema = z.object({
  type: z
    .enum(['random', 'deadlocked', 'safe'])
    .describe('The type of graph scenario to generate.'),
});
export type GenerateRagScenarioInput = z.infer<
  typeof GenerateRagScenarioInputSchema
>;

const GenerateRagScenarioOutputSchema = z.object({
  nodes: z
    .array(
      z.object({
        type: z.enum(['process', 'resource']),
        label: z.string(),
      })
    )
    .describe('An array of processes and resources in the graph.'),
  edges: z
    .array(
      z.object({
        sourceLabel: z.string(),
        targetLabel: z.string(),
        type: z.enum(['request', 'assignment']),
      })
    )
    .describe(
      'An array of edges (requests and assignments) between nodes.'
    ),
  explanation: z
    .string()
    .describe(
      'A brief, natural language explanation of why the graph is deadlocked, safe, or random.'
    ),
});
export type GenerateRagScenarioOutput = z.infer<
  typeof GenerateRagScenarioOutputSchema
>;

export async function generateRagScenario(
  input: GenerateRagScenarioInput
): Promise<GenerateRagScenarioOutput> {
  return generateRagScenarioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRagScenarioPrompt',
  input: { schema: GenerateRagScenarioInputSchema },
  output: { schema: GenerateRagScenarioOutputSchema },
  prompt: `You are an expert in Operating Systems, specializing in deadlocks.
    Your task is to generate a Resource Allocation Graph (RAG) state for a simulation based on the user's request.

    The user wants a "{{type}}" scenario.

    Constraints:
    - Number of processes (P) should be between 2 and 4.
    - Number of resources (R) should be between 2 and 4.
    - All resources have only a single instance.
    - Process labels must be "P0", "P1", etc. Resource labels must be "R0", "R1", etc.
    - An edge from a process to a resource is a 'request' edge.
    - An edge from a resource to a process is an 'assignment' edge.

    Scenario-specific instructions:
    - If type is "deadlocked": You MUST create a scenario where a cycle exists in the graph.
    - If type is "safe": You MUST create a scenario that is guaranteed to be in a safe state (no cycles).
    - If type is "random": Create any valid scenario. It could be safe or deadlocked.

    After creating the graph, provide a short, one-sentence explanation for why the generated state matches the requested type (e.g., "This graph is deadlocked because P1->R1->P2->R2->P1 forms a cycle.").

    Generate the graph state now. Ensure the output is valid JSON matching this schema:
    ${JSON.stringify(GenerateRagScenarioOutputSchema.shape)}
    `,
});

const generateRagScenarioFlow = ai.defineFlow(
  {
    name: 'generateRagScenarioFlow',
    inputSchema: GenerateRagScenarioInputSchema,
    outputSchema: GenerateRagScenarioOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
