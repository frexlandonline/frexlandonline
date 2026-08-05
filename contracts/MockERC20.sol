// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Token ERC20 mock para pruebas locales de depósitos, pools de staking y distribución de recompensas.
 */
contract MockERC20 is ERC20 {
    /**
     * @dev Constructor que inicializa el token con el nombre "Mock Tetris Token" y el símbolo "MTT".
     * Mina un suministro inicial de 1,000,000 MTT al remitente.
     */
    constructor() ERC20("Mock Tetris Token", "MTT") {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    /**
     * @dev Función libre de minado para facilitar que cualquier cuenta de pruebas obtenga tokens de prueba.
     * @param to Dirección del receptor de los tokens.
     * @param amount Cantidad a minar.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
