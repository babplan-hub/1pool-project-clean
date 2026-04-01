import { useState } from "react";

const TutorList = () => {
  const [category, setCategory] = useState("Rules");

  const videos = [
    // RULES
    {
      title: "Official 8 Ball Pool Rules",
      category: "Rules",
      link: "https://youtu.be/0vvdEBZs8B8?si=eQgVmv6TQoAESMJb",
    },
    {
      title: "Snooker Rules Explained",
      category: "Rules",
      link: "https://youtu.be/UkoVN59NJ4g?si=pQ9cg6DiRk3NO_lx",
    },
    {
      title: "How to Rack 8 Ball Properly",
      category: "Rules",
      link: "https://youtu.be/7n_H-B5ffYM?si=Und_4JAbPcrDcTOS",
    },

    // BASIC
    {
      title: "How to Hold a Pool Cue Correctly",
      category: "Basic",
      link: "https://www.youtube.com/watch?v=5wNbgWxavbQ",
    },
    {
      title: "Beginner Pool Lesson",
      category: "Basic",
      link: "https://youtu.be/T_R9lqtdN74?si=TbVVhNEIAew8G2N8",
    },
    {
      title: "Basic Aiming Technique",
      category: "Basic",
      link: "https://youtu.be/6s7r9rWqqE4?si=FITJgzrFsfYDwB4B",
    },
    {
      title: "Bridge Hand Technique",
      category: "Basic",
      link: "https://youtu.be/WG-FgyXs0b4?si=IJDKBc-SLA1MrRY1",
    },

    // TECHNIQUE
    {
      title: "Spin Control Tutorial",
      category: "Technique",
      link: "https://youtu.be/PgI7pl1itMw?si=KQ6YIdrEeiOhHK-4",
    },
    {
      title: "Draw Shot Masterclass",
      category: "Technique",
      link: "https://youtu.be/UVJ3GpzZlLo?si=aaxqG70Q_BtsDgxU",
    },
    {
      title: "Advanced Position Play",
      category: "Technique",
      link: "https://youtu.be/zAaJdKFDEXE?si=YuC5v0rrKP6JoYaP",
    },
    {
      title: "Cue Ball Control Secrets",
      category: "Technique",
      link: "https://youtu.be/JCIivQPsvQk?si=y8xCeIBxv0cIvUGL",
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