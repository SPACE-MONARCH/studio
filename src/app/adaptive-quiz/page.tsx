'use client';

import { useState } from 'react';
import { adjustDifficulty, type AdjustDifficultyOutput } from '@/ai/flows/adaptive-learning-path';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Lightbulb, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

const questions: Record<Difficulty, { text: string; options: string[]; answer: string }> = {
  easy: {
    text: 'What is a primary condition for a deadlock to occur?',
    options: ['Mutual Exclusion', 'High CPU usage', 'Low memory', 'Fast I/O'],
    answer: 'Mutual Exclusion',
  },
  medium: {
    text: 'In a Resource Allocation Graph, a cycle is a ________ condition for a deadlock if resources have multiple instances.',
    options: ['necessary but not sufficient', 'sufficient but not necessary', 'necessary and sufficient', 'neither necessary nor sufficient'],
    answer: 'necessary but not sufficient',
s  },
  hard: {
    text: "If Banker's Algorithm is checking a request, what does it mean if `Request_i <= Need_i` is false?",
    options: ['The process has exceeded its maximum claim', 'The system is in an unsafe state', 'The resources are not available', 'The process will be granted the resources'],
    answer: 'The process has exceeded its maximum claim',
  },
};

export default function AdaptiveQuizPage() {
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<AdjustDifficultyOutput | null>(null);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);

  const handleQuizSubmit = async () => {
    if (!selectedOption) return;

    setIsSubmitting(true);
    setAiResponse(null);

    const isCorrect = selectedOption === questions[currentDifficulty].answer;
    setResult(isCorrect ? 'correct' : 'incorrect');
    const performance = isCorrect ? 0.9 : 0.4; // Simulate high/low performance

    try {
      const response = await adjustDifficulty({
        userId: 'user-123',
        currentDifficulty,
        performance,
        topic: 'Deadlock Conditions',
      });
      setAiResponse(response);
    } catch (error) {
      console.error('AI difficulty adjustment failed:', error);
      // Handle error in UI if necessary
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setCurrentDifficulty(aiResponse?.suggestedDifficulty || 'easy');
    setResult(null);
    setAiResponse(null);
    setSelectedOption(null);
  };

  const question = questions[currentDifficulty];

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Adaptive AI Quiz</CardTitle>
          <CardDescription>
            This quiz adapts its difficulty based on your performance, powered by AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!result ? (
            <div>
              <p className="font-medium mb-4">{question.text}</p>
              <RadioGroup onValueChange={setSelectedOption} value={selectedOption ?? undefined}>
                {question.options.map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="font-normal">{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className={`text-lg font-semibold ${result === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
                {result === 'correct' ? 'Correct!' : 'Incorrect.'}
              </h3>
              {result === 'incorrect' && <p>The correct answer was: <strong>{question.answer}</strong></p>}
              
              {isSubmitting && (
                 <div className="flex items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI is analyzing your performance...
                 </div>
              )}

              {aiResponse && (
                <Card className="bg-primary/5">
                  <CardHeader className="flex-row items-start gap-4 space-y-0">
                     {aiResponse.suggestedDifficulty > currentDifficulty ? <TrendingUp className="size-6 text-primary" /> : <TrendingDown className="size-6 text-primary" />}
                     <div>
                        <CardTitle className="text-base">AI Feedback</CardTitle>
                        <CardDescription>{aiResponse.reason}</CardDescription>
                     </div>
                  </CardHeader>
                  <CardContent>
                    <p className="flex items-center text-sm">
                      <Lightbulb className="mr-2 size-4 text-amber-500"/>
                      Suggested next difficulty: <strong className="ml-1.5 capitalize">{aiResponse.suggestedDifficulty}</strong>
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          {!result ? (
            <Button onClick={handleQuizSubmit} disabled={!selectedOption || isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit
            </Button>
          ) : (
            <Button onClick={handleNextQuestion} disabled={!aiResponse}>
              Next Question <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
