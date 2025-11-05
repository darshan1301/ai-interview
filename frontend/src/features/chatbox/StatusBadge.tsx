import { CheckCircle, PauseCircle, PlayCircle, Clock } from "lucide-react";
import { InterviewStatus } from "../../../../backend/src/utils/types";

const StatusBadge = ({ status }: { status: InterviewStatus }) => {
  const statusMap: Record<
    InterviewStatus,
    { label: string; color: string; icon: JSX.Element }
  > = {
    [InterviewStatus.READY]: {
      label: "Ready",
      color: "bg-blue-100 text-blue-700 border-blue-300",
      icon: <Clock className="w-4 h-4" />,
    },
    [InterviewStatus.PAUSE]: {
      label: "Paused",
      color: "bg-yellow-100 text-yellow-700 border-yellow-300",
      icon: <PauseCircle className="w-4 h-4" />,
    },
    [InterviewStatus.IN_PROGRESS]: {
      label: "In Progress",
      color: "bg-green-100 text-green-700 border-green-300",
      icon: <PlayCircle className="w-4 h-4" />,
    },
    [InterviewStatus.COMPLETED]: {
      label: "Completed",
      color: "bg-gray-100 text-gray-700 border-gray-300",
      icon: <CheckCircle className="w-4 h-4" />,
    },
  };

  const { label, color, icon } = statusMap[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
      {icon}
      {label}
    </span>
  );
};

export default StatusBadge;
