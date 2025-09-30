const Timeleft = ({ time }: { time: string | number }) => {
  return (
    <div className="text-sm mr-10 font-medium text-gray-700">
      <p>⏱ Server Time: {time}</p>
    </div>
  );
};

export default Timeleft;
