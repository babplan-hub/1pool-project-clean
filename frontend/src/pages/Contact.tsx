import { useNavigate } from "react-router-dom";

const Contact = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white">

      {/* HERO */}
      <div className="relative h-[50vh] flex items-center justify-center text-center">

        <img
          src="/hero.jpg"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />

        <div className="absolute inset-0 bg-linear-to-b from-black/70 to-[#0b0f19]" />

        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            CONTACT
          </h1>
          <p className="text-white/60">
            Get in touch with 1POOL
          </p>
        </div>

      </div>

      {/* INFO CARDS */}
      <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8">

        {/* PHONE */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
          <h3 className="text-lg mb-3 text-white/70">📞 Phone</h3>
          <a href="tel:0999999999" className="text-blue-400 text-xl hover:underline">
            099-999-9999
          </a>
          <p className="text-white/40 text-sm mt-2">
            Open daily 10:00 - 02:00
          </p>
        </div>

        {/* LOCATION */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
          <h3 className="text-lg mb-3 text-white/70">📍 Location</h3>
          <p className="text-white/80">
            Sukhumvit, Bangkok Thailand
          </p>
          <a
            href="https://maps.google.com/?q=Sukhumvit+Bangkok"
            target="_blank"
            className="text-blue-400 text-sm mt-2 block"
          >
            Open Google Maps →
          </a>
        </div>

        {/* SOCIAL */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
          <h3 className="text-lg mb-3 text-white/70">🌐 Social</h3>

          <div className="flex flex-col gap-2">
            <a href="#" className="hover:text-green-400">LINE</a>
            <a href="#" className="hover:text-pink-400">Instagram</a>
            <a href="#" className="hover:text-blue-400">Facebook</a>
          </div>
        </div>

      </div>

      {/* MAP */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-2xl overflow-hidden border border-white/10">

          <iframe
            src="https://maps.google.com/maps?q=Sukhumvit%20Bangkok&t=&z=13&ie=UTF8&iwloc=&output=embed"
            className="w-full h-100"
            loading="lazy"
          />

        </div>
      </div>

      {/* BACK */}
      <div className="text-center pb-20">
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 bg-blue-600 rounded-xl hover:bg-blue-700 transition"
        >
          Back Home
        </button>
      </div>

    </div>
  );
};

export default Contact;