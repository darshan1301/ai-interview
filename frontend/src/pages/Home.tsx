import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "../components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { BASE_API_URL } from "../config";

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (
        ![
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ].includes(selected.type)
      ) {
        toast.error("Only PDF or DOCX files are allowed");
        return;
      }
      setFile(selected);
      setUploadSuccess(false);
      toast.success(`Selected: ${selected.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      const res = await fetch(`${BASE_API_URL}/api/resume/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.missing && data.missing.length > 0) {
          const missingFields = data.missing.join(", ");
          toast.error(
            `Missing required fields: ${missingFields}. Please update your resume.`,
            { duration: 5000 }
          );
        } else {
          throw new Error(data.message || "Upload failed");
        }
        return;
      }

      toast.success("✅ Resume validated successfully!");
      setUploadSuccess(true);

      if (data.interviewId) {
        window.location.href = `/chatbox/${data.interviewId}`;
      }
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("❌ Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Toaster position="top-center" />

      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            AI Interview
          </h1>
          <p className="text-gray-600 text-lg">
            Let's get started with your resume
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                <FileText className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Upload Resume
              </CardTitle>
            </div>
            <CardDescription className="text-base text-gray-600 leading-relaxed">
              Upload your resume in{" "}
              <span className="font-semibold text-indigo-600">PDF</span> or{" "}
              <span className="font-semibold text-indigo-600">DOCX</span>{" "}
              format. We'll verify it contains your name, email, and phone
              number. (Under 1mb size)
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* File Upload Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select your resume
                </label>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all duration-200"
                  />
                </div>
                {file && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      {file.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-blue-900">
                      Required Information
                    </p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Your resume must include: Full Name, Email Address, and
                      Phone Number
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-6">
              <Button
                type="submit"
                disabled={loading || !file}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Validating Resume...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    <span>Upload & Validate</span>
                  </div>
                )}
              </Button>

              {uploadSuccess && (
                <div className="w-full text-center">
                  <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Redirecting to interview...
                  </p>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Your information is secure and will only be used for this interview
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
