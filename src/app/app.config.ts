import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { MyPreset } from '@shared/themes/my-custom-theme';



export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: MyPreset,
        options: {
          darkModeSelector: 'none'
        }
      },
      translation: {
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
        dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'],
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        today: 'Hoy',
        clear: 'Limpiar',
        weekHeader: 'Sm',
        firstDayOfWeek: 1,
        dateFormat: 'dd/mm/yy',
        accept: 'Aceptar',
        reject: 'Rechazar',
        choose: 'Elegir',
        upload: 'Subir',
        cancel: 'Cancelar',
        pending: 'Pendiente',
        fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        searchMessage: '{0} resultados disponibles',
        selectionMessage: '{0} elementos seleccionados',
        emptySearchMessage: 'No se encontraron resultados',
        emptySelectionMessage: 'Ningún elemento seleccionado',
        emptyMessage: 'No hay opciones disponibles',
        emptyFilterMessage: 'No se encontraron resultados',
        aria: {
          trueLabel: 'Verdadero',
          falseLabel: 'Falso',
          nullLabel: 'No seleccionado',
          star: '1 estrella',
          stars: '{star} estrellas',
          selectAll: 'Seleccionar todos',
          unselectAll: 'Deseleccionar todos',
          close: 'Cerrar',
          previous: 'Anterior',
          next: 'Siguiente',
          navigation: 'Navegación',
          scrollTop: 'Ir arriba',
          moveTop: 'Mover arriba',
          moveUp: 'Subir',
          moveDown: 'Bajar',
          moveBottom: 'Mover abajo',
          moveToTarget: 'Mover al destino',
          moveToSource: 'Mover al origen',
          moveAllToTarget: 'Mover todo al destino',
          moveAllToSource: 'Mover todo al origen',
          pageLabel: 'Página {page}',
          firstPageLabel: 'Primera Página',
          lastPageLabel: 'Última Página',
          nextPageLabel: 'Siguiente Página',
          prevPageLabel: 'Página Anterior',
          rowsPerPageLabel: 'Filas por página',
          previousPageLabel: 'Página Anterior',
          editRow: 'Editar Fila',
          saveEdit: 'Guardar Edición',
          cancelEdit: 'Cancelar Edición',
          listView: 'Vista de Lista',
          gridView: 'Vista de Cuadrícula',
          slide: 'Diapositiva',
          slideNumber: '{slideNumber}',
          zoomImage: 'Ampliar Imagen',
          zoomIn: 'Acercar',
          zoomOut: 'Alejar',
          rotateRight: 'Rotar a la Derecha',
          rotateLeft: 'Rotar a la Izquierda'
        }
      }
    }),
    ConfirmationService,
    MessageService
  ]
};
