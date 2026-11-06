import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Employee } from '../../models/employee';
import { EmployeeService } from '../employee.service';

function noWhitespace(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  return typeof value === 'string' && value.trim().length === 0 ? { whitespace: true } : null;
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {

  employeeForm: FormGroup;
  isEditing = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.employeeForm = this.fb.group({
      id: [0],
      firstName: ['', [Validators.required, Validators.maxLength(100), noWhitespace]],
      lastName: ['', [Validators.required, Validators.maxLength(100), noWhitespace]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\s().-]{7,20}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      position: ['', [Validators.required, Validators.maxLength(100), noWhitespace]]
    });
  }

  get firstName() { return this.employeeForm.get('firstName')!; }
  get lastName() { return this.employeeForm.get('lastName')!; }
  get phone() { return this.employeeForm.get('phone')!; }
  get email() { return this.employeeForm.get('email')!; }
  get position() { return this.employeeForm.get('position')!; }

  isInvalid(control: AbstractControl): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        return;
      }

      this.isEditing = true;
      this.employeeService.getEmployeeById(Number(id)).subscribe({
        next: (employee) => {
          this.employeeForm.patchValue({
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            phone: employee.phone,
            email: employee.email,
            position: employee.position
          });
        },
        error: (err) => {
          this.errorMessage = `Could not load employee (${err.status}).`;
        }
      });
    });
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.trimValues();

    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    const employee: Employee = this.employeeForm.getRawValue();
    const request$ = this.isEditing
      ? this.employeeService.editEmployee(employee)
      : this.employeeService.createEmployee(employee);

    this.isSubmitting = true;
    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.isSubmitting = false;
        const action = this.isEditing ? 'updating' : 'creating';
        this.errorMessage = `An error occurred while ${action} the employee (${err.status}).`;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/']);
  }

  private trimValues(): void {
    const controls = this.employeeForm.controls;
    Object.keys(controls).forEach((key) => {
      const control = controls[key];
      if (typeof control.value === 'string') {
        const trimmed = control.value.trim();
        if (trimmed !== control.value) {
          control.setValue(trimmed);
        }
      }
    });
  }
}
