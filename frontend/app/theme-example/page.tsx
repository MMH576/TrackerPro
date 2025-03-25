import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Light Theme Example",
  description: "A clean, minimal UI example using Light theme in DaisyUI",
};

export default function ThemeExamplePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <header className="flex justify-between items-center py-4 border-b border-border/40">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Habit Tracker Pro</h1>
          <p className="text-sm text-muted-foreground">Light Theme Example</p>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="outline" size="sm">Sign In</Button>
          <Button size="sm">Get Started</Button>
        </div>
      </header>

      <main className="space-y-8">
        <section className="py-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <Badge variant="outline" className="px-3 py-1 text-xs font-medium">✨ Light Theme</Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Track your habits with a clean, minimal interface
            </h2>
            <p className="text-lg text-muted-foreground">
              A beautiful UI design using soft colors, light shadows, and subtle borders for maximum readability.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Button size="lg">
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <section className="py-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>
                </div>
                <CardTitle>Habit Tracking</CardTitle>
                <CardDescription>Track your daily habits with ease</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Set up your daily, weekly, or monthly habits and track them consistently with our intuitive interface.</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="gap-1">
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary"><path d="M12 20v-6M6 20V10M18 20V4"/></svg>
                </div>
                <CardTitle>Insightful Analytics</CardTitle>
                <CardDescription>Visualize your progress</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Get detailed insights with beautiful charts and stats to help you understand your habits better.</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="gap-1">
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                </div>
                <CardTitle>Smart Reminders</CardTitle>
                <CardDescription>Never miss your habits</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Get timely notifications and reminders to help you stay on track with your habit goals.</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm" className="gap-1">
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="py-8">
          <div className="max-w-3xl mx-auto">
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="daily">Daily View</TabsTrigger>
                <TabsTrigger value="weekly">Weekly View</TabsTrigger>
                <TabsTrigger value="monthly">Monthly View</TabsTrigger>
              </TabsList>
              <TabsContent value="daily" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Habits</CardTitle>
                    <CardDescription>Your habits for today, March 25, 2024</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['Morning Exercise', 'Read for 30 minutes', 'Drink 8 glasses of water', 'Meditate'].map((habit, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/60">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
                              {i < 2 && <div className="w-3 h-3 rounded-full bg-primary"></div>}
                            </div>
                            <span>{habit}</span>
                          </div>
                          <Badge variant={i < 2 ? "secondary" : "outline"}>
                            {i < 2 ? "Completed" : "Pending"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="weekly" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Progress</CardTitle>
                    <CardDescription>Your habit completion for this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end h-40 pt-6">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div 
                            className="w-8 bg-primary/20 rounded-t-md" 
                            style={{ 
                              height: `${(i === 3 || i === 6) ? 30 : (i < 3 ? 80 + i * 20 : 60 - (i-3) * 15)}px`,
                              backgroundColor: i < 3 ? 'hsl(var(--primary) / 0.2)' : 'hsl(var(--muted) / 0.3)'
                            }}
                          ></div>
                          <span className="text-xs">{day}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="monthly" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Overview</CardTitle>
                    <CardDescription>Your habit streak for March 2024</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({length: 31}, (_, i) => (
                        <div 
                          key={i} 
                          className={`w-full aspect-square rounded-md flex items-center justify-center text-xs ${
                            i < 25 
                              ? (i % 4 === 0 ? 'bg-accent/20' : i % 3 === 0 ? 'bg-secondary/20' : 'bg-primary/20')
                              : 'bg-muted'
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t border-border/40 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2024 Habit Tracker Pro. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
            <Link href="/settings/appearance" className="text-sm text-muted-foreground hover:text-foreground">Themes</Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 