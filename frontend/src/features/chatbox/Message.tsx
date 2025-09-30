import { HelpCircle, Sparkles, User, AlertCircle, Bot } from "lucide-react";

const Message = ({
  message,
  type,
  isUser,
  timestamp,
}: {
  message: string;
  isUser: boolean;
  type: string;
  status: string;
  timestamp: Date;
}) => {
  const getIcon = () => {
    if (isUser) return <User className="w-4 h-4" />;
    if (type === "question")
      return <HelpCircle className="w-4 h-4 text-blue-500" />;
    if (type === "suggestion")
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    if (type === "error")
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    return <Bot className="w-4 h-4" />;
  };

  return (
    <div
      className={`mb-4 ${isUser ? "flex justify-end" : "flex justify-start"}`}>
      <div
        className={`max-w-xs sm:max-w-sm md:max-w-md rounded-2xl px-4 py-3 shadow-sm ${
          isUser
            ? "bg-blue-600 text-white ml-auto"
            : "bg-gray-100 text-gray-900"
        }`}>
        <div className="flex items-start space-x-2">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          <div className="flex-1">
            <p className="text-sm leading-relaxed">{message}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs opacity-70">
                {timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
