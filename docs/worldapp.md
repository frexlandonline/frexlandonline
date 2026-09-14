# Integración World App & World ID (Anti-Bots y Mecanismo Cross-Chain)

FrexLand ha sido concebido desde sus cimientos para ofrecer una experiencia de juego limpia, justa y libre de bots automatizados. Gracias a la integración con el ecosistema de **World (World App, World Chain y World ID)**, resolvemos uno de los desafíos más críticos de los videojuegos Web3: la suplantación de identidad (ataques Sybil) y el abuso de scripts.

---

## 1. Mini-App en World App (MiniKit)
FrexLand funciona como una Mini-App verificada dentro de **World App** mediante el framework oficial **MiniKit**. Esto permite que millones de usuarios globales accedan directamente desde sus teléfonos móviles sin necesidad de lidiar con frases semilla complejas, configuraciones manuales de RPC ni extensiones externas de navegador. Los pagos, depósitos y verificaciones ocurren en un entorno protegido y nativo.

---

## 2. Verificación de Humanidad (Proof of Personhood con World ID Orb)
El pilar fundamental de nuestra protección contra bots es **World ID** verificado por **Orb**:

* **Privacidad Cero-Conocimiento (ZKP):** World ID utiliza pruebas criptográficas de conocimiento cero (Zero-Knowledge Proofs). En ningún momento se revelan ni almacenan datos biométricos o personales. La plataforma únicamente recibe una prueba matemática irrefutable de que quien juega es un ser humano real y único en el mundo.
* **Protección de Leaderboards y Torneos:** Cada usuario verificado genera un `nullifier_hash` único que impide la creación de múltiples cuentas por una misma persona para monopolizar los premios del pozo semanal.
* **Crédito Semanal de Humanidad (Renovación con Cuenta Regresiva):** Una vez que un jugador verifica su condición de humano mediante World ID Orb, el protocolo le otorga **1 crédito extra de juego semanal**. Este crédito se renueva y acredita automáticamente cada semana al finalizar la cuenta regresiva del pozo y distribuirse los premios, permitiéndole registrar sus récords semana a semana junto con los créditos de su nivel por capital depositado.

---

## 3. Mecanismo Cross-Chain y Regla de Depósitos (World Chain a Base / Aave V3)
Para maximizar la eficiencia y el rendimiento financiero de los fondos, el protocolo opera con una arquitectura multi-cadena perfectamente coordinada:

### Arquitectura de Depósito y Rendimiento:
1. **Depósito en World Chain:** El usuario transfiere USDC desde su billetera de World App en la red World Chain.
2. **Regla de Múltiplos de 10 USDC + 0.01 USDC:** Los depósitos deben ser obligatoriamente en montos de **(10 × N) + 0.01 USDC** (ej: **10.01, 50.01, 100.01, 500.01, 1000.01 USDC**). Los 0.01 USDC se destinan estrictamente a solventar las comisiones reales de red y el puente cross-chain.
3. **Puente a Base y Suministro a Aave V3:** Los fondos se transfieren hacia la red Base y el contrato inteligente invoca automáticamente `registrarEntrada` con el múltiplo exacto de 10 USDC (10, 50, 100, 500, 1000 USDC...). Dichos fondos se suministran a Aave V3 para generar intereses en aUSDC.
4. **Generación de Créditos Semanales por Nivel:** Por cada 10 USDC netos en Aave, el usuario obtiene 1 crédito semanal permanente correspondiente a su nivel (Bronce, Plata, Oro, Platino, Diamante). Sumado al crédito por verificación de humanidad con World ID, un usuario verificado con 10 USDC en Aave dispone de **2 créditos todas las semanas tras cada sorteo de premios**.

---

## 4. Mecanismo de Retiro On-Chain
Cuando un usuario de World App solicita retirar su capital depositado:
* Tras cumplirse el período de seguridad de 24 horas (Time-Lock contra manipulaciones flash-loan), el contrato inteligente retira los USDC correspondientes desde el pool de Aave V3 en la red Base.
* La infraestructura ejecuta el puente inverso hacia World Chain directamente a la dirección del usuario.
* Las comisiones de red y bridge requeridas por la transacción se descuentan directamente del capital retirado, garantizando un balance contable matemáticamente exacto y sostenible sin generar deudas para el protocolo.
