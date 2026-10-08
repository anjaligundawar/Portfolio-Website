// The projects, shared by the Projects window (js/projects.js) and
// professional mode (js/pro.js).

export const PROJECTS = [
  {
    id: "dishavaani",
    name: "DishaVaani",
    summary: "A hands-free, location-aware audio guide that brings India's lesser-known heritage monuments to life using GPS, compass bearing, and RAG-powered LLMs. It delivers context-aware audio narratives in native languages via Bhashini and features an offline-capable ML recommendation engine for low-bandwidth travel suggestions over SMS/WhatsApp.",
    tech: ["Python", "RAG", "Open-Source LLMs", "Classical ML", "Bhashini API", "GPS/Geolocation"],
    repo: "https://github.com/medhakg205/DishaVaani",
  },
  {
    id: "breadcrumbs",
    name: "Breadcrumbs",
    summary: "An audio stress journal that locally transcribes daily voice entries, tracks stress trends over time, and generates detailed insights for matched therapists. Powered by fine-tuned DistilBERT and TF-IDF classifiers, it categorizes stressor severity across 8 domains while prioritizing complete user privacy.",
    tech: ["Python", "PyTorch", "HuggingFace Transformers", "scikit-learn", "Sentence-Transformers", "Pandas"],
    repo: "https://github.com/AnnaAngel040/Breadcrumbs-",
  },
  {
    id: "clueminati",
    name: "Clueminati 4.0 Game",
    summary: "An interactive mystery-solving and puzzle game built for the Clueminati 4.0 event hosted by CodeChef-VIT. Players solve clues and navigate custom interactive game mechanics to crack the mystery before time runs out.",
    tech: ["Godot Engine", "GDScript"],
    repo: "https://github.com/CodeChefVIT/GTA-12",
  },
  {
    id: "frog-maze",
    name: "Frog Maze Run",
    summary: "A 3D procedural maze exploration game built in Godot where players control a frog navigating dynamic pathways. Features custom lighting effects, firefly movement mechanics, and mystery orb power-ups to enhance gameplay.",
    tech: ["Godot Engine", "GDScript"],
    repo: "https://github.com/CodeChefVIT/go.gamedev",
  },
  {
    id: "last-light",
    name: "The Last Light",
    summary: "A 3D narrative adventure game centered around memory restoration triggered by interacting with environment objects. Built during a 36-hour hackathon sprint, it features custom scene setups and a dual-house teleportation mechanic.",
    tech: ["Unity", "C#", "Universal Render Pipeline (URP)"],
    repo: null, // private hackathon repo
  },
  {
    id: "sponsor-mail",
    name: "Sponsor Outreach Mail Sender",
    summary: "The frontend interface for an automated corporate sponsorship outreach platform designed for CodeChef-VIT. Streamlines event pitch communications, email drafting, and corporate sponsor outreach management across major campus events.",
    tech: ["React", "TypeScript", "Tailwind CSS", "HTML5"],
    repo: "https://github.com/CodeChefVIT/hello-kitty",
  },
];
