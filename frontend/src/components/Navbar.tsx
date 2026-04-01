import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  
  const location = useLocation();

  const menus = [
    { name: "Tables", path: "/" },
    { name: "Foods", path: "/food" },
    { name: "Tutorial", path: "/tutorlist" },
    { name: "Contact", path: "/contact" },
    { name: "History", path: "/history" },
  ];

  return (
    <nav className="absolute top-0 w-full z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

        {/* 🔥 LOGO */}
        <Link to="/">
          <img
            src="/logo.png"
            alt="1POOL Logo"
            className="h-8 object-contain"
          />
        </Link>

        <div className="flex gap-8 text-sm">
          {menus.map((menu) => {
            const active = location.pathname === menu.path;
            return (
              <Link
                key={menu.name}
                to={menu.path}
                className={`transition ${
                  active
                    ? "text-blue-400"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {menu.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;