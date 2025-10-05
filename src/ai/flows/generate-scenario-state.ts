'use server';

/**
 * @fileOverview AI flow to generate new system states for existing game scenarios.
 *
 * - generateScenarioState - A function that creates a new system state for a given scenario.
 * - GenerateScenarioStateInput - Input specifying the scenario context and desired state type.
 * - GenerateScenarioStateOutput - The generated system state and an explanation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateScenarioStateInputSchema = z.object({
  scenarioTitle: z.string().describe('The title of the scenario, e.g., "The Printer Queue Jam".'),
  processCount: z.number().describe('The number of processes in the scenario.'),
  resourceCount: z.number().describe('The number of resource types in the scenario.'),
  type: z
    .enum(['random', 'deadlocked', 'safe'])
    .describe('The type of state to generate.'),
});
export type GenerateScenarioStateInput = z.infer<
  typeof GenerateScenarioStateInputSchema
>;

const GenerateScenarioStateOutputSchema = z.object({
  allocationMatrix: z
    .array(z.array(z.number()))
    .describe('An allocation matrix of size processes x resources.'),
  maxMatrix: z
    .array(z.array(z.number()))
    .describe('A max matrix of size processes x resources.'),
  availableVector: z
    .array(z.number())
    .describe('An available vector of size resources.'),
  explanation: z
    .string()
    .describe(
      'A brief, natural language explanation of why the state is deadlocked, safe, or random for the given scenario context.'
    ),
});
export type GenerateScenarioStateOutput = z.infer<
  typeof GenerateScenarioStateOutputSchema
>;

export async function generateScenarioState(
  input: GenerateScenarioStateInput
): Promise<GenerateScenarioStateOutput> {
  return generateScenarioStateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateScenarioStatePrompt',
  input: { schema: GenerateScenarioStateInputSchema },
  output: { schema: GenerateScenarioStateOutputSchema },
  prompt: `You are an expert in Operating Systems, specializing in deadlocks.
    Your task is to generate a new system state for a game scenario called "{{scenarioTitle}}".

    The system has {{processCount}} processes and {{resourceCount}} resources.
    The user wants a "{{type}}" state.

    Constraints:
    - All matrix and vector values must be non-negative integers.
    - Allocation for a process must not exceed its Max.
    - The numbers should be plausible and not excessively large (e.g., single digits are best).

    Scenario-specific instructions:
    - If type is "deadlocked": You MUST create a state where at least one deadlock is guaranteed to exist. This usually involves a circular wait condition.
    - If type is "safe": You MUST create a state that is guaranteed to be in a safe state, meaning all processes can eventually finish. The available vector should not be all zeros unless necessary.
    - If type is "random": Create any valid state. It could be safe or deadlocked.

    After creating the state, provide a short, one-sentence explanation for why the generated state matches the requested type (e.g., "This state is deadlocked because Dept A is waiting for a resource held by Dept B, and Dept B is waiting for one held by Dept A.").

    Generate the system state now. Ensure the output is valid JSON matching this schema:
    ${JSON.stringify(GenerateScenarioStateOutputSchema.shape)}
    `,
});

const generateScenarioStateFlow = ai.defineFlow(
  {
    name: 'generateScenarioStateFlow',
    inputSchema: GenerateScenarioStateInputSchema,
    outputSchema: GenerateScenarioStateOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
