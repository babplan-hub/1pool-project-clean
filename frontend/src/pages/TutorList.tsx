import { useState } from "react";

const TutorList = () => {
  const [category, setCategory] = useState("Rules");

  const videos = [
    // RULES
    {
      title: "Official 8 Ball Pool Rules",
      category: "Rules",
      link: "https://www.youtube.com/watch?v=9Hk3d7s6R3Q",
    },
    {
      title: "Snooker Rules Explained",
      category: "Rules",
      link: "https://www.youtube.com/watch?v=YkWk1vYb8oQ",
    },
    {
      title: "How to Rack 8 Ball Properly",
      category: "Rules",
      link: "https://www.youtube.com/watch?v=EDY5nK1Y3xE",
    },

    // BASIC
    {
      title: "How to Hold a Pool Cue Correctly",
      category: "Basic",
      link: "https://www.youtube.com/watch?v=Fh3lQb4lF1M",
    },
    {
      title: "Beginner Pool Lesson",
      category: "Basic",
      link: "https://www.youtube.com/watch?v=4nP4C1d3zAg",
    },
    {
      title: "Basic Aiming Technique",
      category: "Basic",
      link: "https://www.youtube.com/watch?v=5bXKzWl3J2E",
    },
    {
      title: "Bridge Hand Technique",
      category: "Basic",
      link: "https://www.youtube.com/watch?v=7p3sV4c9b2Q",
    },

    // TECHNIQUE
    {
      title: "Spin Control Tutorial",
      category: "Technique",
      link: "https://www.youtube.com/watch?v=Kzj4v7d9n5A",
    },
    {
      title: "Draw Shot Masterclass",
      category: "Technique",
      link: "https://www.youtube.com/watch?v=6Lk3b9v2P8M",
    },
    {
      title: "Advanced Position Play",
      category: "Technique",
      link: "https://www.youtube.com/watch?v=3gHj4d9p1KQ",
    },
    {
      title: "Cue Ball Control Secrets",
      category: "Technique",
      link: "https://www.youtube.com/watch?v=2fKj9d3L0P8",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white px-6 py-24">
      <div className="max-w-6xl mx-auto">

        <h2 className="text-3xl mb-12 font-semibold">
          Billiard Tutorials
        </h2>

        {/* CATEGORY NAV */}
        <div className="flex gap-8 mb-10">
          {["Rules", "Basic", "Technique"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`pb-1 border-b-2 transition ${
                category === cat
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* VIDEO LIST */}
        <div className="grid md:grid-cols-2 gap-6">
          {videos
            .filter((v) => v.category === category)
            .map((video, index) => (
              <a
                key={index}
                href={video.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition block"
              >
                <p className="text-lg">{video.title}</p>
                <p className="text-blue-400 text-sm mt-2">
                  Watch on YouTube →
                </p>
              </a>
            ))}
        </div>

      </div>
    </div>
  );
};

export default TutorList;