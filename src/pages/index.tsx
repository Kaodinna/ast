import React from "react";
import Head from "next/head";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Globe, Users } from "lucide-react";

export default function Home() {
  return (
    <>
      <Head>
        <title>Astra | Connecting People with Opportunities</title>
        <meta name="description" content="Bringing people and communities closer to government, corporate and NGO programs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-background min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section with Gradient Background */}
          <section className="relative min-h-[90vh] flex items-center overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <Image 
                src="https://assets.co.dev/62da0837-5dac-484c-b457-7465a689c8c3/alexander-andrews-fsh1kjbdje8-unsplash-dc37090.jpg"
                alt="Space background"
                fill
                style={{ objectFit: 'cover' }}
                priority
                className="opacity-30"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-cyan-900/40 pointer-events-none"></div>
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300">
                Connect with Opportunities
              </h1>
              <p className="text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl mx-auto">
                Bringing people and communities closer to government, corporate, and NGO programs through natural conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-0" asChild>
                  <Link href="/signup">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-purple-500/50 hover:bg-purple-500/10" asChild>
                  <Link href="/login">
                    Sign In
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                How Astra Works
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-background/50 backdrop-blur-sm border border-purple-500/20 overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
                  <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                  <CardContent className="pt-8">
                    <div className="mb-6 flex justify-center">
                      <div className="p-3 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors duration-300">
                        <Users className="h-8 w-8 text-purple-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-3">Natural Conversations</h3>
                    <p className="text-muted-foreground text-center">
                      Express your needs in your own words. No forms, just conversation.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 backdrop-blur-sm border border-blue-500/20 overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                  <CardContent className="pt-8">
                    <div className="mb-6 flex justify-center">
                      <div className="p-3 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors duration-300">
                        <Zap className="h-8 w-8 text-blue-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-3">Instant Matching</h3>
                    <p className="text-muted-foreground text-center">
                      Connect with programs from government, corporate, and NGO sectors that match your profile.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 backdrop-blur-sm border border-cyan-500/20 overflow-hidden group hover:border-cyan-500/50 transition-all duration-300">
                  <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 to-purple-500"></div>
                  <CardContent className="pt-8">
                    <div className="mb-6 flex justify-center">
                      <div className="p-3 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors duration-300">
                        <Globe className="h-8 w-8 text-cyan-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-3">Continuous Support</h3>
                    <p className="text-muted-foreground text-center">
                      Get guidance throughout your journey with AI and human assistance.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Mission Statement */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute inset-0 pointer-events-none">
              <Image 
                src="https://assets.co.dev/62da0837-5dac-484c-b457-7465a689c8c3/nasa-q1p7bh3shj8-unsplash-4eea344.jpg"
                alt="Space background"
                fill
                style={{ objectFit: 'cover' }}
                className="opacity-20"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-cyan-900/30 pointer-events-none"></div>
            <div className="max-w-4xl mx-auto text-center relative">
              <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Our Mission
              </h2>
              <p className="text-xl text-foreground/80 leading-relaxed">
                We're building a bridge between people and opportunities. By removing barriers and simplifying access to programs, 
                we help communities thrive and individuals reach their full potential.
              </p>
            </div>
          </section>

          {/* Who is Astra For Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute inset-0 pointer-events-none">
              <Image 
                src="https://assets.co.dev/62da0837-5dac-484c-b457-7465a689c8c3/nasa-q1p7bh3shj8-unsplash-4eea344.jpg"
                alt="Space background"
                fill
                style={{ objectFit: 'cover' }}
                className="opacity-20"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-cyan-900/30 pointer-events-none"></div>
            <div className="max-w-6xl mx-auto relative">
              <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Who is Astra For?
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-background/50 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold text-center">Individuals</h3>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 backdrop-blur-sm border border-blue-500/20 overflow-hidden">
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold text-center">Communities</h3>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 backdrop-blur-sm border border-cyan-500/20 overflow-hidden">
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold text-center">Organizations</h3>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Program Types Section */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute inset-0 pointer-events-none">
              <Image 
                src="https://assets.co.dev/62da0837-5dac-484c-b457-7465a689c8c3/nasa-q1p7bh3shj8-unsplash-4eea344.jpg"
                alt="Space background"
                fill
                style={{ objectFit: 'cover' }}
                className="opacity-20"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-cyan-900/30 pointer-events-none"></div>
            <div className="max-w-6xl mx-auto relative">
              <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                Program Types
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="bg-background/50 backdrop-blur-sm border border-purple-500/20 overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-blue-500"></div>
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold text-center mb-4">Government Programs</h3>
                    <p className="text-muted-foreground text-center">
                      Public services, grants, subsidies, and assistance programs offered by local, state, and federal agencies.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 backdrop-blur-sm border border-blue-500/20 overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-cyan-400"></div>
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold text-center mb-4">Corporate Initiatives</h3>
                    <p className="text-muted-foreground text-center">
                      Scholarships, training programs, internships, and CSR initiatives from businesses and corporations.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 backdrop-blur-sm border border-cyan-500/20 overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400 to-purple-500"></div>
                  <CardContent className="pt-8">
                    <h3 className="text-xl font-semibold text-center mb-4">NGO Support</h3>
                    <p className="text-muted-foreground text-center">
                      Community services, humanitarian aid, educational resources, and development programs from non-profit organizations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Powered By Section */}
          <section className="py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-semibold text-center mb-10 text-foreground/80">
                Powered By
              </h2>
              <div className="flex justify-center items-center min-h-[160px]">
                <div className="h-20 relative">
                  <Image 
                    src="https://assets.co.dev/62da0837-5dac-484c-b457-7465a689c8c3/coact-white-dd466a1.png"
                    alt="Coact"
                    width={200}
                    height={80}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          </section>
        </main>
        
        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-foreground/10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Astra. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Terms
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}