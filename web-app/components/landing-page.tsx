"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  MessageSquare,
  Brain,
  Zap,
  Upload,
  Search,
  ArrowRight,
  Star,
  Users,
  Shield,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const features = [
    {
      icon: <Upload className="h-8 w-8" />,
      title: "Smart Document Upload",
      description:
        "Upload PDFs and documents with drag-and-drop simplicity. Our AI instantly processes and understands your content.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <MessageSquare className="h-8 w-8" />,
      title: "Intelligent Chat",
      description:
        "Have natural conversations with your documents. Ask questions, get summaries, and extract insights effortlessly.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Analysis",
      description:
        "Advanced AI comprehends context, provides accurate answers, and helps you understand complex documents.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: <Search className="h-8 w-8" />,
      title: "Instant Search",
      description:
        "Find information across all your documents instantly. No more manual searching through pages of content.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Secure & Private",
      description:
        "Your documents are encrypted and secure. We prioritize privacy and never share your data.",
      color: "from-indigo-500 to-blue-500",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description:
        "Get answers in seconds, not minutes. Our optimized AI delivers rapid responses to your queries.",
      color: "from-yellow-500 to-orange-500",
    },
  ];

  const stats = [
    {
      number: "AI-Powered",
      label: "Document Intelligence",
      color: "from-purple-500 to-pink-500",
    },
    {
      number: "Secure",
      label: "Privacy First",
      color: "from-green-500 to-emerald-500",
    },
    {
      number: "Fast",
      label: "Instant Results",
      color: "from-blue-500 to-cyan-500",
    },
    {
      number: "Smart",
      label: "Context Aware",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/95 backdrop-blur-md border-b border-slate-700/50 shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2"
            >
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-violet-600 rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                CookbookLM
              </span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-slate-300 hover:text-blue-400 hover:bg-slate-800/50"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  Sign Up
                </Button>
              </Link>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-slate-300 hover:bg-slate-800/50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4 border-t border-slate-700/50 pt-4"
            >
              <div className="flex flex-col space-y-4">
                <Link
                  href="#features"
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Features
                </Link>
                <Link
                  href="#testimonials"
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Testimonials
                </Link>
                <Link
                  href="#pricing"
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Pricing
                </Link>
                <Separator className="bg-slate-700/50" />
                <div className="flex flex-col space-y-2">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-300 hover:bg-slate-800/50"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Badge
              variant="secondary"
              className="mb-6 px-4 py-2 text-sm font-medium bg-slate-800/60 border border-slate-700/50 text-blue-400"
            >
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              AI-Powered Document Intelligence
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-200 via-blue-300 to-violet-400 bg-clip-text text-transparent leading-tight">
              Chat with Your
              <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                {" "}
                Documents
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform any PDF or document into an intelligent conversation.
              Upload, ask questions, and get instant insights powered by
              advanced AI.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Try Now - It&apos;s Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-2 border-slate-600/50 text-slate-300 hover:bg-slate-800/50 hover:border-blue-500/50 transition-all duration-300"
              >
                Watch Demo
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-2xl blur-3xl transform scale-105"></div>
              <Card className="relative overflow-hidden border-2 border-slate-700/50 shadow-2xl shadow-blue-500/10 bg-slate-900/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 space-y-4 shadow-inner">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Research_Paper_2024.pdf uploaded
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            What are the main findings of this research?
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center">
                          <Brain className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Based on the research paper, the main findings
                            include...
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div
                              className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-violet-100 via-purple-50 to-pink-100 dark:from-violet-900/20 dark:via-purple-900/20 dark:to-pink-900/20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <div
                  className={`text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                >
                  {stat.number}
                </div>
                <div className="text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge
              variant="secondary"
              className="mb-4 bg-slate-800/60 border border-slate-700/50 text-blue-400"
            >
              <Zap className="h-4 w-4 mr-2 text-blue-500" />
              Powerful Features
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Everything you need to work
              <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                {" "}
                smarter
              </span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Unlock the full potential of your documents with our comprehensive
              suite of AI-powered tools
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full border-2 border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 group bg-slate-900/60 backdrop-blur-sm">
                  <CardHeader>
                    <div
                      className={`mb-4 p-3 rounded-lg bg-gradient-to-r ${feature.color} group-hover:scale-110 transition-transform duration-300 w-fit`}
                    >
                      <div className="text-white">{feature.icon}</div>
                    </div>
                    <CardTitle className="text-xl text-white">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed text-slate-300">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-r from-slate-900/50 via-slate-800/50 to-slate-900/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Ready to transform your
              <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                {" "}
                document workflow?
              </span>
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have revolutionized how they
              work with documents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="border-t border-violet-200 dark:border-violet-700 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="h-8 w-8 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                CookbookLM
              </span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-slate-600 dark:text-slate-300">
              <Link href="#" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Test It !! Its Free</Link>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default LandingPage;
