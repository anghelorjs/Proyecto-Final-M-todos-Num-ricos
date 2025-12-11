# ⚡ NumeriX Lab – Interpolación, Gradiente Conjugado y SOR

> Aplicación web interactiva para explorar **tres métodos clásicos de Análisis Numérico** aplicados a problemas reales.**.

---

## 👤 Datos del estudiante

- **Nombre:** Fidel Angel Rojas Condori  
- **CI:** 9928113  
- **Materia:** Análisis Numérico  
- **Proyecto:** Aplicación Web – Métodos Numéricos

---

## 🎯 Objetivo del proyecto

Desarrollar una **aplicación web 100% en HTML, CSS y JavaScript puro** que:

- Presente **tres métodos de Análisis Numérico** con enfoque **práctico** (sin teoría pesada).
- Aplique cada método a un **problema real o cercano a la vida real**.
- Permita **modificar datos de entrada** y recalcular en tiempo real.
- Muestre:
  - Cantidad de **ecuaciones** e **incógnitas**.
  - **Ecuaciones usadas** por el método.
  - **Gráficos y animaciones** para entender el comportamiento numérico.
- Tenga una **interfaz moderna**, con temática **neón/cyberpunk**, apta para presentación académica.

---

## 🧪 Métodos implementados

La app implementa tres módulos principales, cada uno con su propio caso práctico.

### 1. 🔷 Interpolación Polinómica (Newton)

- **Problema real:**  
  *Pronóstico de demanda de energía eléctrica* en una ciudad, a partir de mediciones horarias:  
  \[(x_i = \text{hora},\; y_i = \text{demanda en MW})\]
- **Método:** Interpolación polinómica de Newton (diferencias divididas).
- **Lo que hace el módulo:**
  - Permite ingresar una tabla de puntos \((x_i, y_i)\).
  - Muestra cuántos **puntos**, **ecuaciones** e **incógnitas** se usan.
  - Construye el polinomio interpolante:
    \[
      p(x) = a_0 + a_1(x-x_0) + a_2(x-x_0)(x-x_1) + \dots
    \]
  - Muestra la **ecuación del polinomio** en forma textual.
  - Permite evaluar la demanda en una hora intermedia (por ejemplo, 13:00).
  - Dibuja:
    - Los **puntos reales**.
    - La **curva interpolante** con un efecto estilo neón en un `<canvas>`.

---

### 2. 🟣 Método del Gradiente Conjugado

- **Problema real:**  
  *Cálculo de presiones en nodos de una red de tuberías* modelada como un sistema lineal:
  \[
    A x = b
  \]
  donde:
  - \(x\) = vector de presiones en los nodos.
  - \(A\) = matriz simétrica definida positiva asociada a la red.
  - \(b\) = vector de términos independientes (caudales/condiciones).
- **Método:** Gradiente conjugado clásico para sistemas simétricos definidos positivos.
- **Lo que hace el módulo:**
  - Permite definir el tamaño del sistema (hasta 5×5).
  - Genera inputs para la matriz **A** y el vector **b**.
  - Opción de cargar un **ejemplo físico** preconfigurado de red de tuberías.
  - Muestra:
    - Número de **ecuaciones** e **incógnitas**.
    - El sistema explícito ecuación por ecuación:
      \[
        a_{11}x_1 + a_{12}x_2 + \dots = b_1
      \]
  - Implementa el algoritmo iterativo:
    ```text
    x₀ = 0
    r₀ = b - A x₀
    p₀ = r₀

    αₖ = (rₖᵀ rₖ) / (pₖᵀ A pₖ)
    xₖ₊₁ = xₖ + αₖ pₖ
    rₖ₊₁ = rₖ - αₖ A pₖ
    βₖ = (rₖ₊₁ᵀ rₖ₊₁) / (rₖᵀ rₖ)
    pₖ₊₁ = rₖ₊₁ + βₖ pₖ
    ```
  - Muestra:
    - Vector solución aproximada \(x\).
    - Número de iteraciones.
    - Norma del residuo final.
    - Tabla por iteración: \(k\), \(\|r^k\|\), \(\alpha^k\).

---

### 3. 🔥 Método de Sobre-relajación Sucesiva (SOR)

- **Problema real:**  
  *Distribución de temperatura en una placa metálica* cuadrada con borde a temperatura fija:
  - Lados verticales a **100°C**.
  - Lados horizontales a **0°C**.
  - El interior se calcula resolviendo la ecuación de Laplace en 2D.
- **Método:** Gauss-Seidel con **Sobre-relajación Sucesiva (SOR)**:
  \[
    T_{ij}^{(k+1)} = (1-\omega)T_{ij}^{(k)} + \frac{\omega}{4}
      \left(T_{i+1,j}^{(k)} + T_{i-1,j}^{(k)} + T_{i,j+1}^{(k)} + T_{i,j-1}^{(k)}\right)
  \]
- **Lo que hace el módulo:**
  - Permite configurar:
    - Tamaño de la malla \(N \times N\) (nodos).
    - Parámetro de relajación \(\omega\) (recomendado \(1 < \omega < 2\)).
    - Tolerancia de convergencia.
    - Máximo de iteraciones.
  - Calcula cuántas **ecuaciones** e **incógnitas** hay:
    - Nodos interiores: \((N-2)^2\).
  - Muestra la evolución con un **heatmap animado**, donde:
    - Azul → frío (cerca de 0°C).
    - Rojo → caliente (cerca de 100°C).
  - Actualiza en cada iteración:
    - Iteración actual.
    - Máximo cambio \(\Delta\) en la temperatura.
    - Mensaje cuando se alcanza la tolerancia o el máximo de iteraciones.

---

## 💻 Tecnologías utilizadas

- **HTML5**  
- **CSS3** con:
  - Diseño **responsive**.
  - Estilo **neón/cyberpunk** (gradientes, glow, glassmorphism).
- **JavaScript** (vanilla):
  - Manipulación del DOM.
  - Cálculos numéricos (interpolación, gradiente conjugado, SOR).
  - Dibujos en `<canvas>` y generación de grillas.

No se utilizan frameworks externos, cumpliendo el requisito de trabajar con **HTML, CSS y JS puros**.

---

## 📁 Estructura del proyecto

```text
proyecto/
├── index.html    # Página principal (Single Page Application)
├── styles.css    # Estilos (tema neón/cyberpunk, layout y responsive)
└── app.js        # Lógica de los tres métodos y la interactividad
