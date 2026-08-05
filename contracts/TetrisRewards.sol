// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IWorldID
 * @dev Interfaz para el contrato verificador de World ID (WorldIDRouter).
 */
interface IWorldID {
    /**
     * @dev Verifica un Zero-Knowledge Proof generado por IDKit de World ID.
     * @param root El Merkle root de la identidad del usuario.
     * @param groupId El ID del grupo de credenciales (habitualmente 1 para Orb).
     * @param signalHash El hash de la señal (en este caso, la dirección de la wallet del jugador).
     * @param nullifierHash El identificador único para la acción/usuario (previene ataques de replay).
     * @param externalNullifierHash El hash externo compuesto por el App ID y Action ID de Worldcoin.
     * @param proof El ZK Proof formateado como un arreglo de 8 uint256.
     */
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}

/**
 * @title ByteHasher
 * @dev Biblioteca helper para formatear bytes en hashes compatibles con el campo escalar de SNARK.
 */
library ByteHasher {
    /**
     * @dev Realiza un keccak256 de un byte array y aplica un desplazamiento de 8 bits a la derecha
     * para asegurar que el valor quepa en el campo escalar de BN254.
     * @param value El array de bytes a hashear.
     */
    function hashToField(bytes memory value) internal pure returns (uint256) {
        return uint256(keccak256(value)) >> 8;
    }
}

/**
 * @title TetrisRewards
 * @dev Contrato premium para manejar recompensas y puntajes de un juego Tetris anti-bots en World Chain.
 * Cuenta con verificación en cadena de World ID y prevención criptográfica de ataques Sybil.
 * @custom:security-contact dev@example.com
 */
