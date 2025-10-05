'use server';

/**
 * @fileOverview AI flow to generate system states for deadlock simulation.
 *
 * - generateDeadlockScenario - A function that creates a system state.
 * - GenerateDeadlockScenarioInput - Input specifying the scenario type.
 * - GenerateDeadlockScenarioOutput - The generated system state and explanation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateDeadlockScenarioInputSchema = z.object({
  type: z
    .enum(['random', 'deadlocked', 'safe'])
    .describe('The type of scenario to generate.'),
});
export type GenerateDeadlockScenarioInput = z.infer<
  typeof GenerateDeadlockScenarioInputSchema
>;

const GenerateDeadlockScenarioOutputSchema = z.object({
  processes: z.number().describe('The number of processes in the system.'),
  resources: z.number().describe('The number of resource types.'),
  allocationMatrix: z
    .array(z.array(z.number()))
    .describe('An allocation matrix of size processes x resources.'),
  requestMatrix: z
    .array(z.array(z.number()))
    .describe('A request matrix of size processes x resources.'),
  availableVector: z
    .array(z.number())
    .describe('An available vector of size resources.'),
  explanation: z
    .string()
    .describe(
      'A brief, natural language explanation of why the state is deadlocked, safe, or random.'
    ),
});
export type GenerateDeadlockScenarioOutput = z.infer<
  typeof GenerateDeadlockScenarioOutputSchema
>;

export async function generateDeadlockScenario(
  input: GenerateDeadlockScenarioInput
): Promise<GenerateDeadlockScenarioOutput> {
  return generateDeadlockScenarioFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDeadlockScenarioPrompt',
  input: { schema: GenerateDeadlockScenarioInputSchema },
  output: { schema: GenerateDeadlockScenarioOutputSchema },
  prompt: `You are an expert in Operating Systems, specializing in deadlocks.
    Your task is to generate a system state for a deadlock detection simulation based on the user's request.

    The user wants a "{{type}}" scenario.

    Constraints:
    - Number of processes should be between 3 and 5.
    - Number of resource types should be between 2 and 4.
    - All matrix and vector values must be non-negative integers.
    - The Request matrix values for a process should not exceed what it might eventually need.
    - The numbers should be plausible and not excessively large (e.g., single digits are best).

    Scenario-specific instructions:
    - If type is "deadlocked": You MUST create a scenario where at least one deadlock is guaranteed to exist. This usually involves a circular wait condition.
    - If type is "safe": You MUST create a scenario that is guaranteed to be in a safe state, meaning all processes can eventually finish.
    - If type is "random": Create any valid scenario. It could be safe or deadlocked.

    After creating the state, provide a short, one-sentence explanation for why the generated state matches the requested type (e.g., "This state is deadlocked because P1 is waiting for a resource held by P2, and P2 is waiting for a resource held by P1.").

    Generate the system state now. Ensure the output is valid JSON matching this schema:
    ${JSON.stringify(GenerateDeadlockScenarioOutputSchema.shape)}
    `,
});

const generateDeadlockScenarioFlow = ai.defineFlow(
  {
    name: 'generateDeadlockScenarioFlow',
    inputSchema: GenerateDeadlockScenarioInputSchema,
    outputSchema: GenerateDeadlockScenarioOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

    