import { useSocketManager } from "./socketManager/useSocketManager";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const Timeleft = () => {
  const { timeLeft, status } = useSocketManager();
  const [loading, setLoading] = useState(true);

  // After 2s, stop showing spinner if still loading
  useEffect(() => {
    if (timeLeft != null) {
      setLoading(false);
    } else {
      const t = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(t);
    }
  }, [timeLeft]);

  // Case: loading
  if (loading) {
    return (
      <div className="text-sm mr-10 font-medium text-gray-400 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p>Loading timer…</p>
      </div>
    );
  }

  // If still null after loading → fallback message
  if (timeLeft == null) {
    return (
      <div className="text-sm mr-10 font-medium text-gray-400 flex items-center gap-2">
        <p>⏳ Waiting for timer data…</p>
      </div>
    );
  }

  // Case: completed
  if (status === "completed") {
    return (
      <div className="text-sm mr-10 font-medium text-green-600 flex items-center gap-2">
        ✅ Interview finished! Thank you 🎉
      </div>
    );
  }

  // Case: in progress but timer is zero
  if (status === "in_progress" && timeLeft === 0) {
    return (
      <div className="text-sm mr-10 font-medium text-blue-600 flex items-center gap-2">
        ⏳ Generating next question…
      </div>
    );
  }

  // Default countdown
  return (
    <div className="text-sm mr-10 font-medium text-gray-700 flex items-center gap-2">
      ⏱ Time Left for this question:{" "}
      <span className="font-semibold text-blue-600">{timeLeft}s</span>
    </div>
  );
};

export default Timeleft;
