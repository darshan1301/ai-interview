import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Award,
  Brain,
  Code,
  Users,
  Zap,
} from "lucide-react";
import { BASE_API_URL } from "../config";
import type { InterviewStatus } from "../../../backend/src/utils/types";

interface Question {
  id: number;
  text: string;
  answer: string;
  score: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  type: "TECHNICAL" | "BEHAVIORAL" | "SYSTEM_DESIGN" | "CODING";
}

interface InterviewData {
  user: {
    id: number;
    name: string;
    email: string;
  };
  interviewId: number;
  status: InterviewStatus;
  summary: string;
  score: number;
  questions: Question[];
}

const ViewInterview = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ✅ Fetch interview data on mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${BASE_API_URL}/api/admin/interview/${interviewId}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch interview");

        const data: InterviewData = await response.json();
        setInterview(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId]);

  // ✅ Get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-700 border-green-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "HARD":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // ✅ Get type icon and color
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "TECHNICAL":
        return { icon: Brain, color: "text-blue-600", bg: "bg-blue-50" };
      case "BEHAVIORAL":
        return { icon: Users, color: "text-purple-600", bg: "bg-purple-50" };
      case "SYSTEM_DESIGN":
        return { icon: Zap, color: "text-orange-600", bg: "bg-orange-50" };
      case "CODING":
        return { icon: Code, color: "text-green-600", bg: "bg-green-50" };
      default:
        return {
          icon: MessageSquare,
          color: "text-gray-600",
          bg: "bg-gray-50",
        };
    }
  };

  // ✅ Get score color
  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-green-600";
    if (score >= 7) return "text-yellow-600";
    return "text-red-600";
  };

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  // ✅ Error state
  if (error && !interview) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">
            Error Loading Interview
          </p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!interview) return null;

  // ✅ Calculate question type stats
  const questionStats = interview.questions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // ✅ INTERVIEWER VIEW
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Interview Review
                </h1>
                <p className="text-sm text-gray-500">
                  Detailed evaluation and transcript
                </p>
              </div>
            </div>
          </div>

          {/* Candidate Info & Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Candidate Name */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Candidate
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {interview.user.name}
              </p>
            </div>

            {/* Email */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-4 h-4 text-gray-600" />
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Email
                </p>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {interview.user.email}
              </p>
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-600 uppercase">
                  Overall Score
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {interview.score}
                <span className="text-base text-blue-600 ml-1">/100</span>
              </p>
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center space-x-2 mb-2">
                {interview.status === "completed" ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : interview.status === "in_progress" ? (
                  <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <p className="text-xs font-semibold text-gray-600 uppercase">
                  Status
                </p>
              </div>
              <p
                className={`text-sm font-semibold capitalize ${
                  interview.status === "completed"
                    ? "text-green-600"
                    : interview.status === "in_progress"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}>
                {interview.status.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6" ref={contentRef}>
        {/* Summary Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Interview Summary</span>
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-800 leading-relaxed">
              {interview.summary}
            </p>
          </div>
        </div>

        {/* Question Type Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Question Breakdown
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(questionStats).map(([type, count]) => {
              const config = getTypeConfig(type);
              const TypeIcon = config.icon;
              return (
                <div
                  key={type}
                  className={`${config.bg} rounded-lg p-4 border border-gray-200`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <TypeIcon className={`w-4 h-4 ${config.color}`} />
                    <p className="text-xs font-semibold text-gray-600 uppercase">
                      {type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Questions & Answers */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">
            Questions & Answers ({interview.questions.length})
          </h2>

          {interview.questions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <p className="text-gray-400">
                No questions found in this interview.
              </p>
            </div>
          ) : (
            interview.questions.map((question, index) => {
              const typeConfig = getTypeConfig(question.type);
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={question.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Question Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 ${typeConfig.bg} rounded-lg flex items-center justify-center`}>
                          <TypeIcon className={`w-4 h-4 ${typeConfig.color}`} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-500">
                            Question {index + 1}
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded border ${getDifficultyColor(
                                question.difficulty
                              )}`}>
                              {question.difficulty}
                            </span>
                            <span className="text-xs font-semibold text-gray-600 px-2 py-1 bg-white rounded border border-gray-200">
                              {question.type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-500 mb-1">
                          Score
                        </p>
                        <p
                          className={`text-2xl font-bold ${getScoreColor(
                            question.score
                          )}`}>
                          {question.score}
                          <span className="text-sm text-gray-500">/10</span>
                        </p>
                      </div>
                    </div>
                    <div
                      className="text-base font-semibold text-gray-900 leading-relaxed prose prose-sm max-w-none question-html-content"
                      dangerouslySetInnerHTML={{ __html: question.text }}
                    />
                  </div>

                  {/* Answer Section */}
                  <div className="px-6 py-5 bg-white">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-white" />
                      </div>
                      <p className="text-xs font-semibold text-blue-600 uppercase">
                        Candidate Answer
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {question.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewInterview;
