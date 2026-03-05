import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Twitter, Instagram, MessageSquare, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { language } = useLanguage();
  const t = translations[language].nav;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: t.features, href: "#features" },
    { name: t.pricing, href: "#pricing" },
    { name: t.faq, href: "#faq" },
    { name: language === 'ar' ? 'من نحن' : 'About', href: "#about" },
  ];

  return (
    <nav className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`w-full max-w-6xl h-24 rounded-full flex items-center justify-between px-10 pointer-events-auto transition-all duration-300 ${scrolled ? "glass-strong shadow-2xl scale-[1.02]" : "glass border-white/5"
          }`}
      >
        {/* Logo / Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="CryptoX Logo"
            className="h-20 w-auto group-hover:scale-105 transition-transform"
          />
        </Link>

        {/* Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right Side (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-semibold text-foreground hover:text-primary transition-colors ml-2">
            {t.login}
          </Link>
          <Link to="/signup">
            <Button size="sm" className="rounded-full bg-[#64CF7B] text-black font-bold hover:bg-[#00d8e6] hover:scale-105 transition-all glow-cyan px-6">
              {t.getStarted}
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-foreground p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-20 left-4 right-4 glass-strong rounded-3xl p-6 flex flex-col gap-4 pointer-events-auto shadow-2xl border-white/10"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-lg font-medium text-foreground py-2 border-b border-white/5"
              >
                {link.name}
              </a>
            ))}
            <div className="flex items-center gap-6 py-4 justify-center">
              <Twitter className="w-6 h-6 text-muted-foreground" />
              <Instagram className="w-6 h-6 text-muted-foreground" />
              <MessageSquare className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full text-foreground">{t.login}</Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full rounded-full bg-[#00f2ff] text-black font-bold">{t.getStarted}</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
