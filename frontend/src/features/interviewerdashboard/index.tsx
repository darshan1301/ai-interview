import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { BASE_API_URL } from "../../config";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Users,
  Loader2,
} from "lucide-react";

// Types
type Interview = {
  candidateId: number;
  name: string;
  email: string;
  interviewId: number;
  status: "ready" | "in_progress" | "pause" | "completed";
  score: number;
};

type ApiResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  data: Interview[];
};

export default function InterviewerDashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_API_URL}/api/admin/interviews?page=${page}&pageSize=${pageSize}`,
        {
          credentials: "include",
        }
      );
      const data: ApiResponse = await res.json();
      setInterviews(data.data);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setCurrentPage(data.page);
    } catch (err) {
      console.error("Failed to fetch interviews", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const statusColor = (status: Interview["status"]) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200";
      case "in_progress":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200";
      case "pause":
        return "bg-amber-100 text-amber-700 hover:bg-amber-200";
      case "ready":
      default:
        return "bg-slate-100 text-slate-700 hover:bg-slate-200";
    }
  };

  const statusLabel = (status: Interview["status"]) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "pause":
        return "Paused";
      case "ready":
      default:
        return "Ready";
    }
  };

  // Client-side search filter
  const filteredInterviews = interviews.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.interviewId.toString().includes(searchTerm) ||
      i.candidateId.toString().includes(searchTerm)
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (interviewId: number) => {
    // Navigate to interview page with the interview ID
    window.location.href = `/interview/${interviewId}`;
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);

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
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">
                      Interview ID
                    </TableHead>

                    <TableHead className="font-semibold text-slate-700">
                      Candidate Name
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Email Address
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Score
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="px-4">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Loader2 className="w-8 h-8 animate-spin mb-3" />
                          <p className="text-lg font-medium">
                            Loading interviews...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredInterviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
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
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInterviews.map((interview) => (
                      <TableRow
                        key={interview.interviewId}
                        onClick={() => handleRowClick(interview.interviewId)}
                        className="cursor-pointer px-4 hover:bg-indigo-50 transition-colors">
                        <TableCell className="font-mono text-slate-600">
                          #{interview.interviewId}
                        </TableCell>

                        <TableCell className="font-semibold text-slate-900">
                          {interview.name}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {interview.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "px-3 py-1 font-medium transition-colors",
                              statusColor(interview.status)
                            )}>
                            {statusLabel(interview.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {interview.status === "completed" &&
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
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
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
                      .map((page, index, array) => (
                        <>
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span
                              key={`ellipsis-${page}`}
                              className="px-2 text-slate-400">
                              ...
                            </span>
                          )}
                          <Button
                            key={page}
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
                        </>
                      ))}
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
}
