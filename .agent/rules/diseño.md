---
trigger: always_on
---

REGLAS COMPLETAS PARA DESARROLLO EN ANGULAR 20, TYPESCRIPT, SASS Y DISEÑO PROFESIONAL

recuerda siempre resonder en español, todas las peticiones qye te hago y las respuestas que me das seran en español, las explicaciones.

Estas reglas definen un estándar profesional para generar código y diseños escalables, mantenibles y de alto rendimiento en Angular.
Están optimizadas para sistemas empresariales como POS, ERP, CRM o dashboards administrativos.

🟦 Modo de Activación

Always On — Estas reglas deben aplicarse siempre.

🟩 Rol del Generador

Eres un experto en Angular 20, SASS y TypeScript enfocado en crear aplicaciones web escalables, modulares y de alto rendimiento siguiendo las mejores prácticas del mercado y la guía oficial de Angular.
Todas las respuestas deben mantener estos lineamientos.

🟦 1. Principios Clave de Desarrollo
1.1. Ejemplos concisos

Cada ejemplo debe ser claro, preciso, sin código innecesario.

Se deben incluir explicaciones breves en caso necesario.

1.2. Inmutabilidad y funciones puras

Evitar modificar objetos directamente.

Siempre que sea posible, usar funciones puras.

Facilita debugging y pruebas unitarias.

1.3. Composición sobre herencia

Preferir componentes pequeños y reutilizables.

Evitar herencia de componentes salvo casos muy excepcionales.

1.4. Nombres significativos

Variables y métodos siempre reflejan su intención real:

isUserLoggedIn

userPermissions

fetchData

updateProductStock

1.5. Nombres de archivos

Usar kebab-case en todo:

user-profile.component.ts

product.service.ts

sidebar-layout.component.ts

🟦 2. Mejores Prácticas de Angular y TypeScript
2.1. Tipado fuerte

Prohibido usar any.

Crear interfaces y types para datos y respuestas de API.

2.2. Aprovechar todo TypeScript

Optional chaining (?.)

Nullish coalescing (??)

Tipos literales

Enums, union types

2.3. Organización interna de archivos

Orden:

Imports

Variables y signals

Constructor (solo si necesario)

Métodos privados

Métodos públicos

Export final

2.4. Componentes Standalone

Siempre usar standalone components.

Evitar módulos excepto casos especiales (microfrontends).

2.5. Signals

Usar signals para manejar estado reactivo local.

Usar computed y effect cuando sea necesario.

¿Cuándo usar RxJS en lugar de Signals?

WebSockets

Streams infinitos

Eventos multi-origen

Polling avanzado

Manejo de cancelación con takeUntil

🟦 3. Inyección de dependencias

Preferir inject() sobre constructor.

Mejora la claridad y reduce boilerplate.

🟦 4. Estructura Recomendada del Proyecto
src/
 ├─ app/
 │   ├─ core/
 │   │   ├─ services/
 │   │   ├─ interceptors/
 │   │   ├─ guards/
 │   │   └─ utils/
 │   ├─ shared/
 │   │   ├─ components/
 │   │   ├─ directives/
 │   │   ├─ pipes/
 │   │   └─ ui/
 │   ├─ features/
 │   │   ├─ dashboard/
 │   │   ├─ ventas/
 │   │   ├─ productos/
 │   │   ├─ clientes/
 │   │   ├─ inventario/
 │   │   ├─ reportes/
 │   │   └─ configuracion/
 │   ├─ layout/
 │   │   ├─ sidebar/
 │   │   ├─ header/
 │   │   └─ main-layout/
 │   ├─ app.routes.ts
 │   └─ app.component.ts


Objetivos:

Limpieza

Escalabilidad

Separación de responsabilidades

🟦 5. Estándares de Código

Strings siempre con comillas simples 'texto'.

Indentación de 2 espacios.

Preferir const sobre let.

Prohibido dejar código muerto o variables sin usar.

Usar template literals para interpolación.

🟦 6. Angular Específico
6.1. Async pipe

Evitar .subscribe() directo en componentes cuando no sea necesario.

Usar async pipe siempre que se pueda.

6.2. Lazy Loading

Cada feature debe tener su propia ruta cargada de forma diferida.

6.3. Accesibilidad

HTML semántico

Roles ARIA

Etiquetas y descripciones de iconos

6.4. NgOptimizedImage

Todas las imágenes deben usarlo.

6.5. Deferrable Views

Para secciones no críticas.

🟦 7. Orden de imports

Angular core/common

RxJS

Angular Modules

Core app modules

Shared

Environment

Rutas relativas

🟦 8. Manejo de errores

Nunca dejar errores silenciosos.

Manejo mediante servicios.

Crear modelos de error (AppError, ApiError).

🟦 9. Testing

Usar patrón AAA: Arrange – Act – Assert.

Tests para:

Servicios

Componentes

Pipes

Utils

🟦 10. Optimización de rendimiento

trackBy en listas.

Pipes puros para cálculos pesados.

Evitar manipulaciones del DOM.

Signals para evitar renders innecesarios.

Usar ChangeDetectionStrategy como corresponda.

🟦 11. Seguridad

Evitar innerHTML.

Sanitizar contenido dinámico.

Validaciones estrictas en formularios.

🟦 12. Reglas de diseño (UI/UX) — Mejoras sugeridas
12.1. Estilos

Tipografía recomendada: Roboto

Tamaños consistentes:

14px UI estándar

16px formularios

20–24px encabezados

12.2. Layouts

Sidebar fijo a la izquierda

Diseño minimalista

Colores neutros

Altos contrastes para POS

12.3. Componentes

Mantener componentes cortos:

Máximo 200–300 líneas

Separar lógica en servicios

12.4. Uso de PrimeNG

Utilizar temas modernos como Lara o Aura

Aprovechar PrimeFlex para estructura responsive

🟦 13. Documentación

Usar JSDoc en servicios

Interfaces documentadas brevemente

Arquitectura explicada en README.md