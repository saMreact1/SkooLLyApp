import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  avatar: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  cta: string;
}

interface FaqItem {
  q: string;
  a: string;
  open: boolean;
}

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
  protected readonly mobileMenuOpen = signal(false);

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  protected readonly features: Feature[] = [
    {
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      title: 'Role-based dashboards',
      description: 'Tailored views for administrators, teachers, students and parents — everyone sees what they need.',
    },
    {
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      title: 'Attendance & results',
      description: 'Track attendance in real time and publish results seamlessly with automated report cards.',
    },
    {
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      title: 'Fees & payments',
      description: 'Manage tuition, track payments, send reminders and generate receipts — all in one place.',
    },
    {
      icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
      title: 'Communication hub',
      description: 'Send announcements, broadcast messages and facilitate parent-teacher messaging in real time.',
    },
    {
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      title: 'Timetable management',
      description: 'Design class schedules, avoid conflicts and publish timetables accessible to everyone.',
    },
    {
      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
      title: 'Secure & scalable',
      description: 'Enterprise-grade security with role-based access control. Scales from small schools to large districts.',
    },
  ];

  protected readonly steps: Step[] = [
    {
      number: '01',
      title: 'Create your school profile',
      description: 'Sign up and set up your school in minutes. Add your logo, term dates and basic information.',
    },
    {
      number: '02',
      title: 'Import staff & students',
      description: 'Add teachers and students manually or bulk-import from spreadsheets. Assign classes and subjects.',
    },
    {
      number: '03',
      title: 'Go live & manage',
      description: 'Start taking attendance, publishing results, collecting fees and communicating with parents.',
    },
  ];

  protected readonly testimonials: Testimonial[] = [
    {
      quote: 'skooLLy transformed how we manage our school. Attendance tracking alone saved us hours every week.',
      name: 'Dr. Amina Bello',
      role: 'Principal, Greensprings School',
      avatar: 'AB',
    },
    {
      quote: 'The parent communication feature bridged the gap between school and home. Our parent engagement has never been higher.',
      name: 'Mr. Chidi Okonkwo',
      role: 'Head of Administration, Bristow Schools',
      avatar: 'CO',
    },
    {
      quote: 'Setting up exams and publishing results used to take days. Now it takes minutes with skooLLy.',
      name: 'Mrs. Funmi Adeyemi',
      role: 'Vice Principal, Excel College',
      avatar: 'FA',
    },
  ];

  protected readonly plans: Plan[] = [
    {
      name: 'Starter',
      price: '₦0',
      period: 'forever',
      description: 'Perfect for small schools exploring digital management.',
      features: [
        'Up to 100 students',
        'Basic attendance tracking',
        'Single admin account',
        'Email support',
      ],
      popular: false,
      cta: 'Get started',
    },
    {
      name: 'Professional',
      price: '₦49,999',
      period: '/term',
      description: 'Ideal for growing schools that need the full toolkit.',
      features: [
        'Up to 500 students',
        'Advanced attendance & results',
        'Fee management & receipts',
        'Timetable scheduling',
        'Parent-teacher messaging',
        'Priority support',
      ],
      popular: true,
      cta: 'Start free trial',
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large school districts with advanced requirements.',
      features: [
        'Unlimited students',
        'All Professional features',
        'Custom integrations',
        'Dedicated account manager',
        'SLA & 24/7 support',
        'On-premise option',
      ],
      popular: false,
      cta: 'Contact sales',
    },
  ];

  protected readonly faqs: FaqItem[] = [
    {
      q: 'How long does it take to set up my school?',
      a: 'Most schools are fully set up within an hour. Importing student and staff data from spreadsheets takes just a few minutes.',
      open: false,
    },
    {
      q: 'Can I try skooLLy before committing?',
      a: 'Absolutely. We offer a 14-day free trial with full access to all Professional features. No credit card required.',
      open: false,
    },
    {
      q: 'Is my data safe?',
      a: 'Yes. We use enterprise-grade encryption, secure cloud hosting on AWS, and role-based access control to ensure your data is protected at all times.',
      open: false,
    },
    {
      q: 'Do you offer training for staff?',
      a: 'All plans include access to our knowledge base and video tutorials. Professional and Enterprise plans include live onboarding sessions.',
      open: false,
    },
    {
      q: 'Can I import data from my current system?',
      a: 'Yes. We support bulk imports from CSV/Excel files. Our team can help migrate data from your existing system.',
      open: false,
    },
  ];

  protected toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
