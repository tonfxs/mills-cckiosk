// "use client";
// import Image from "next/image";
// import { useRouter } from "next/navigation";

// export default function ChooseService() {
//     const router = useRouter();
//   return (
//     <main className="flex flex-col items-center justify-between w-full h-screen bg-white px-6 py-10">
//       {/* Logo Section */}
//       <header className="flex flex-col items-center gap-6">
//         {/* Mills Brands */}
//         <Image
//           src="/images/Mills Brand/Mills Brand_logo (registered)-01.png"
//           alt="Mills Brands logo"
//           width={550}
//           height={200}
//           priority
//            onClick={() => router.push("/")}
//         />

//         {/* Partner Logos */}
//         <div className="flex items-center justify-center gap-8">
//           <Image
//             src="/images/edisons/edisons-logo Black.svg"
//             alt="Edisons logo"
//             width={400}
//             height={40}
//             className="object-contain"
//           />
//           <Image
//             src="/images/mytopia/mytopia-logo-black.svg"
//             alt="Mytopia logo"
//             width={400}
//             height={40}
//             className="object-contain"
//           />
//         </div>
//       </header>

//       {/* Service Buttons */}
//       <section className="flex flex-col items-center justify-center flex-1 w-full  gap-5">
//         <h2 className="text-7xl font-semibold text-gray-800 mb-4">
//           Choose Service
//         </h2>

//         {/* <button className="w-full max-w-md py-4 text-white text-lg font-semibold rounded-xl bg-gradient-to-r from-[#0070C9] to-[#004E9A] shadow-md hover:opacity-90 transition">
//           Shop Products
//         </button> */}

//         <button className=" py-20 w-full max-w-4xl py-4 text-white text-7xl font-semibold rounded-xl bg-gradient-to-r from-[#0070C9] to-[#004E9A] shadow-md hover:opacity-90 transition">
//           Pick Up Order
//         </button>

//         <button className="py-20 w-full max-w-4xl py-4 text-white text-7xl font-semibold rounded-xl bg-gradient-to-r from-[#0070C9] to-[#004E9A] shadow-md hover:opacity-90 transition">
//           Return a Product
//         </button>

//         {/* <button className="w-full max-w-md py-4 text-white text-lg font-semibold rounded-xl bg-gradient-to-r from-[#0070C9] to-[#004E9A] shadow-md hover:opacity-90 transition">
//           Connect to a Live Agent
//         </button> */}
//       </section>
//     </main>
//   );
// }

"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ChooseService() {
  const router = useRouter();

  const handleConnectToAgent = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent navigation
    window.dispatchEvent(new Event("open-doxy")); // 👈 trigger FloatingDoxy
  };

  const baseButton =
    "w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl py-8 sm:py-12 md:py-14 text-xl sm:text-3xl md:text-4xl lg:text-6xl text-white font-semibold rounded-2xl bg-gradient-to-r from-[#0070C9] to-[#004E9A] shadow-lg hover:opacity-90 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all";


  return (
    <main className="flex flex-col items-center justify-between w-full min-h-screen bg-white px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
      {/* Logo Section */}
      <header className="flex flex-col items-center gap-4 sm:gap-6">
        {/* Mills Brands Logo */}
        <Image
          src="/images/Mills Brand/Mills Brand_logo (registered)-01.png"
          alt="Mills Brands logo"
          width={550}
          height={200}
          className="w-[200px] sm:w-[350px] md:w-[450px] lg:w-[550px] h-auto cursor-pointer"
          priority
          onClick={() => router.push("/")}
        />

        {/* Partner Logos */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <Image
            src="/images/edisons/edisons-logo Black.svg"
            alt="Edisons logo"
            width={400}
            height={40}
            className="w-[150px] sm:w-[200px] md:w-[250px] lg:w-[400px] h-auto object-contain"
          />
          <Image
            src="/images/mytopia/mytopia-logo-black.svg"
            alt="Mytopia logo"
            width={400}
            height={40}
            className="w-[150px] sm:w-[200px] md:w-[250px] lg:w-[400px] h-auto object-contain"
          />
        </div>
      </header>

      {/* Service Buttons */}
      {/* <section className="flex flex-col items-center justify-center flex-1 w-full gap-4 sm:gap-6 mt-6 sm:mt-10 text-center">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-800 mb-4 text-center">
          Choose Service
        </h2>

        <a
          href="/pick-up-order"
          className="w-full max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-4xl py-10 sm:py-14 md:py-16 text-2xl sm:text-4xl md:text-5xl lg:text-7xl text-white font-semibold rounded-xl bg-gradient-to-r from-[#0070C9] to-[#004E9A] shadow-md hover:opacity-90 transition"
        >
          Pick Up Order
        </a>

        <a
          href="/return-a-product"
          className="w-full max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-4xl py-10 sm:py-14 md:py-16 text-2xl sm:text-4xl md:text-5xl lg:text-7xl text-white font-semibold rounded-xl bg-gradient-to-r from-[#0070C9] to-[#004E9A] shadow-md hover:opacity-90 transition"
        >
          Return a Product
        </a>

        <a
          href="#"
          onClick={handleConnectToAgent}
          className="w-full max-w-xs sm:max-w-xl md:max-w-2xl lg:max-w-4xl py-10 sm:py-14 md:py-16 text-2xl sm:text-4xl md:text-5xl lg:text-7xl text-white font-semibold rounded-xl bg-gradient-to-r from-[#0070C9] to-[#004E9A] shadow-md hover:opacity-90 transition"
        >
          Connect to a Live Agent
        </a>
      </section> */}

      <section className="flex flex-col items-center justify-center flex-1 w-full gap-5 sm:gap-8 mt-6 sm:mt-10 text-center px-4">
        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-gray-800 mb-4">
          Choose Service
        </h2>

        <Link href="/pick-up-order" className={baseButton}>
          Pick Up Order
        </Link>

        <Link href="/return-a-product" className={baseButton}>
          Return a Product
        </Link>

        <button
          onClick={handleConnectToAgent}
          className={baseButton}
          type="button"
        >
          Connect to a Live Agent
        </button>
      </section>
    </main>
  );
}

