import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Users,
  Loader2,
  Search,
} from "lucide-react";
import { BASE_API_URL } from "../config";
import { InterviewStatus } from "../../../backend/src/utils/types";

interface Interview {
  candidateId: string;
  name: string;
  email: string;
  interviewId: number;
  status: InterviewStatus;
  score: number | null;
}

interface PaginatedResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: Interview[];
}

const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(" ");
};

const Admin = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInterviews(currentPage);
  }, [currentPage]);

  const fetchInterviews = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${BASE_API_URL}/api/admin/list-interviews?page=${page}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch interviews");
      }

      const data: PaginatedResponse = await response.json();
      setInterviews(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (interviewId: number) => {
    window.open(`/interview/${interviewId}`, "_blank");
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const statusColor = (status: InterviewStatus) => {
    const statusMap: Record<string, string> = {
      completed: "bg-green-100 text-green-800 hover:bg-green-200",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-200",
    };
    return (
      statusMap[status.toLowerCase()] ||
      "bg-gray-100 text-gray-800 hover:bg-gray-200"
    );
  };

  const statusLabel = (status: InterviewStatus) => {
    const labelMap: Record<string, string> = {
      completed: "Completed",
      pending: "Pending",
      in_progress: "In Progress",
    };
    return labelMap[status.toLowerCase()] || status;
  };

  const filteredInterviews = interviews.filter((interview) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      interview.name?.toLowerCase().includes(searchLower) ||
      interview.email.toLowerCase().includes(searchLower) ||
      interview.interviewId.toString().includes(searchLower)
    );
  });

  const pageSize = 10;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <Card className="max-w-7xl mx-auto shadow-xl">
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-red-500">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Interview Dashboard
            </h1>
            <p className="text-slate-600">
              Monitor and manage candidate interviews
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <span className="text-slate-600">Total</span>
          </div>
        </div>

        {/* Main Table Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-slate-900">
                Interviews
              </CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 hover:bg-slate-50">
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Interview ID
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Candidate Name
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Email Address
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-slate-700">
                      Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin mb-3" />
                          <p className="text-lg font-medium">
                            Loading interviews...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <div className="text-slate-400">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p className="text-lg font-medium">
                            No interviews found
                          </p>
                          <p className="text-sm">
                            {searchTerm
                              ? "Try adjusting your search criteria"
                              : "No data available"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInterviews.map((interview) => (
                      <tr
                        key={interview.interviewId}
                        onClick={() =>
                          interview.status.toLowerCase() === "completed" &&
                          handleRowClick(interview.interviewId)
                        }
                        className={cn(
                          "border-b border-slate-100 transition-colors",
                          interview.status.toLowerCase() === "completed" &&
                            "cursor-pointer hover:bg-indigo-50"
                        )}>
                        <td className="px-6 py-4 font-mono text-slate-600">
                          #{interview.interviewId}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {interview.name || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {interview.email}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            className={cn(
                              "px-3 py-1 font-medium transition-colors",
                              statusColor(interview.status)
                            )}>
                            {statusLabel(interview.status)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {interview.status === InterviewStatus.COMPLETED &&
                          interview.score !== null &&
                          interview.score > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-slate-900">
                                {interview.score}
                              </span>
                              <span className="text-sm text-slate-500">
                                / 100
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="text-sm text-slate-600">
                  Showing{" "}
                  <span className="font-medium text-slate-900">
                    {startIndex + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-slate-900">{endIndex}</span>{" "}
                  of <span className="font-medium text-slate-900">{total}</span>{" "}
                  results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0">
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-9 w-9 p-0">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                      )
                      .map((page, index, array) => {
                        const showEllipsis =
                          index > 0 && array[index - 1] !== page - 1;
                        return (
                          <div key={page} className="flex items-center gap-1">
                            {showEllipsis && (
                              <span className="px-2 text-slate-400">...</span>
                            )}
                            <Button
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={cn(
                                "h-9 w-9 p-0",
                                currentPage === page &&
                                  "bg-indigo-600 hover:bg-indigo-700"
                              )}>
                              {page}
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9 p-0">
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
