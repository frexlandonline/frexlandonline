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
     * Requiere que el monto sea múltiplo de 10 USDC
     */
    function registrarEntrada(uint256 _monto) external nonReentrant {
        uint256 diezUsdc = 10 * 10**6;
        require(_monto >= diezUsdc, "El monto minimo es de 10 USDC");
        require(_monto % diezUsdc == 0, "El monto debe ser multiplo de 10 USDC");

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
     * Implementa temporizador semanal y escalas matemáticas para Top 3 y Top 10.
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

        // --- MATEMÁTICA DE DISTRIBUCIÓN ---
        uint256 feeAdmin = (interesGenerado * 30) / 100;
        uint256 prizePool = interesGenerado - feeAdmin;

        uint256 excedenteAdmin = 0;
        uint256 montoARepartir = prizePool;

        uint256 cienUsdc = 100 * 10**6;
        uint256 milUsdc = 1000 * 10**6;

        // Lógica de tope de 1000 USD
        if (prizePool > milUsdc) {
            montoARepartir = milUsdc;
            excedenteAdmin = prizePool - milUsdc;
        }

        // Pagar al Admin (Fee fijo + Excedente si existe)
        if (feeAdmin + excedenteAdmin > 0) {
            usdc.safeTransfer(owner(), feeAdmin + excedenteAdmin);
        }

        // Reparto a Ganadores según monto
        if (montoARepartir < cienUsdc) {
            // Repartir al Top 3
            require(ganadores.length >= 3, "Faltan direcciones para el Top 3");

            uint256 p1 = (montoARepartir * 50) / 100;
            uint256 p2 = (montoARepartir * 35) / 100;
            uint256 p3 = montoARepartir - p1 - p2; // 15% restante
            
            if (p1 > 0) usdc.safeTransfer(ganadores[0], p1);
            if (p2 > 0) usdc.safeTransfer(ganadores[1], p2);
            if (p3 > 0) usdc.safeTransfer(ganadores[2], p3);

        } else {
            // Repartir al Top 10 (montoARepartir entre 100 y 1000)
            require(ganadores.length >= 10, "Faltan direcciones para el Top 10");

            uint256 p1 = (montoARepartir * 45) / 100;
            uint256 p2 = (montoARepartir * 30) / 100;
            uint256 p3 = (montoARepartir * 10) / 100;
            uint256 pRestantesTotal = montoARepartir - p1 - p2 - p3; // 15% restante
            
            uint256 pCadaUno = pRestantesTotal / 7;

            if (p1 > 0) usdc.safeTransfer(ganadores[0], p1);
            if (p2 > 0) usdc.safeTransfer(ganadores[1], p2);
            if (p3 > 0) usdc.safeTransfer(ganadores[2], p3);

            for (uint256 i = 3; i < 9; i++) {
                if (pCadaUno > 0) usdc.safeTransfer(ganadores[i], pCadaUno);
            }
            
            // El décimo ganador se lleva el monto calculado + cualquier residuo por redondeo
            uint256 pDecimo = pRestantesTotal - (pCadaUno * 6);
            if (pDecimo > 0) usdc.safeTransfer(ganadores[9], pDecimo);
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
