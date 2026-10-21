// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IPool
 * @dev Interfaz mínima requerida para interactuar con el Pool de Aave v3
 */
interface IPool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

/**
 * @title TetrisAavePrizePool
 * @dev Contrato para la gestión de fondos del torneo, integrando rendimiento pasivo con Aave v3.
 * Red Base. (Versión Upgradeable UUPS)
 */
contract TetrisAavePrizePool is Initializable, OwnableUpgradeable, ReentrancyGuard, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    // --- VARIABLES DE ESTADO ---
    
    IERC20 public usdc;
    IERC20 public aUSDC;
    IPool public aavePool;

    mapping(address => uint256) public saldosUsuarios;
    mapping(address => uint256) public ultimoAccionar; 
    
    uint256 public totalCapitalDepositado;
    uint256 public tiempoBloqueoRetiro; 
    
    uint256 public ultimaDistribucion; // Temporizador semanal

    // --- EVENTOS ---
    
    event EntradaRegistrada(address indexed usuario, uint256 monto);
    event RetiroCapital(address indexed usuario, uint256 monto);
    event PremiosDistribuidos(uint256 interesGenerado, address[] ganadores);
    event TiempoBloqueoActualizado(uint256 nuevoTiempo);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // _disableInitializers();
    }

    /**
     * @dev Función de inicialización para el Proxy UUPS
     */
    function initialize(
        address _usdc,
        address _aUSDC,
        address _aavePool,
        uint256 _tiempoBloqueoRetiro
    ) initializer public {
        __Ownable_init(msg.sender);

        require(_usdc != address(0), "Direcciones invalidas");
        
        usdc = IERC20(_usdc);
        aUSDC = IERC20(_aUSDC);
        aavePool = IPool(_aavePool);
        tiempoBloqueoRetiro = _tiempoBloqueoRetiro;
        
        // Inicializamos el temporizador
        ultimaDistribucion = block.timestamp;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    /**
     * @dev Permite configurar el cooldown de retiro
     */
    function setTiempoBloqueoRetiro(uint256 _nuevoTiempo) external onlyOwner {
        tiempoBloqueoRetiro = _nuevoTiempo;
        emit TiempoBloqueoActualizado(_nuevoTiempo);
    }

    /**
     * @dev Registra la entrada del usuario depositando en Aave
     * Permite depositar cualquier cantidad mayor a 0 USDC
     */
    function registrarEntrada(uint256 _monto) external nonReentrant {
        require(_monto > 0, "El monto debe ser mayor a 0");

        usdc.safeTransferFrom(msg.sender, address(this), _monto);
        usdc.forceApprove(address(aavePool), _monto);
        aavePool.supply(address(usdc), _monto, address(this), 0);

        saldosUsuarios[msg.sender] += _monto;
        totalCapitalDepositado += _monto;
        ultimoAccionar[msg.sender] = block.timestamp;

        emit EntradaRegistrada(msg.sender, _monto);
    }

    /**
     * @dev Permite a un usuario retirar parte o todo su capital depositado.
     */
    function retirarCapitalParcial(uint256 _monto) external nonReentrant {
        require(_monto > 0, "El monto debe ser mayor a 0");
        require(saldosUsuarios[msg.sender] >= _monto, "Saldo insuficiente");
        require(block.timestamp >= ultimoAccionar[msg.sender] + tiempoBloqueoRetiro, "Cooldown activo: debes esperar para retirar");

        saldosUsuarios[msg.sender] -= _monto;
        totalCapitalDepositado -= _monto;
        ultimoAccionar[msg.sender] = block.timestamp;

        aavePool.withdraw(address(usdc), _monto, msg.sender);

        emit RetiroCapital(msg.sender, _monto);
    }

    /**
     * @dev Distribuye los premios del torneo basado exclusivamente en los intereses generados en Aave.
     * Reparto siempre 70% para premios de juegos y 30% para el proyecto al finalizar cada semana.
     * Puestos: 1ro 50%, 2do 30%, 3ro 10% y el otro 10% entre los 10 siguientes (o 20, 30... si supera 10 USDC c/u).
     */
    function distribuirPremiosTorneo(address[] calldata ganadores) external onlyOwner nonReentrant {
        // Validación del temporizador (1 semana)
        require(block.timestamp >= ultimaDistribucion + 7 days, "Aun no han pasado 7 dias");
        
        uint256 balanceTotalAave = aUSDC.balanceOf(address(this));
        require(balanceTotalAave > totalCapitalDepositado, "No hay intereses generados");

        uint256 interesGenerado = balanceTotalAave - totalCapitalDepositado;
        require(interesGenerado > 0, "Interes igual a cero");

        // Retirar los intereses desde Aave
        aavePool.withdraw(address(usdc), interesGenerado, address(this));
        
        // Reiniciar temporizador
        ultimaDistribucion = block.timestamp;

        // --- MATEMÁTICA DE DISTRIBUCIÓN (Siempre 30% Proyecto / 70% Juegos) ---
        uint256 feeAdmin = (interesGenerado * 30) / 100;
        uint256 montoARepartir = interesGenerado - feeAdmin;

        // Pagar 30% al Proyecto / Admin
        if (feeAdmin > 0) {
            usdc.safeTransfer(owner(), feeAdmin);
        }

        require(ganadores.length >= 3, "Faltan direcciones para el podio");

        uint256 p1 = (montoARepartir * 50) / 100;
        uint256 p2 = (montoARepartir * 30) / 100;
        uint256 p3 = (montoARepartir * 10) / 100;
        uint256 pRestantesTotal = montoARepartir - p1 - p2 - p3; // 10% restante

        if (p1 > 0 && ganadores[0] != address(0)) usdc.safeTransfer(ganadores[0], p1);
        if (p2 > 0 && ganadores[1] != address(0)) usdc.safeTransfer(ganadores[1], p2);
        if (p3 > 0 && ganadores[2] != address(0)) usdc.safeTransfer(ganadores[2], p3);

        // Escalado dinámico para los siguientes puestos (10, 20, 30... cada vez que el premio menor supere 10 USDC)
        uint256 diezUsdc = 10 * 10**6;
        uint256 cantidadSiguientes = 10;
        while ((pRestantesTotal / cantidadSiguientes) > diezUsdc) {
            cantidadSiguientes += 10;
        }

        if (ganadores.length > 3 && pRestantesTotal > 0) {
            uint256 pCadaUno = pRestantesTotal / cantidadSiguientes;
            uint256 maxIdx = ganadores.length < (3 + cantidadSiguientes) ? ganadores.length : (3 + cantidadSiguientes);
            uint256 pagadoSiguientes = 0;

            for (uint256 i = 3; i < maxIdx; i++) {
                if (pCadaUno > 0 && ganadores[i] != address(0)) {
                    usdc.safeTransfer(ganadores[i], pCadaUno);
                    pagadoSiguientes += pCadaUno;
                }
            }

            // Si quedan puestos vacantes no ocupados, el remanente va al proyecto/admin
            uint256 remanente = pRestantesTotal - pagadoSiguientes;
            if (remanente > 0) {
                usdc.safeTransfer(owner(), remanente);
            }
        } else if (pRestantesTotal > 0) {
            usdc.safeTransfer(owner(), pRestantesTotal);
        }

        emit PremiosDistribuidos(interesGenerado, ganadores);
    }

    /**
     * @dev Emergency function to push stuck USDC into Aave
     */
    function supplyExistingUSDC() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No hay USDC atascado");
        usdc.forceApprove(address(aavePool), balance);
        aavePool.supply(address(usdc), balance, address(this), 0);
    }
}
