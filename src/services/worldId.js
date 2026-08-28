import '@worldcoin/idkit-standalone';
const IDKit = window.IDKit;

// Configuración de World ID
// App ID generado en el Developer Portal de Worldcoin
const WORLDCOIN_APP_ID = 'app_16b6ce75c2caa92d0fd4d4e1f42cc2f6';
// TODO: Reemplazar con el Action ID configurado en el portal
const WORLDCOIN_ACTION = 'submit-score';

let isInitialized = false;

/**
 * Inicializa el widget de IDKit.
 * @param {string} signal - Señal opcional para prevenir ataques (e.g., la dirección del usuario).
 * @param {Function} onSuccess - Callback cuando se verifique la prueba.
 */
export function initWorldId(signal, onSuccess) {
  try {
    IDKit.init({
      app_id: WORLDCOIN_APP_ID,
      action: WORLDCOIN_ACTION,
      signal: signal,
      onSuccess: onSuccess,
      // Si la verificación se realiza enteramente on-chain, 
      // handleVerify es opcional o puede usarse para pre-verificar en backend.
      handleVerify: async (proof) => {
        // Opcional: Llamada al backend para verificar antes de la blockchain.
        console.log("Verificando prueba local/backend:", proof);
        // Si hay error, lanzar excepción. Si es exitoso, retornar (o resolver promesa)
      },
      verification_level: 'orb', // Puede ser 'device' o 'orb' dependiendo de los requisitos de seguridad
    });
    isInitialized = true;
  } catch (error) {
    console.error("Error inicializando World ID:", error);
  }
}

/**
 * Abre el modal de World ID para solicitar la Prueba de Humanidad.
 * @param {string} signal - (Opcional) La dirección de la wallet para firmar la acción.
 * @returns {Promise<Object>} Promesa que se resuelve con la prueba generada.
 */
export function verifyHumanity(signal = "") {
  return new Promise((resolve, reject) => {
    // Si queremos re-inicializar dinámicamente con una nueva señal
    try {
      IDKit.init({
        app_id: WORLDCOIN_APP_ID,
        action: WORLDCOIN_ACTION,
        signal: signal,
        onSuccess: (proof) => {
          console.log("Prueba de World ID exitosa:", proof);
          resolve(proof);
        },
        handleVerify: async (proof) => {
          // Aca se puede incluir lógica de verificación previa
          return Promise.resolve();
        },
        verification_level: 'orb',
      });
      
      // Abrimos el modal
      IDKit.open();
    } catch (error) {
      console.error("Error abriendo widget de World ID:", error);
      reject(error);
    }
  });
}
