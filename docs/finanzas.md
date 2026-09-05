# Finanzas y Retiros

Todo el USDC depositado por los usuarios se envía de forma transparente a un pool de liquidez en Aave (Base Network), generando intereses constantemente.

> [!NOTE]
> **Distribución del Interés Semanal**
> 
> Cada jueves a las 00:00 UTC, los intereses generados se reparten:
> * **70%** se divide entre el Top 3 (50%, 35%, 15%).
> * **30%** va al equipo de desarrollo para el mantenimiento de la plataforma.

**Depósitos y Comisiones:** Los depósitos deben ser obligatoriamente múltiplos de 10 USDC sumando 0.01 USDC para comisiones de red y puente (ej. 10.01, 20.01, 50.01 USDC). De los 0.01 USDC se descuentan los costos de transacción para que ingrese al contrato de Aave un múltiplo exacto de 10 USDC, generando 1 crédito diario por cada 10 USDC aportados.

**Retiros Seguros:** Tu depósito inicial siempre es tuyo. Puedes solicitar su retiro, el cual tiene un período de seguridad y confirmación de 24 horas para proteger el capital del pool contra ataques de manipulación. Al retirar, las comisiones reales de red se descuentan directamente del monto a retirar.
