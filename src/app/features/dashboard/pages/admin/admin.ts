import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {AuthService} from '../../../../core/auth/services/auth.service';
import {TokenService} from '../../../../core/auth/services/token.service';

interface StatCard {
  label: string;
  value: string;
  delta: string;
  deltaPositive: boolean;
  icon: string;
  accentClass: string;   // CSS class for the icon background colour
}

interface RecentActivity {
  id: number;
  text: string;
  time: string;
  type: 'student' | 'teacher' | 'payment' | 'exam';
}

@Component({
  selector: 'app-admin',
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Admin implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly tokens = inject(TokenService);

  readonly currentUser = this.auth.currentUser;
  readonly isLoading = signal(true);

  readonly stats = signal<StatCard[]>([
    {
      label: 'Total students',
      value: '1,248',
      delta: '+24 this term',
      deltaPositive: true,
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      accentClass: 'stat-icon--teal',
    },
    {
      label: 'Active teachers',
      value: '86',
      delta: '+3 this term',
      deltaPositive: true,
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      accentClass: 'stat-icon--purple',
    },
    {
      label: 'Fee collection',
      value: '₦4.2M',
      delta: '82% of target',
      deltaPositive: true,
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      accentClass: 'stat-icon--amber',
    },
    {
      label: 'Pending results',
      value: '14',
      delta: '3 overdue',
      deltaPositive: false,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      accentClass: 'stat-icon--coral',
    },
  ]);

  readonly recentActivity = signal<RecentActivity[]>([
    { id: 1, text: 'Samuel Adeyemi enrolled in JSS1A', time: '2 min ago', type: 'student' },
    { id: 2, text: 'Mrs. Okonkwo submitted SS2 Biology results', time: '18 min ago', type: 'exam' },
    { id: 3, text: 'Fee payment received from Tunde Williams', time: '42 min ago', type: 'payment' },
    { id: 4, text: 'New teacher Mr. Emeka Nwosu registered', time: '1 hr ago', type: 'teacher' },
    { id: 5, text: 'Attendance recorded for JSS3B', time: '2 hrs ago', type: 'student' },
    { id: 6, text: 'Term report cards generated for SS3', time: '3 hrs ago', type: 'exam' },
  ]);

  ngOnInit(): void {
    setTimeout(() => this.isLoading.set(false), 600);
  }

  activityDot(type: RecentActivity['type']):string {
    const map: Record<RecentActivity['type'], string> = {
      student: 'dot--teal',
      teacher: 'dot--purple',
      payment: 'dot--amber',
      exam: 'dot--blue'
    };
    return map[type];
  }
}
