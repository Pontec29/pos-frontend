import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { forkJoin, finalize } from 'rxjs';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';

// Shared & Features
import { AppButton } from '@shared/ui/button';
import { EmpleadoService } from '../../services/empleado.service';
import { SucursalService } from '../../../../configuracion/sucursales/services/sucursal.service';
import { CargosService } from '../../../cargos/services/cargos.service';
import { RolesService } from '../../../../configuracion/roles/services/roles.service';
import { Sucursal } from '../../../../configuracion/sucursales/domain/sucursal.type';
import { Cargo } from '../../../cargos/domain/cargo.interface';
import { Role } from '../../../../configuracion/roles/domain/role.interface';

@Component({
  selector: 'app-form-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule,
    InputNumberModule,
    DatePickerModule,
    ToggleSwitchModule,
    TextareaModule,
    TagModule,
    AppButton
  ],
  templateUrl: './new-empleado.html',
  styleUrl: './new-empleado.scss'
})
export default class FormEmpleadoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly empleadoService = inject(EmpleadoService);
  private readonly sucursalService = inject(SucursalService);
  private readonly cargosService = inject(CargosService);
  private readonly rolesService = inject(RolesService);
  private readonly messageService = inject(MessageService);

  isSubmitting = signal(false);
  isLoadingData = signal(true);
  mode = signal<'nuevo' | 'editar' | 'ver'>('nuevo');
  empleadoId = signal<number | null>(null);

  // Master Data
  sucursales = signal<Sucursal[]>([]);
  cargos = signal<Cargo[]>([]);
  roles = signal<Role[]>([]);

  form = this.fb.group({
    id: [null as number | null],
    
    // Personal
    nroDocumento: ['', [Validators.required, Validators.maxLength(12)]],
    tipoDocumento: ['1', Validators.required],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    email: ['', [Validators.email]],
    telefono: [''],
    fechaNacimiento: [null as Date | null],
    
    // Laboral
    idSucursal: [null as number | null, Validators.required],
    idCargo: [null as number | null, Validators.required],
    porcentajeComision: [0, [Validators.min(0), Validators.max(100)]],
    sueldoActual: [0, [Validators.min(0)]],
    fechaIngreso: [new Date(), Validators.required],
    
    // Extra
    contactoEmergenciaNombre: [''],
    contactoEmergenciaTelefono: [''],
    observaciones: [''],
    
    // Acceso
    tieneAccesoSistema: [false],
    username: [''],
    password: [''],
    idRol: [null as number | null]
  });

  tipoDocumentoOptions = [
    { label: 'DNI', value: '1' },
    { label: 'RUC', value: '4' },
    { label: 'PASAPORTE', value: '7' }
  ];

  ngOnInit() {
    this.detectMode();
    this.loadMasterData();

    // Validaciones dinámicas para acceso al sistema
    this.form.get('tieneAccesoSistema')?.valueChanges.subscribe(hasAccess => {
      if (this.mode() === 'ver') return;
      
      const username = this.form.get('username');
      const password = this.form.get('password');
      const idRol = this.form.get('idRol');

      if (hasAccess) {
        username?.setValidators([Validators.required]);
        // En edición la contraseña es opcional (solo si quieren cambiarla)
        if (this.mode() === 'nuevo') {
          password?.setValidators([Validators.required]);
        } else {
          password?.clearValidators();
        }
        idRol?.setValidators([Validators.required]);
      } else {
        username?.clearValidators();
        password?.clearValidators();
        idRol?.clearValidators();
        username?.setValue('');
        password?.setValue('');
        idRol?.setValue(null);
      }
      username?.updateValueAndValidity();
      password?.updateValueAndValidity();
      idRol?.updateValueAndValidity();
    });
  }

  private detectMode() {
    const url = this.router.url;
    const id = this.route.snapshot.paramMap.get('id');

    if (url.includes('/ver/')) {
      this.mode.set('ver');
    } else if (url.includes('/editar/')) {
      this.mode.set('editar');
    } else {
      this.mode.set('nuevo');
    }

    if (id) {
      this.empleadoId.set(+id);
      this.loadEmpleadoData(+id);
    }
  }

  private loadEmpleadoData(id: number) {
    this.isLoadingData.set(true);
    this.empleadoService.getEmpleadoById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          this.form.patchValue({
            id: d.id,
            nroDocumento: d.nroDocumento,
            tipoDocumento: d.tipoDocumento,
            nombres: d.nombres,
            apellidos: d.apellidos,
            email: d.email,
            telefono: d.telefono,
            fechaNacimiento: d.fechaNacimiento ? new Date(d.fechaNacimiento) : null,
            idSucursal: d.idSucursal,
            idCargo: d.idCargo,
            porcentajeComision: d.porcentajeComision,
            sueldoActual: d.sueldoActual,
            fechaIngreso: d.fechaIngreso ? new Date(d.fechaIngreso) : null,
            contactoEmergenciaNombre: d.contactoEmergenciaNombre,
            contactoEmergenciaTelefono: d.contactoEmergenciaTelefono,
            observaciones: d.observaciones,
            // Primero username/idRol, LUEGO el toggle para evitar que valueChanges los limpie
            username: d.username ?? '',
            idRol: d.idRol ?? null,
            tieneAccesoSistema: d.tieneAccesoSistema,
          });

          if (this.mode() === 'ver') {
            this.form.disable();
          }
        }
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar la información del empleado' });
      },
      complete: () => this.isLoadingData.set(false)
    });
  }

  private loadMasterData() {
    this.isLoadingData.set(true);
    
    forkJoin({
      sucursales: this.sucursalService.getActivas(),
      cargos: this.cargosService.getCargos(),
      roles: this.rolesService.getRoles()
    }).pipe(
      finalize(() => this.isLoadingData.set(false))
    ).subscribe({
      next: (res) => {
        this.sucursales.set(res.sucursales.data || []);
        this.cargos.set(res.cargos.data || []);
        this.roles.set(res.roles.data || []);
      },
      error: (err) => {
        console.error('Error loading master data', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las listas maestras' });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Formulario Inválido', detail: 'Por favor complete todos los campos obligatorios' });
      return;
    }

    const value = this.form.getRawValue();

    // Preparar el objeto para la creación según el formato solicitado
    const payload: any = {
      nroDocumento: value.nroDocumento,
      tipoDocumento: value.tipoDocumento,
      nombres: value.nombres?.toUpperCase(),
      apellidos: value.apellidos?.toUpperCase(),
      email: value.email,
      telefono: value.telefono,
      idSucursal: value.idSucursal,
      idCargo: value.idCargo,
      tieneAccesoSistema: value.tieneAccesoSistema,
      porcentajeComision: value.porcentajeComision,
      fechaNacimiento: value.fechaNacimiento ? this.formatDate(value.fechaNacimiento) : null,
      contactoEmergenciaNombre: value.contactoEmergenciaNombre,
      contactoEmergenciaTelefono: value.contactoEmergenciaTelefono,
      fechaIngreso: this.formatDate(value.fechaIngreso!),
      sueldoActual: value.sueldoActual,
      observaciones: value.observaciones,
      activo: true
    };

    if (value.tieneAccesoSistema) {
      payload.username = value.username;
      payload.password = value.password;
      payload.idRol = value.idRol;
    }

    this.isSubmitting.set(true);
    
    const request = this.mode() === 'editar' 
      ? this.empleadoService.updateEmpleado(this.empleadoId()!, payload) // Necesitaremos crear este método
      : this.empleadoService.createEmpleado(payload);

    request.pipe(
      finalize(() => this.isSubmitting.set(false))
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const msg = this.mode() === 'nuevo' ? 'Empleado registrado correctamente' : 'Empleado actualizado correctamente';
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: msg });
          this.router.navigate(['/recursos-humanos/empleados']);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: response.message });
        }
      },
      error: (err) => {
        console.error('Error creating empleado', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al registrar el empleado' });
      }
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  enableEditMode() {
    this.mode.set('editar');
    this.form.enable();
    this.router.navigate(['/recursos-humanos/empleados/editar', this.empleadoId()]);
  }

  cancel() {
    this.router.navigate(['/recursos-humanos/empleados']);
  }
}
