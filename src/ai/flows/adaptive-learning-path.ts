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
    .describe('The reasoning behind the suggested difficulty level, explained in an encouraging and educational tone.'),
});
export type AdjustDifficultyOutput = z.infer<typeof AdjustDifficultyOutputSchema>;

export async function adjustDifficulty(input: AdjustDifficultyInput): Promise<AdjustDifficultyOutput> {
  return adjustDifficultyFlow(input);
}

const adjustDifficultyPrompt = ai.definePrompt({
  name: 'adjustDifficultyPrompt',
  input: {schema: AdjustDifficultyInputSchema},
  output: {schema: AdjustDifficultyOutputSchema},
  prompt: `You are an expert, encouraging AI tutor for an operating systems course. Your goal is to create an adaptive learning path by adjusting the difficulty of quiz questions based on the user's performance.

  The current topic is: {{{topic}}}

  Analyze the user's performance on the last question:
  - Current difficulty: {{{currentDifficulty}}}
  - Performance score (0.0 to 1.0): {{{performance}}}

  Based on the performance, decide the next difficulty level using these rules:
  - If performance is > 0.8, suggest a harder difficulty.
  - If performance is between 0.5 and 0.8, suggest the same difficulty.
  - If performance is < 0.5, suggest an easier difficulty.

  After deciding the difficulty, provide a concise, educational, and encouraging reason for your choice.
  For example, if the user did well and you're increasing the difficulty, say something like: "Great job on that question! You've clearly got a good handle on the basics. Let's try something a bit more challenging to really solidify your understanding."
  If the user struggled and you're decreasing the difficulty, be encouraging: "That was a tricky one! Let's go back to a slightly easier question to reinforce the core concepts before moving on. You've got this!"

  Now, generate the suggested difficulty and your reasoning.
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
