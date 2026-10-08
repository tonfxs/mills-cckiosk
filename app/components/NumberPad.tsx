"use client";

const NumberPad = ({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
}) => {
  const handleNumberClick = (num: string) => {
    if (value.length < maxLength) onChange(value + num);
  };

  const handleBackspace = () => onChange(value.slice(0, -1));
  const handleClear = () => onChange("");

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="text-3xl md:text-5xl font-bold text-center p-4 md:p-6 bg-gray-100 rounded-2xl border-4 border-gray-300 min-h-[70px] md:min-h-[100px] flex items-center justify-center text-black">
        {value.length > 0 ? "*".repeat(value.length) : "----"}
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="text-2xl md:text-4xl font-bold p-4 md:p-8 bg-white border-4 border-gray-300 rounded-2xl hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            {num}
          </button>
        ))}
        <button
          onClick={handleClear}
          className="text-xl md:text-3xl font-bold p-4 md:p-8 bg-red-100 border-4 border-red-300 rounded-2xl hover:bg-red-200 transition-all"
        >
          Clear
        </button>
        <button
          onClick={() => handleNumberClick("0")}
          className="text-2xl md:text-4xl font-bold p-4 md:p-8 bg-white border-4 border-gray-300 rounded-2xl hover:bg-blue-50 hover:border-blue-400 transition-all"
        >
          0
        </button>
        <button
          onClick={handleBackspace}
          className="text-xl md:text-3xl font-bold p-4 md:p-8 bg-yellow-100 border-4 border-yellow-300 rounded-2xl hover:bg-yellow-200 transition-all"
        >
          ←
        </button>
      </div>
    </div>
  );
};

export default NumberPad;