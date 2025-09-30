import { Wifi, WifiOff } from "lucide-react";

const ConnectionStatus = ({
  isConnected,
  isConnecting,
}: {
  isConnecting: boolean;
  isConnected: boolean;
}) => {
  if (isConnecting) {
    return (
      <div className="flex items-center space-x-1 text-yellow-500">
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-xs">Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-1 text-green-500">
        <Wifi className="w-3 h-3" />
        <span className="text-xs">Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 text-red-500">
      <WifiOff className="w-3 h-3" />
      <span className="text-xs">Disconnected</span>
    </div>
  );
};

export default ConnectionStatus;
