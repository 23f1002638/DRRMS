import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Heart,
  MapPin,
  Users,
  Package,
  TrendingUp,
  Shield,
  Zap,
  BarChart3,
  Globe,
  UserPlus,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: Shield,
      title: 'Role-Based Access',
      description: 'Secure authentication system with specialized dashboards for Admins, Donors, Volunteers, and Victims.'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Power BI-inspired analytics with live data visualization for tracking donations, aid distribution, and impact metrics.'
    },
    {
      icon: MapPin,
      title: 'Geolocation Mapping',
      description: 'Interactive maps with geolocation features to track aid requests, resources, and volunteer assignments in real-time.'
    },
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Comprehensive tracking system for supplies, donations, and resource allocation with status indicators.'
    },
    {
      icon: Users,
      title: 'Volunteer Coordination',
      description: 'Efficiently assign and manage volunteer tasks with skill-based matching and availability tracking.'
    },
    {
      icon: Zap,
      title: 'Instant Aid Requests',
      description: 'Streamlined aid request forms with priority classification and automated routing to the right teams.'
    }
  ];

  const stats = [
    { value: '10K+', label: 'People Helped', icon: Heart },
    { value: '500+', label: 'Active Volunteers', icon: Users },
    { value: '$2M+', label: 'Aid Distributed', icon: TrendingUp },
    { value: '50+', label: 'Partner Organizations', icon: Globe }
  ];

  const userTypes = [
    {
      title: 'Disaster Victims',
      description: 'Request aid, track your requests, and access resources quickly when you need them most.',
      benefits: ['Submit aid requests', 'Track request status', 'Access emergency resources', 'Connect with volunteers']
    },
    {
      title: 'Donors',
      description: 'Make a difference by contributing resources and tracking the impact of your donations.',
      benefits: ['Make monetary donations', 'Track donation impact', 'View aid distribution', 'Receive tax documentation']
    },
    {
      title: 'Volunteers',
      description: 'Join the response team, get assigned tasks, and help communities in need.',
      benefits: ['View available tasks', 'Accept assignments', 'Track your impact', 'Coordinate with teams']
    },
    {
      title: 'Administrators',
      description: 'Manage the entire operation with comprehensive tools for coordination and oversight.',
      benefits: ['Manage all users', 'Coordinate resources', 'Analyze operations', 'Generate reports']
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-lg">DisasterRelief</span>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#who-we-serve" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Who We Serve
            </a>
            <ThemeToggle />
            <Button onClick={onGetStarted} size="sm">
              Sign In
            </Button>
          </nav>

          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <Button onClick={onGetStarted} size="sm">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-block">
                <span className="px-3 py-1 bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400 rounded-full text-sm font-medium">
                  Emergency Response Platform
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Coordinating Aid When It Matters Most
              </h1>

              <p className="text-lg text-muted-foreground">
                A comprehensive disaster relief management system connecting victims, donors, volunteers, and administrators
                to deliver rapid, coordinated emergency response and humanitarian aid.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={onGetStarted} size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="#how-it-works">Learn More</a>
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <stat.icon className="h-4 w-4" />
                      <p className="font-bold text-2xl">{stat.value}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1764684994219-8347a5ab0e5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXNhc3RlciUyMHJlbGllZiUyMGVtZXJnZW5jeSUyMHJlc3BvbnNlJTIwdGVhbXxlbnwxfHx8fDE3NzA2MDUwNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Disaster relief team in action"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-6 left-6 right-6 bg-card border border-border rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">24/7 Emergency Response</p>
                    <p className="text-sm text-muted-foreground">Always ready to help when disaster strikes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Effective Relief
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete toolkit designed to streamline disaster response operations and maximize impact.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:border-blue-600/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <div className="h-12 w-12 bg-blue-600/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Simple steps to get started and make an immediate impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl">
                  1
                </div>
                <h3 className="font-semibold text-xl">Create Your Account</h3>
                <p className="text-muted-foreground">
                  Sign up and select your role: Victim, Donor, Volunteer, or Admin. Get instant access to your personalized dashboard.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-[-50%] h-0.5 bg-border" />
            </div>

            <div className="relative">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl">
                  2
                </div>
                <h3 className="font-semibold text-xl">Take Action</h3>
                <p className="text-muted-foreground">
                  Request aid, make donations, volunteer for tasks, or coordinate resources based on your role and needs.
                </p>
              </div>
              <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-[-50%] h-0.5 bg-border" />
            </div>

            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white font-bold text-2xl">
                3
              </div>
              <h3 className="font-semibold text-xl">Track Impact</h3>
              <p className="text-muted-foreground">
                Monitor progress in real-time with live analytics, maps, and detailed reporting on aid distribution and outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve Section */}
      <section id="who-we-serve" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Everyone Involved in Relief
            </h2>
            <p className="text-lg text-muted-foreground">
              Specialized dashboards and tools tailored to each user's unique needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {userTypes.map((userType, index) => (
              <Card key={index} className="border-border hover:border-blue-600/50 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    {userType.title}
                  </CardTitle>
                  <CardDescription>{userType.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {userType.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1764738130382-cc7a8eaf26c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxodW1hbml0YXJpYW4lMjBhaWQlMjB2b2x1bnRlZXJzJTIwaGVscGluZ3xlbnwxfHx8fDE3NzA2MDUwNDZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Volunteers helping community"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-purple-900/90" />
            </div>

            <div className="relative z-10 text-center py-20 px-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Make a Difference?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of users who are making disaster relief more efficient, coordinated, and impactful.
              </p>
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-white text-blue-900 hover:bg-white/90 gap-2"
              >
                Get Started Now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-lg">DisasterRelief</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Coordinating emergency response and humanitarian aid for communities in need.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#who-we-serve" className="hover:text-foreground transition-colors">Who We Serve</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>&copy; 2026 DisasterRelief. Built with compassion for communities in need.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
