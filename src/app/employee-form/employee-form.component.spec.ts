import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { EmployeeFormComponent } from './employee-form.component';
import { EmployeeService } from '../employee.service';

describe('EmployeeFormComponent', () => {
  let component: EmployeeFormComponent;
  let fixture: ComponentFixture<EmployeeFormComponent>;
  let employeeService: EmployeeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeFormComponent);
    component = fixture.componentInstance;
    employeeService = TestBed.inject(EmployeeService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts invalid when empty', () => {
    expect(component.employeeForm.valid).toBeFalse();
    expect(component.firstName.hasError('required')).toBeTrue();
    expect(component.lastName.hasError('required')).toBeTrue();
    expect(component.phone.hasError('required')).toBeTrue();
    expect(component.email.hasError('required')).toBeTrue();
    expect(component.position.hasError('required')).toBeTrue();
  });

  it('rejects whitespace-only names', () => {
    component.firstName.setValue('   ');
    expect(component.firstName.hasError('whitespace')).toBeTrue();
    expect(component.employeeForm.valid).toBeFalse();
  });

  it('rejects a malformed email', () => {
    component.email.setValue('not-an-email');
    expect(component.email.hasError('email')).toBeTrue();
  });

  it('rejects a malformed phone number', () => {
    component.phone.setValue('abc');
    expect(component.phone.hasError('pattern')).toBeTrue();
  });

  it('accepts a fully valid employee', () => {
    component.employeeForm.setValue({
      id: 0,
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+44 20 7946 0958',
      email: 'ada@example.com',
      position: 'Engineer'
    });
    expect(component.employeeForm.valid).toBeTrue();
  });

  it('does not call the API when the form is invalid', () => {
    const createSpy = spyOn(employeeService, 'createEmployee');
    component.onSubmit();
    expect(createSpy).not.toHaveBeenCalled();
    expect(component.firstName.touched).toBeTrue();
  });

  it('trims values, creates the employee and navigates home', () => {
    const createSpy = spyOn(employeeService, 'createEmployee').and.returnValue(of({
      id: 1, firstName: 'Ada', lastName: 'Lovelace',
      phone: '123456789', email: 'ada@example.com', position: 'Engineer'
    }));
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');

    component.employeeForm.setValue({
      id: 0,
      firstName: '  Ada ',
      lastName: ' Lovelace ',
      phone: ' 123456789 ',
      email: ' ada@example.com ',
      position: ' Engineer '
    });

    component.onSubmit();

    expect(createSpy).toHaveBeenCalledWith({
      id: 0,
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '123456789',
      email: 'ada@example.com',
      position: 'Engineer'
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});

describe('EmployeeFormComponent (edit mode)', () => {
  let fixture: ComponentFixture<EmployeeFormComponent>;
  let service: EmployeeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '7' })) } }
      ]
    }).compileComponents();

    service = TestBed.inject(EmployeeService);
    spyOn(service, 'getEmployeeById').and.returnValue(of({
      id: 7, firstName: 'Katherine', lastName: 'Johnson',
      phone: '555-0104', email: 'k@example.com', position: 'Computer'
    }));

    fixture = TestBed.createComponent(EmployeeFormComponent);
    fixture.detectChanges();
  });

  it('loads the employee into the form and switches to edit mode', () => {
    const component = fixture.componentInstance;
    expect(component.isEditing).toBeTrue();
    expect(component.employeeForm.value).toEqual({
      id: 7,
      firstName: 'Katherine',
      lastName: 'Johnson',
      phone: '555-0104',
      email: 'k@example.com',
      position: 'Computer'
    });
    expect(component.employeeForm.valid).toBeTrue();
  });
});
