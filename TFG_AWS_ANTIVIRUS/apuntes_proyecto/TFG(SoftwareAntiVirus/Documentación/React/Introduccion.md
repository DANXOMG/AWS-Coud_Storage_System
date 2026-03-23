**¿QUE ES REACT?**

Librería de Javascript que sirve para diseñar interfaces de usuario.

Framework más utilizado en el mundo (hay mucho curro de esto jajajajaj )



**Crear y anidar componentes**
Las aplicaciones de React estan hechas a partir de "componentes".
Cada componente tiene su propia lógica y apariencia

Los componentes de React son funciones de JAvascript quede vuelven markup ejemplo:

function MyButton() {
  return (
    <button>Soy un botón</button>
  );
}

Ahora he declarado "MyButton" y puedo anidarlo con otro componente:

export default function MyApp() {
  return (
    <div>
      <h1>Bienvenido a mi aplicación</h1>
      <MyButton /> //aqui anidamos el boton
    </div>
  );
}

*IMPORTANTE*
Los componentes de React deben ir en mayuscula para poder enteder que es un componente, sin embargo html debe ser en minuscula


App.js

function MyButton() {
    return (
        <button> Soy un boton </button>
    );
}

export default function MyApp() {
    return(
        <div>
            <h1>Bienvenido a mi aplicacion</h1>
            <MyButton />
        </div>
    );
}
