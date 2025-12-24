// app/car-park/page.tsx
"use client";

export default function CarPark() {
  return (
    <div className="w-full h-screen bg-gray-200 flex justify-center items-start p-10">
      {/* Road/Outer Area */}
      <div className="relative w-[800px] h-[600px] bg-gray-300 border border-gray-400">
        
        {/* Parking Area */}
        <div className="absolute top-10 left-10 w-[400px] h-[200px] flex flex-col justify-between">
          {/* Rows of parking bays */}
          {Array.from({ length: 4 }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex justify-between">
              {Array.from({ length: 5 }).map((_, colIdx) => (
                <div
                  key={colIdx}
                  className="w-16 h-28 bg-red-400 border border-white transform rotate-[-20deg]"
                ></div>
              ))}
            </div>
          ))}
        </div>

        {/* Green Divider */}
        <div className="absolute top-220 left-50 w-[300px] h-8 bg-green-500 rounded-full"></div>

        {/* Main Building */}
        <div className="absolute top-250 left-400 w-[250px] h-[200px] bg-gray-500 border border-gray-700 rounded-lg flex justify-center items-center">
          {/* Solar Panels */}
          <div className="w-32 h-32 bg-blue-600 grid grid-cols-2 gap-2 p-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-gray-900"></div>
            ))}
          </div>
        </div>

        {/* Additional Small Parking Bays */}
        <div className="absolute top-500 left-100 w-[300px] h-[80px] flex justify-between items-center">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="w-16 h-28 bg-red-400 border border-white"></div>
          ))}
        </div>

      </div>
    </div>
  );
}
