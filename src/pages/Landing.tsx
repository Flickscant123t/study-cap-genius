import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  GraduationCap, 
  Sparkles, 
  Brain, 
  Target, 
  CheckCircle, 
  Star,
  Zap,
  BookOpen,
  Trophy,
  ArrowRight,
  Crown
} from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">StudyCap</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button variant="hero" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-secondary-foreground">AI-Powered Learning Assistant</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 animate-fade-in-up">
            Study Smarter With{" "}
            <span className="text-gradient">StudyCap</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Your AI-powered study partner that helps you learn faster, understand deeper, and achieve more.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Button size="xl" variant="hero" onClick={() => navigate('/auth')} className="group">
              Start Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="xl" variant="heroOutline" onClick={() => navigate('/auth?upgrade=true')}>
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
            ✨ 15 free questions per day • No credit card required
          </p>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 px-6 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground">Free forever, or unlock unlimited potential</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <Card className="p-8 shadow-card hover:shadow-hover transition-shadow">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
                  <Zap className="w-4 h-4" />
                  Free
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/forever</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>15 questions per day</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Basic explanations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Simple summaries</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Light brainstorming</span>
                </li>
              </ul>

              <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/auth')}>
                Get Started Free
              </Button>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 shadow-card hover:shadow-hover transition-shadow relative overflow-hidden border-2 border-primary">
              <div className="absolute top-0 right-0 gradient-accent text-accent-foreground px-4 py-1 text-sm font-semibold rounded-bl-lg">
                POPULAR
              </div>
              
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full gradient-primary text-primary-foreground text-sm font-medium mb-4">
                  <Crown className="w-4 h-4" />
                  Premium
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$2.50</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="font-medium">Unlimited questions</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Advanced reasoning & analysis</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Long-form essays & study guides</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Flashcard generation</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span>Priority response quality</span>
                </li>
              </ul>

              <Button variant="accent" size="lg" className="w-full" onClick={() => navigate('/auth?upgrade=true')}>
                Upgrade to Premium
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Three simple steps to academic success</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 animate-float">
                <BookOpen className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Ask</h3>
              <p className="text-muted-foreground">Ask any question about your studies. From math problems to essay help.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-6 animate-float" style={{ animationDelay: '0.5s' }}>
                <Brain className="w-8 h-8 text-accent-foreground" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Learn</h3>
              <p className="text-muted-foreground">Get personalized explanations tailored to your learning style.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 animate-float" style={{ animationDelay: '1s' }}>
                <Trophy className="w-8 h-8 text-primary-foreground" />
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Succeed</h3>
              <p className="text-muted-foreground">Ace your exams with confidence and deep understanding.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by Students</h2>
            <p className="text-lg text-muted-foreground">Join thousands of students improving their grades</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah K.", major: "Biology Major", quote: "StudyCap helped me understand complex biochemistry concepts I'd been struggling with for weeks.", stars: 5 },
              { name: "Marcus T.", major: "Engineering Student", quote: "The explanations are so clear! It's like having a tutor available 24/7.", stars: 5 },
              { name: "Emily R.", major: "Pre-Med Student", quote: "Premium is worth every penny. The advanced reasoning helped me ace my MCAT prep.", stars: 5 },
            ].map((testimonial, i) => (
              <Card key={i} className="p-6 shadow-card">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.stars }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground mb-4">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.major}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Study Smarter?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join thousands of students who've transformed their learning experience.</p>
          <Button size="xl" variant="hero" onClick={() => navigate('/auth')} className="group">
            Start Learning Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">StudyCap</span>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">About</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 StudyCap. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
