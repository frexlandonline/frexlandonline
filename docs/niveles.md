# Sistema de Niveles y Rangos por Deposito

Para reconocer y premiar el compromiso de la comunidad con la liquidez del protocolo, FrexLand implementa un **Sistema de Rangos y Niveles** basado en el capital total depositado en USDC en Aave V3. Cada nivel otorga una insignia de distincion en el perfil, en los leaderboards y un volumen escalonado de creditos semanales.

---

## 1. Escala de Niveles y Beneficios

| Rango | Insignia | Deposito Requerido (USDC) | Creditos Semanales | Beneficio / Rol |
| :--- | :---: | :--- | :--- | :--- |
| **Sin Rango** | 🌱 | `< 10 USDC` | 0 creditos | Modo practica libre ilimitado. |
| **Bronce** | 🥉 | `≥ 10 USDC` y `< 50 USDC` | 1 a 4 creditos | Registro oficial de puntuacion. |
| **Plata** | 🥈 | `≥ 50 USDC` y `< 100 USDC` | 5 a 9 creditos | Mayor participacion semanal en el pozo. |
| **Oro** | 🥇 | `≥ 100 USDC` y `< 500 USDC` | 10 a 49 creditos | Jugador destacado con insignias doradas. |
| **Platino** | 💠 | `≥ 500 USDC` y `< 1000 USDC` | 50 a 99 creditos | Rango elite para alta competencia. |
| **Diamante** | 💎 | `≥ 1000 USDC` | 100+ creditos | Rango Legendario maximo de la plataforma. |

---

## 2. Formula y Ciclo de Renovacion de Creditos

### Calculo de Creditos:
$$\text{Creditos Semanales} = \left\lfloor \frac{\text{Total Depositado}}{10} \right\rfloor + \text{Bono World ID}$$

* **Deposito:** Cada 10 USDC depositados en Aave V3 generan 1 credito semanal.
* **Bono de Humanidad:** Si el usuario esta verificado como humano unico con World ID Orb, recibe **+1 credito semanal adicional**.

### Sincronizacion con la Cuenta Regresiva:
Los creditos se renuevan de manera fija y automatica cada semana al expirar la cuenta regresiva del pozo (**Jueves a las 00:00 UTC**), inmediatamente despues de la distribucion de premios a los mejores puntajes del ranking.
