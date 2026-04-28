import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

function nameValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v = (ctrl.value ?? '').trim();
  if (!v) return { required: true };
  if (v.length < 2) return { minlength: true };
  if (!/^[a-zA-Z\s'-]+$/.test(v)) return { invalidChars: true };
  return null;
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loading  = signal(false);
  error    = signal('');
  showPass = signal(false);

  form = this.fb.group({
    name:     ['', [nameValidator]],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get passwordStrength(): { label: string; level: 0 | 1 | 2 | 3 } {
    const pwd = this.form.get('password')?.value ?? '';
    if (!pwd) return { label: '', level: 0 };
    let score = 0;
    if (pwd.length >= 8)            score++;
    if (pwd.length >= 12)           score++;
    if (/[A-Z]/.test(pwd))          score++;
    if (/[0-9]/.test(pwd))          score++;
    if (/[^A-Za-z0-9]/.test(pwd))   score++;
    if (score <= 1) return { label: 'Weak',   level: 1 };
    if (score <= 3) return { label: 'Medium', level: 2 };
    return { label: 'Strong', level: 3 };
  }

  nameError(): string {
    const ctrl = this.form.get('name');
    if (!ctrl?.touched || ctrl.valid) return '';
    if (ctrl.errors?.['required'])      return 'Full name is required';
    if (ctrl.errors?.['minlength'])     return 'Name must be at least 2 characters';
    if (ctrl.errors?.['invalidChars'])  return 'Name can only contain letters, spaces, hyphens and apostrophes';
    return 'Invalid name';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { name, email, password } = this.form.getRawValue();
    this.auth.register({ name: name!.trim(), email: email!, password: password! }).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/']); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }
}
