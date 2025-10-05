'use server';

/**
 * @fileOverview Dynamically adjusts the difficulty of exercises based on user performance.
 *
 * - adjustDifficulty - A function that adjusts the difficulty of exercises.
 * - AdjustDifficultyInput - The input type for the adjustDifficulty function, includes user performance data.
 * - AdjustDifficultyOutput - The return type for the adjustDifficulty function, suggesting the next difficulty level.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustDifficultyInputSchema = z.object({
  userId: z.string().describe('The ID of the user.'),
  currentDifficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The current difficulty level of the exercises.'),
  performance: z
    .number()
    .min(0)
    .max(1)
    .describe(
      'The user performance on the current exercise, represented as a decimal between 0 and 1 (0 = 0%, 1 = 100%).'
    ),
  topic: z.string().describe('The topic of the learning material.'),
});
export type AdjustDifficultyInput = z.infer<typeof AdjustDifficultyInputSchema>;

const AdjustDifficultyOutputSchema = z.object({
  suggestedDifficulty: z
    .enum(['easy', 'medium', 'hard'])
    .describe('The suggested difficulty level for the next exercise.'),
  reason: z
    .string()
    .describe('The reasoning behind the suggested difficulty level.'),
});
export type AdjustDifficultyOutput = z.infer<typeof AdjustDifficultyOutputSchema>;

export async function adjustDifficulty(input: AdjustDifficultyInput): Promise<AdjustDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const adjustDifficultyPrompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {schema: AdjustDifficultyInputSchema},
  output: {schema: AdjustDifficultyOutputSchema},
  prompt: `You are an adaptive learning system that adjusts the difficulty of exercises based on the user's performance.

  The user's performance is indicated by the "performance" parameter, which is a decimal between 0 and 1.
  Current topic is: {{{topic}}}

  Here's how to adjust the difficulty:
  - If the performance is below 0.5, suggest an easier difficulty level.
  - If the performance is between 0.5 and 0.8, suggest the same difficulty level.
  - If the performance is above 0.8, suggest a harder difficulty level.

  Current difficulty: {{{currentDifficulty}}}
  Performance: {{{performance}}}

  Now, decide what the next difficulty should be, and why.
  Consider current difficulty, topic, and the user's performance.

  Ensure the outputted JSON is valid.
  Here is the schema: ${JSON.stringify(AdjustDifficultyOutputSchema.shape)}`,
});

const adjustDifficultyFlow = ai.defineFlow(
  {
    name: 'adjustDifficultyFlow',
    inputSchema: AdjustDifficultyInputSchema,
    outputSchema: AdjustDifficultyOutputSchema,
  },
  async input => {
    const {output} = await adjustDifficultyPrompt(input);
    return output!;
  }
);