contract TetrisRewards is Ownable {
    using ByteHasher for bytes;

    // ==========================================
    // ESTADO Y CONFIGURACIÓN
    // ==========================================

    // Variable inmutable para el token de recompensa (ahorra gas)
    IERC20 public immutable rewardToken;

    // Dirección del contrato verificador oficial de World ID
    IWorldID public immutable worldId;

    // El external nullifier inmutable calculado a partir del App ID y Action ID de Worldcoin
    uint256 public immutable externalNullifier;

    // ID del grupo de credenciales. Por defecto 1 (Orb)
    uint256 public immutable groupId = 1;

    // Mapping para verificar si una dirección pasó la verificación de World ID
    mapping(address => bool) public isVerified;

    // Mapping para almacenar los puntajes máximos de cada jugador
    mapping(address => uint256) public highScores;

    // Mapping de seguridad Sybil: Asocia cada ser humano (nullifier) a una única wallet
    mapping(uint256 => address) public nullifierToPlayer;

    // ==========================================
    // CUSTOM ERRORS (Optimizan el uso de Gas)
    // ==========================================
    error NotVerifiedWithWorldID();
    error ScoreNotHigher();
    error InvalidArrayLengths();
    error TransferFailed();
    error ZeroAddress();
    error ZeroAmount();
    error DuplicateNullifier();

    // ==========================================
    // EVENTS
    // ==========================================
    event Deposited(address indexed from, uint256 amount);
    event ScoreUpdated(address indexed player, uint256 newScore);
    event PlayerVerified(address indexed player, bool status);
    event RewardsDistributed(uint256 totalAmount);

    /**
     * @dev Constructor que inicializa el token, el validador de World ID y calcula el externalNullifier.
     * @param _rewardToken Dirección del ERC20 utilizado para recompensas.
     * @param _worldId Dirección del validador/router de World ID en la red.
     * @param _appId El App ID configurado en la consola de Worldcoin Developer (ej: "app_staging_123...").
     * @param _actionId El Action ID configurado para registrar puntajes (ej: "submit-highscore").
     */
    constructor(
        address _rewardToken,
        address _worldId,
        string memory _appId,
        string memory _actionId
    ) Ownable(msg.sender) {
        if (_rewardToken == address(0)) revert ZeroAddress();
        if (_worldId == address(0)) revert ZeroAddress();

        rewardToken = IERC20(_rewardToken);
        worldId = IWorldID(_worldId);

        // Pre-calculamos el externalNullifier inmutable para ahorrar gas en cada validación
        externalNullifier = abi.encodePacked(
            abi.encodePacked(_appId).hashToField(),
            _actionId
        ).hashToField();
    }

    /**
     * @dev 1. Permite a cualquiera depositar tokens en el pool de staking/recompensas.
     * @param amount Cantidad de tokens a depositar.
     */
    function deposit(uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        
        // Se asume que el usuario aprobó previamente el gasto al contrato
        if (!rewardToken.transferFrom(msg.sender, address(this), amount)) {
            revert TransferFailed();
        }
        
        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev Permite al propietario del contrato verificar manualmente a un jugador o modificar
     * el estado administrativo de verificación (por ejemplo, resolución de disputas).
     * @param player Dirección del jugador.
     * @param status Estado de verificación.
     */
    function setWorldIDVerification(address player, bool status) external onlyOwner {
        if (player == address(0)) revert ZeroAddress();
        isVerified[player] = status;
        
        emit PlayerVerified(player, status);
    }

    /**
     * @dev 2. Registra el puntaje máximo (high score) del jugador validando su World ID.
     * Realiza la llamada al router de World ID y previene ataques Sybil (1 humano = 1 wallet).
     * @param score El nuevo puntaje a registrar.
     * @param root El Merkle tree root provisto por el SDK de World ID en el frontend.
     * @param nullifierHash El hash anulador único de la persona provisto por World ID.
     * @param proof El array de 8 uint256 que compone la prueba ZK.
     */
    function submitScore(
        uint256 score,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external {
        // Generamos la señal hash usando la dirección del remitente (msg.sender)
        uint256 signalHash = abi.encodePacked(msg.sender).hashToField();

        // 1. Verificación criptográfica con el contrato verificador de World ID
        // Esto lanzará un revert interno si la prueba es incorrecta o fue manipulada
        worldId.verifyProof(
            root,
            groupId,
            signalHash,
            nullifierHash,
            externalNullifier,
            proof
        );

        // 2. Resistencia Sybil (1 humano = 1 wallet en el sistema)
        address registeredPlayer = nullifierToPlayer[nullifierHash];
        if (registeredPlayer == address(0)) {
            // Primer registro del humano: vinculamos su nullifier a su wallet actual
            nullifierToPlayer[nullifierHash] = msg.sender;
            isVerified[msg.sender] = true;
            emit PlayerVerified(msg.sender, true);
        } else if (registeredPlayer != msg.sender) {
            // Intento de utilizar otra billetera diferente por el mismo humano
            revert DuplicateNullifier();
        }

        // 3. Solo actualizar si el score es estrictamente mayor al anterior
        if (score <= highScores[msg.sender]) revert ScoreNotHigher();
        
        highScores[msg.sender] = score;
        
        emit ScoreUpdated(msg.sender, score);
    }

    /**
     * @dev 3. Distribuye las recompensas del pool a las direcciones del top del ranking.
     * Solo puede ser llamado por el dueño del contrato (o sistema automatizado asociado).
     * @param winners Array de direcciones ganadoras.
     * @param amounts Array de cantidades a distribuir correspondientes a cada ganador.
     */
    function distributeRewards(
        address[] calldata winners,
        uint256[] calldata amounts
    ) external onlyOwner {
        // Cacheamos la longitud en memoria para ahorrar algo de gas en el bucle
        uint256 length = winners.length;
        if (length != amounts.length) revert InvalidArrayLengths();
        
        uint256 totalDistributed;

        for (uint256 i = 0; i < length; ) {
            address winner = winners[i];
            uint256 amount = amounts[i];
            
            if (winner == address(0)) revert ZeroAddress();
            
            totalDistributed += amount;
            
            // Transferencia de tokens al ganador
            if (!rewardToken.transfer(winner, amount)) {
                revert TransferFailed();
            }
            
            // Incremento sin checkear desbordamiento para ahorrar gas
            unchecked {
                ++i;
            }
        }
        
        emit RewardsDistributed(totalDistributed);
    }
}
