// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockWorldID
 * @dev Contrato Mock para simular la verificación de pruebas de World ID en entornos de prueba locales.
 * Permite a los desarrolladores probar flujos de éxito y error manipulando un interruptor administrativo.
 */
contract MockWorldID {
    // Flag administrativo para determinar si la verificación de pruebas debe tener éxito o fallar
    bool public shouldPass = true;
    
    event VerificationAttempt(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        bool success
    );

    /**
     * @dev Cambia el comportamiento del Mock para simular fallos en las pruebas de World ID.
     * @param _shouldPass Si es true, verifyProof se ejecutará exitosamente. Si es false, revertirá.
     */
    function setShouldPass(bool _shouldPass) external {
        shouldPass = _shouldPass;
    }

    /**
     * @dev Simula la función verifyProof del router oficial de World ID.
     * Si shouldPass es false, la transacción revierte emulando un ZK Proof inválido.
     */
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view {
        // En una llamada view, no podemos emitir eventos reales, pero podemos validar y revertir
        if (!shouldPass) {
            revert("MockWorldID: Invalid proof or identity verification failed");
        }
        
        // Si shouldPass es true, la ejecución finaliza de manera limpia (prueba exitosa)
    }
}
