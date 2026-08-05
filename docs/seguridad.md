# Seguridad y Contratos (Auditoría)

La transparencia y seguridad de los fondos son el pilar más crítico de FrexLand. Nuestro contrato inteligente (Smart Contract) corre sobre la blockchain de **Base**.

> **Contrato Oficial (Base Network):**
> [`0x8bb01A4e20638A58c168a9a6745d0F62231B0b94`](https://basescan.org/address/0x8bb01A4e20638A58c168a9a6745d0F62231B0b94)

### Auditoría con Slither

El código del contrato ha sido analizado profundamente utilizando **Slither**, el framework de análisis estático más avanzado para Solidity. Durante el desarrollo y la auditoría, se implementaron las siguientes protecciones de estándar industrial:

1. **Protección contra Reentrancy:** Utilizamos `ReentrancyGuard` de OpenZeppelin en todas las funciones sensibles (especialmente el retiro de fondos) para prevenir ataques donde un contrato malicioso intente drenar liquidez llamando recursivamente a la función.
2. **Patrón "Pull over Push":** En lugar de que el contrato envíe fondos automáticamente a los ganadores (lo cual es riesgoso y puede causar bloqueos si una transferencia falla), el protocolo requiere que los usuarios soliciten su retiro. Esto aísla el riesgo de fallo de un usuario del resto del ecosistema.
3. **Time-Lock de 24 Horas:** Implementamos un mecanismo de seguridad estricto que obliga a esperar 24 horas tras solicitar un retiro. Esto neutraliza manipulaciones de precios flash-loan y da tiempo a reaccionar en caso de un evento inesperado.
4. **Interacción Segura con Aave V3:** El contrato no reinventa la rueda financiera; deposita los USDC directamente en Aave V3 utilizando integraciones estándar y comprobadas, limitando el riesgo sistémico únicamente a la seguridad ampliamente validada de Aave.
5. **Sin "Owner Trap":** El propietario del contrato no tiene capacidad de pausar los retiros legítimos de los usuarios ni de acceder a sus depósitos, garantizando la confianza y descentralización de los fondos.
