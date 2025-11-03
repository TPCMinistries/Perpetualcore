"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trophy,
  BookOpen,
  Lightbulb,
  AlertCircle,
  Play,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LessonSection {
  title: string;
  content: React.ReactNode;
  type?: "text" | "tip" | "warning" | "interactive";
}

interface LessonLayoutProps {
  lessonId: string;
  pathId: string;
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  sections: LessonSection[];
  nextLesson?: {
    id: string;
    title: string;
    href: string;
  };
  previousLesson?: {
    id: string;
    title: string;
    href: string;
  };
  practiceExercise?: React.ReactNode;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }[];
}

export function LessonLayout({
  lessonId,
  pathId,
  title,
  description,
  estimatedTime,
  difficulty,
  sections,
  nextLesson,
  previousLesson,
  practiceExercise,
  quiz,
}: LessonLayoutProps) {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);

  useEffect(() => {
    // Check if lesson is already completed
    const completedLessons = JSON.parse(localStorage.getItem("completed-lessons") || "[]");
    setIsCompleted(completedLessons.includes(lessonId));
  }, [lessonId]);

  const markAsComplete = () => {
    const completedLessons = JSON.parse(localStorage.getItem("completed-lessons") || "[]");
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
      localStorage.setItem("completed-lessons", JSON.stringify(completedLessons));
      setIsCompleted(true);

      // Also track in completed-suggestions for overall progress
      const completedSuggestions = JSON.parse(localStorage.getItem("completed-suggestions") || "[]");
      completedSuggestions.push({
        id: lessonId,
        timestamp: new Date().toISOString(),
        type: "lesson",
        pathId,
      });
      localStorage.setItem("completed-suggestions", JSON.stringify(completedSuggestions));
    }
  };

  const handleNextLesson = () => {
    markAsComplete();
    if (nextLesson) {
      router.push(nextLesson.href);
    } else {
      // Return to learning paths
      router.push("/dashboard/training/learning-paths");
    }
  };

  const getSectionIcon = (type?: string) => {
    switch (type) {
      case "tip":
        return <Lightbulb className="h-5 w-5 text-yellow-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case "interactive":
        return <Play className="h-5 w-5 text-blue-600" />;
      default:
        return <BookOpen className="h-5 w-5 text-gray-600" />;
    }
  };

  const difficultyColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    intermediate: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    advanced: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const progressPercent = Math.round(((currentSection + 1) / sections.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border border-blue-100 dark:border-blue-900/20 rounded-xl p-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Badge className={difficultyColors[difficulty]} variant="outline">
                {difficulty}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {estimatedTime} min
              </Badge>
              {isCompleted && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-900 to-purple-800 dark:from-blue-100 dark:to-purple-100 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lesson Progress</span>
            <span className="font-medium">
              Section {currentSection + 1} of {sections.length}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Lesson Content */}
      <Card>
        <CardContent className="p-8">
          {sections.map((section, index) => (
            <div
              key={index}
              className={`${index === currentSection ? "block" : "hidden"}`}
            >
              <div className="flex items-start gap-3 mb-6">
                {getSectionIcon(section.type)}
                <h2 className="text-2xl font-bold">{section.title}</h2>
              </div>
              <div className="prose prose-blue dark:prose-invert max-w-none">
                {section.content}
              </div>
            </div>
          ))}

          {/* Section Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Section
            </Button>

            {currentSection < sections.length - 1 ? (
              <Button
                onClick={() => setCurrentSection(currentSection + 1)}
              >
                Next Section
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentSection(sections.length)}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                Continue to Quiz
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Practice Exercise (if provided) */}
      {practiceExercise && currentSection === sections.length && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Target className="h-6 w-6 text-purple-600" />
              <h2 className="text-2xl font-bold">Practice Exercise</h2>
            </div>
            {practiceExercise}
          </CardContent>
        </Card>
      )}

      {/* Quiz (if provided) */}
      {quiz && currentSection === sections.length && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="h-6 w-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Knowledge Check</h2>
            </div>

            <div className="space-y-6">
              {quiz.map((q, qIndex) => (
                <div key={qIndex} className="space-y-3">
                  <p className="font-medium text-lg">{qIndex + 1}. {q.question}</p>
                  <div className="space-y-2 ml-4">
                    {q.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        onClick={() => {
                          const newAnswers = [...quizAnswers];
                          newAnswers[qIndex] = oIndex;
                          setQuizAnswers(newAnswers);
                        }}
                        className={`block w-full text-left p-3 rounded-lg border transition-all ${
                          quizAnswers[qIndex] === oIndex
                            ? showQuizResults
                              ? oIndex === q.correctAnswer
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                : "border-red-500 bg-red-50 dark:bg-red-950/20"
                              : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                            : "border-gray-200 dark:border-gray-800 hover:border-gray-300"
                        }`}
                        disabled={showQuizResults}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {showQuizResults && (
                    <div className="ml-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm">{q.explanation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!showQuizResults && quizAnswers.length === quiz.length && (
              <Button
                onClick={() => setShowQuizResults(true)}
                className="mt-6 w-full"
              >
                Check Answers
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        {previousLesson ? (
          <Link href={previousLesson.href}>
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              {previousLesson.title}
            </Button>
          </Link>
        ) : (
          <Link href="/dashboard/training/learning-paths">
            <Button variant="outline">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Learning Paths
            </Button>
          </Link>
        )}

        {(currentSection === sections.length || !quiz) && (
          <Button
            onClick={handleNextLesson}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {!isCompleted && <CheckCircle2 className="h-4 w-4 mr-2" />}
            {nextLesson ? `Next: ${nextLesson.title}` : "Complete & Return"}
            {nextLesson && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        )}
      </div>
    </div>
  );
}
